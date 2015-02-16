
var App = new Marionette.Application();

App.addRegions({ 'masterRegion': '#master' });

App.module('ProfilerModule', function (Mod, App, Backbone, Marionette, $, _) {
  'use strict';

  var ItemView = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'row',
    ui: {
      row: '#master-row'
    },
    events: {
      'click @ui.row': 'toggle'
    },
    modelEvents: {
      change: 'render'
    },
    template: Handlebars.compile($('#item-tpl').html()),
    toggle: function() {
      this.model.set('showDetail', !this.model.get('showDetail'));
    },
    serializeData: function() {
      var data = this.model.toJSON();
      data.serializedProfile = JSON.stringify(data.profile, null, '  ');
      data.serializedPlan = JSON.stringify(data.plan, null, '  ');
      return data;
    }
  });


  var CompositeView = Marionette.CompositeView.extend({
    childView: ItemView,
    childViewContainer: '#master-container',
    template: Handlebars.compile($('#master-tpl').html()),
    events: {
      'click a.sort': 'sortClicked'
    },
    initialize: function() {
      this.setSort('num');
    },
    setSort: function(field) {
      function natural(a, b) {
        /* Deal with undefined values */
        if (!a) {
          if (!b) return 0;
          return -1;
        }

        if (!b) {
          return 1;
        }

        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      }

      function comparator(a, b) {
        if (field === 'num') return natural(a.get('num'), b.get('num'));
        return natural(a.get('profile')[field], b.get('profile')[field]);
      }

      function reverse(fn) {
        return function(a, b) {
          return fn(b, a);
        };
      }

      if (this.collection.sortField === field) {
        this.collection.sortField = '-' + field;
        this.collection.comparator = reverse(comparator);
      } else {
        this.collection.sortField = field;
        this.collection.comparator = comparator;
      }

      this.collection.sort();
    },
    sortClicked: function(event) {
      this.setSort(event.target.dataset.sortField);
    }
  });

  var ChartView =  Marionette.ItemView.extend({
    template: false,
    ui: {
      chart: '#chart'
    },
    initialize: function() {
      this.data = [];
    },
    onRender: function() {
      var graph = this.graph = new Rickshaw.Graph( {
          element: this.ui.chart[0],
          width: this.ui.chart[0].clientWidth,
          height: 70,
          renderer: 'bar',
          series: new Rickshaw.Series.FixedDuration([
            { name: 'millis', renderer: 'line' },
            { name: 'count', renderer: 'bar' },
            ], undefined, {
            timeInterval: 1000,
            maxDataPoints: 600,
            timeBase: new Date().getTime() / 1000
          })
      });

      var self = this;
      setInterval(function() {
        var aggregateData = self.data.reduce(function(memo, d) {
          Object.keys(d).forEach(function(key) {
            if (!d[key]) return;

            if(memo[key]) {
              memo[key] += d[key];
            } else {
              memo[key] = d[key];
            }
          });

          return memo;
        }, {});

        aggregateData.millis =  self.data.length ? aggregateData.millis / self.data.length : 0;

        graph.series.addData(aggregateData);
        graph.update();
        self.data = [];
      }, 1000);

      new Rickshaw.Graph.HoverDetail( {
        graph: graph
      });

      graph.render();
    },
    addPoint: function(value) {
      this.data.push({ count: 1, millis: value.profile.millis });
    }
  });

  var Controller = Marionette.Controller.extend({
    initialize: function () {
    },
    show: function () {
      var collection = this.collection = new Backbone.Collection([]);
      var view = this.view = new CompositeView({
        collection: collection,
        el: '#master'
      });
      view.render();

      var chartView = new ChartView({
        el: '#chart-container'
      });
      chartView.render();

      var count = 1;
      var socket = new WebSocket("ws://localhost:8000/");
      socket.onerror = function(err) {
        console.log("error",err);
      };

      socket.onmessage = function(event) {
        var data = event.data;
        var profile = JSON.parse(data);
        profile.num = count++;
        collection.add(new Backbone.Model(profile));
        chartView.addPoint(profile);
        var excess;
        if (collection.sortField && collection.sortField.charAt(0) === '-') {
          excess = collection.toArray().slice(50);
        } else {
          excess = collection.toArray().slice(0, -50);
        }

        collection.remove(excess);
      };

    }
  });

  Mod.addInitializer(function () {
    Mod.controller = new Controller();
    Mod.controller.show();
  });

}, Handlebars);

App.start();
