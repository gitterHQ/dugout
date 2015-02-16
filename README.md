# Dugout

> Dugout (n): [duhg-out]: a (slow) boat made from a log.

Dugout is a simple utility for viewing MongoDB slowlog information real-time.

```shell
npm install -g dugout
```

Usage:
```shell
# Single instance, profile all executions
$ dugout -u mongodb://localhost/test -t all

# Single instance, profile with a threshold of 100ms
$ dugout -u mongodb://localhost/test -t 100

# Single instance, using the pre-existing MongoDB profiling settings
$ dugout -u mongodb://localhost/test

# For a replica-set:
$ dugout -u mongodb://localhost:27017,localhost:27018/test?replicaSet=testReplicaSet -t 100
```

# Licence

License
The MIT License (MIT)

Copyright (c) 2014, Andrew Newdigate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



