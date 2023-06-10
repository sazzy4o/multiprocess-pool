# The multiprocess-pool Library
Simple Node.js multiprocessing library similar to multiprocessing.Pool in Python

## Features

- 🔥 [Blazing](https://twitter.com/acdlite/status/974390255393505280) fast
- 🚫 No dependencies!
- 🤖 Supports running functions and worker scripts on another process
- 🚀 Can signifcantly speed up your code
- 🔒 Supports TypeScript
- 😌 Simple to use and easy to learn

## Installation

Via npm:

    npm install multiprocess-pool

## Simple Example

```javascript
const { Pool } = require('multiprocess-pool');

function square(x) {
  return x * x;
}

const pool = new Pool(4);  // spawns 4 child processes to complete your jobs

pool.map([1, 2, 3], square).then(result => console.log(result));
// [1, 4, 9]

pool.close(); // Process will hang if pool is not closed
```

## Promise + Module worker example
```javascript
// ./worker.js
module.exports = async function squareAsync(x) {
  return x * x;
};
```

```javascript
// ./main.js
const { Pool } = require('multiprocess-pool');
const pool = new Pool(4);
pool.map([1, 2, 3, 4], __dirname + '/worker')
  .then(function (res) {
    console.log(res); // [1, 4, 9, 16]
  });
pool.close();
```

## Require example
```javascript
const { Pool } = require('multiprocess-pool');

function getPath(relPath) {
  const path = require("path");
  return path.resolve(relPath);
}

const pool = new Pool(3);  // spawns 3 child processes to complete your jobs

pool.map([".", "..", "../../"], getPath).then(result => console.log(result));
// [/home/username/git/multiprocess-pool, /home/username/git, /home/username]

pool.close(); // Process will hang if pool is not closed
```

## More examples
All examples are avaliable in the [examples folder](https://github.com/sazzy4o/multiprocess-pool/tree/main/examples)

## Writing a mapper function

Functions passed to the mapper can't reference any variables declared outside of their block scope. This is because they must be stringified in order to be passed to the child processes.

```javascript
function good(x) {
  return x * x;  // I don't reference any outside variables
}

const two = 2;
function bad(x) {
  return x * two;  // "two" wont be defined after being passed to the child proc
}
```

## API Reference

### new Pool([int numWorkers]) -> Pool

Create a new Pool with specified number of worker child processes.

Default number of workers will be the numbers of logical CPUs on the machine.

##### .map(Array arr, Function|String fnOrModulePath[, int|Object chunksizeOrOptions]) -> Promise

The second argument should either be the mapper function or the absolute path of a module that exports the mapper function.

As the function must be stringified before being passed to the child process, I recommend instead using the module path for functions of non-trivial size. It will be much easier than trying to keep track of what your mapper function references.

###### Option: chunksize
Chunksize determines the number of array elements to be passed to the work process at once. By default, the chunksize will default to the array length divided by the number of available workers. Setting this to 1 is fine for tasks that are expected to be very large, but smaller tasks will run much faster with a larger chunksize.

###### Option: onResult
Takes a function that is called with each result as it comes in. Useful for streaming.

NOTE: The onResult is called in whatever order results come back in. This may not be the same order as the input array.

```javascript
const { Pool } = require('multiprocess-pool');

function square(x) {
  return x * x;
}

const pool = new Pool(4);

result = []
pool.map([1, 2, 3], square, {onResult: val => { result.push(val) }})
  .then(() => console.log(result));
// prints "[4, 9, 1]"
// OR in some other order, depending on how we receive the results!
pool.close();
```

###### Option: timeout [experimental]
Approximate maximum processing time to allow for a single item in the array. If more than the alloted time passes, the mapper promise will be rejected with an error saying that the task timed out.

Recommended that you use this only for longer tasks, or as a way to prevent infinite loops. Timeouts below 200ms or so can be unreliable.

```javascript
const { Pool } = require('multiprocess-pool');

function anInfiniteLoop() {
  while (true) {}
}

const pool = new Pool(4);

pool.map([1, 2, 3, 4, 5], anInfiniteLoop, {timeout: 1000})
  .catch(err => console.log(err));

// "Task timed out!"
```

##### .apply(any arg, Function|String fnOrModulePath[, Object options]) -> Promise

A convenience method for calling map with a single argument. Useful for when you want to use the pool as a queue that processes jobs in a first-come, first-served manner.

Uses same options as map, but chunksize will be ignored.

##### .close()

Terminates worker processes after waiting for outstanding jobs. Calling methods of the pool after this will result in an error.

##### .terminate()

Like `#close`, but will immediately terminate worker processes. All outstanding jobs at the time this method is called will have their promises rejected.


### new PriorityQueue(numWorkers) -> PriorityQueue

A max priority queue built off of a pool of worker processes. Items with a higher priority will be processed first.

##### .push(any arg, number priority, Function|String fnOrModulePath[, Object options]) -> Promise

Pushes an item onto the queue and returns a promise that will be resolved with the result or rejected if any errors were raised.

```javascript
const { PriorityQueue } = require('multiprocess-pool');

function square(x) {
  return x * x;
}

// one worker guarantees ordering -- multiple workers will only start tasks in order
const pq = new PriorityQueue(1);

pq.push(25, 1, square).then(console.log),
pq.push(100, 3, square).then(console.log),
pq.push(50, 2, square).then(console.log),
pq.push(10, 4, square).then(console.log)

// >>> 625   <- low priority, but gets kicked off first
// >>> 100   <- highest priority
// >>> 10000
// >>> 2500
```

Uses same options as Pool.map, but chunksize will be ignored.

## License

  MIT

## Original Project
This project was forked from [node-multiprocessing](https://github.com/ryanpon/node-multiprocessing).