const {Pool} = require('.');

function square(x) {
  return x * x;
}

const pool = new Pool(4);  // spawns 4 child processes to complete your jobs

pool.map([1, 2, 3], square).then(result => console.log(result));

pool.close()