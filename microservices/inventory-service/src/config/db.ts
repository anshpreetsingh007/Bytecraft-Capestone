import { Pool } from "pg";
import * as dotenv from "dotenv";

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
  dotenv.config({ path: "../../.env.local" });
}

export const pool = new Pool({
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
            ALTER TABLE items 
            ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Uncategorized',
            ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'units',
            ADD COLUMN IF NOT EXISTS reorder_threshold INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS coverage_sqft DECIMAL(10,2) DEFAULT 1.0;
        `);
    console.log("Database schema verified for inventory items.");
  } catch (err) {
    console.error("Error ensuring schema:", err);
  }
}

ensureSchema();
