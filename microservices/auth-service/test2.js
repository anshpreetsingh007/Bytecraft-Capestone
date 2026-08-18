const { Pool } = require('pg');
const pool = new Pool({
    host: 'markit-roofing-db-sait26.postgres.database.azure.com',
    port: 5432,
    database: 'markit_roofing',
    user: 'markitadmin',
    password: 'Bytecraft123.',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

pool.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('client', 'inspector', 'admin', 'super_admin')`)
    .then(r => {
        console.log(r.rows.filter(row => row.column_name.includes('active') || row.column_name.includes('status')));
        pool.end();
    })
    .catch(e => {
        console.error('FAILED:', e.message);
        pool.end();
    });
