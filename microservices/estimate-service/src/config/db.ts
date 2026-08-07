import { Pool } from "pg";
import * as dotenv from "dotenv";

if (!process.env.DB_HOST) {
  dotenv.config({ path: "../../.env.local" });
}

const pool = new Pool({
<<<<<<< HEAD
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
=======
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
>>>>>>> 3e0b845ed8acde0e3687e27b7ccc8651997612b5
});

export default pool;
