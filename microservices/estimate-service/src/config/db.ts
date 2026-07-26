import { Pool } from 'pg';
import * as dotenv from 'dotenv';


if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export default pool;

