import { Pool } from "pg";
import * as dotenv from "dotenv";

if (!process.env.DB_HOST) {
  dotenv.config({ path: "../../.env.local" });
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE cost_estimate 
      ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Database schema verified for cost estimates.");
  } catch (err) {
    console.error("Error ensuring schema for estimates:", err);
  }
}

ensureSchema();

export default pool;
