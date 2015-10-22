# node-multiprocessing
Dead simple parallel processing for node


## Example

```javascript
var Pool = require('multiprocessing').Pool;

function square(x) {
  return x * x;
}

var pool = new Pool(4);  // spawns 4 child processes to complete your jobs

pool.map([1, 2, 3], square)
  .then(function (result) {
    console.log(result);
  });

// [1, 4, 9]
```


## Installation

Via npm:

    npm install multiprocessing

## Writing a mapper function

Functions passed to the mapper can't reference any variables declared outside of their block scope. This is because they must be stringified in order to be passed to the child processes.

```javascript
function good(x) {
  return x * x;  // I don't reference any outside variables
}

var two = 2;
function bad(x) {
  return x * two;  // "two" wont be defined after being passed to the child proc
}
```

## API Reference

### new Pool([int numWorkers]) -> Pool

Create a new Pool with specified number of worker child processes.

Default number of workers will be the numbers of logical CPUs on the machine.

### .map(Array arr, Function|String fnOrModulePath[, int|Object chunksizeOrOptions]) -> Promise

The second argument should either be the mapper function or the absolute path of a module that exports the mapper function.

As the function must be stringified before being passed to the child process, I recommend instead using the module path for functions of non-trivial size. It will be much easier than trying to keep track of what your mapper function references.

######Option: `chunksize`
Chunksize determines the number of array elements to be passed to the work process at once. By default, the chunksize will default to the array length divided by the number of available workers. Setting this to 1 is fine for tasks that are expected to be very large, but smaller tasks will run much faster with a larger chunksize.

######Option: `timeout` [experimental]
Approximate maximum processing time to allow for a single item in the array. If more than the alloted time passes, the mapper promise will be rejected with an error saying that the task timed out.

Recommended that you use this only for longer tasks, or as a way to prevent infinite loops. Timeouts below 200ms or so can be unreliable.

```javascript
var Pool = require('multiprocessing').Pool;

function anInfiniteLoop() {
  while (true) {}
}

var pool = new Pool(4);

pool.map([1, 2, 3, 4, 5], anInfiniteLoop, {timeout: 1000})
  .catch(function (err) { console.log(err); });
  
// "Task timed out!"
```



### .apply(any arg, Function|String fnOrModulePath, Object options) -> Promise

A convenience method for calling map with a single argument. Useful for when you want to use the pool as a queue that processes jobs in a first-come, first-served manner.

Uses same options as map, but chunksize isn't used.

## License

  MIT
