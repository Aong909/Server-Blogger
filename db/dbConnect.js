const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const { Pool } = pg;

// const pool = new Pool({
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
// });

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

module.exports = pool;
