const { Pool } = require('multiprocess-pool');

function square(x) {
  return x * x;
}

const pool = new Pool(4);  // spawns 4 child processes to complete your jobs

pool.map([1, 2, 3], square).then(result => console.log(result));
// [1, 4, 9]

pool.close(); // Process will hang if pool is not closed