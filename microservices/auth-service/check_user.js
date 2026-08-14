require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});
pool.query("SELECT * FROM super_admin WHERE email='anshpret003@gmail.com'")
  .then(res => { console.log(JSON.stringify(res.rows)); process.exit(0); })
  .catch(console.error);
