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

// Self-healing schema check, same pattern as inventory-service.
// This is intentionally NON-destructive (no DROP TABLE) — safe to run
// on every boot. The full migration with comments lives at
// database/002_notifications.sql for manual/first-time setup.
async function ensureSchema() {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS notification (
                notification_id     SERIAL PRIMARY KEY,
                recipient_type      VARCHAR(20) NOT NULL
                                     CHECK (recipient_type IN ('admin', 'client', 'inspector')),
                recipient_id        INTEGER NOT NULL,
                type                VARCHAR(50) NOT NULL
                                     CHECK (type IN (
                                         'estimate_approved',
                                         'low_stock',
                                         'inspection_request_submitted'
                                     )),
                title                VARCHAR(150) NOT NULL,
                message              TEXT,
                related_entity_type  VARCHAR(30),
                related_entity_id    INTEGER,
                is_read              BOOLEAN NOT NULL DEFAULT FALSE,
                created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                read_at              TIMESTAMP
            );
        `);

    await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notification_recipient_unread
                ON notification (recipient_type, recipient_id, is_read, created_at DESC);
        `);

    await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_low_stock_unique
                ON notification (related_entity_type, related_entity_id)
                WHERE type = 'low_stock' AND is_read = FALSE;
        `);

    console.log("Database schema verified for notifications.");
  } catch (err) {
    console.error("Error ensuring notification schema:", err);
  }
}

ensureSchema();
