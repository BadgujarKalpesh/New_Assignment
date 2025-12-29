const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // Default user
  host: 'localhost',       // Database runs on your machine
  database: 'telemetry_db', // The DB name we just created
  password: 'Rushi@123', // <--- PUT YOUR POSTGRES PASSWORD HERE
  port: 5432,              // Default Postgres port
});

module.exports = pool;