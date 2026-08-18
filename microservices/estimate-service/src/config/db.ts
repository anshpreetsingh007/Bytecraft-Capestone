import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

/**
 * Shared connection pool.
 *
 * Notes on the settings:
 *  - `max` is deliberately small. Seven services against one Postgres adds up
 *    fast, and the default of 10 each is 70 connections for a workload that
 *    never needs them.
 *  - `statement_timeout` stops one pathological query pinning a connection
 *    forever; it surfaces as a 504 through the shared error handler.
 *  - There is no `pool.on('error', () => process.exit(-1))` here any more.
 *    That turned a routine dropped idle connection -- which pg recovers from
 *    on its own -- into a crashed container. The shared app bootstrap logs it
 *    instead.
 */
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
});

export default pool;
