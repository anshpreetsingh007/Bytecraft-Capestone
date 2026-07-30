import { Pool } from 'pg';
import * as dotenv from 'dotenv';

<<<<<<< HEAD
// In Docker, env vars are injected by compose. Only load .env.local for local dev.
=======
>>>>>>> origin/main
if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

<<<<<<< HEAD
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export default pool;
=======
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
>>>>>>> origin/main
