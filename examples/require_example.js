const { Pool } = require('multiprocess-pool');

function getPath(relPath) {
  const path = require("path");
  return path.resolve(relPath);
}

const pool = new Pool(4);  // spawns 4 child processes to complete your jobs

pool.map([".", "..", "../../"], getPath).then(result => console.log(result));
// [/home/username/git/multiprocess-pool, /home/username/git, /home/vonderoh]

pool.close() // Process will hang if pool is not closed