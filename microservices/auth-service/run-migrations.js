const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'markit-roofing-db-sait26.postgres.database.azure.com',
    port: 5432,
    database: 'markit_roofing',
    user: 'markitadmin',
    password: 'Bytecraft123.',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

async function runMigrations() {
    try {
        const rootDir = path.resolve(__dirname, '../../database/migrations');
        const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql')).sort();
        
        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(rootDir, file), 'utf8');
            await pool.query(sql);
            console.log(`Success: ${file}`);
        }
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

runMigrations();
