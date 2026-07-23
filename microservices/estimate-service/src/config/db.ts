import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

console.log('db.ts sees DB_PASSWORD as:', process.env.DB_PASSWORD ? 'SET' : 'UNDEFINED');
console.log('db.ts sees DB_USER as:', process.env.DB_USER);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export default pool;
