#!/usr/bin/env node

'use strict';

var mongodb       = require('mongodb');
var MongoClient   = mongodb.MongoClient;
var staticServe   = require('node-static');
var WebSocket     = require('faye-websocket');
var http          = require('http');
var mongoProfiler = require('mongodb-profiler');
var Readable      = require('stream').Readable;

var profileEventsStream = new Readable({ objectMode: true });
profileEventsStream._read = function noop() {}; // redundant? see update below

var opts = require("nomnom")
   .option('uri', {
      abbr: 'u',
      required: true,
      help: 'Mongo URI to connect to (eg: mongodb://localhost/test?replicaSet=troupeSet)'
   })
   .option('threshold', {
      abbr: 't',
      help: 'Minimum execution time for profiling threshold, in milliseconds, or `all` for all executions. Omit this value to use the existing mongo profiling levels.'
   })
   .parse();



function die(err) {
  console.error(err);
  process.exit(1);
}

var file = new staticServe.Server('./public');
var originalMimeLookup = staticServe.mime.lookup;
staticServe.mime.lookup = function(path) {
  return originalMimeLookup.call(staticServe.mime, path) + ";charset=utf-8";
};

MongoClient.connect(opts.uri, { native_parser: true }, function(err, db) {
  if (err) return die(err);

  var profilerOpts = { db: db };
  if (opts.threshold === 'all') {
    profilerOpts.profile = { all: true };
  } else if (opts.threshold) {
    profilerOpts.profile = { slow: parseInt(opts.threshold, 10) };
  }
  var profiler = mongoProfiler(profilerOpts);

  process.on('SIGINT', function() {
    console.log('Reverting profiling information to original values');
    profiler.stop(function() {
      process.exit();
    });
  });

  profiler.on('profile', function(profile) {
    if (profile.collection === 'system.indexes') return; // Ignore system.indexes
    if (profile.query && profile.query.$explain) return; // Ignore explain plans

    profileEventsStream.push(JSON.stringify({ profile: profile }));
  });

  var server = http.createServer(function (request, response) {
    file.serve(request, response);
  });

  server.on('upgrade', function(request, socket, body) {
    var ws;

    if (WebSocket.isWebSocket(request)) {
      ws = new WebSocket(request, socket, body);

      profileEventsStream.pipe(ws);

      ws.on('message', function(event) {
        var message = JSON.parse(event.data);
        switch(message.action) {
          case 'explain':
            profiler.explainProfile(message.profile, function(err, plan) {
              if (err) return console.log('Explain profile failed: ', err);
              ws.send(JSON.stringify({ num: message.num, plan: plan }));
            });
            break;
        }
        ws.send(event.data);
      });
    }
  });

  server.listen(8000, function(err) {
    if (err) die(err);

    console.log('Now open http://localhost:8000/ in your browser to view slowlog events');
  });

});
