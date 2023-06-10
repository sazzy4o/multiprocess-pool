const { Pool } = require('multiprocess-pool');
const pool = new Pool(4);
pool.map([1, 2, 3, 4], __dirname + '/worker')
  .then(function (res) {
    console.log(res);
  });
pool.close();