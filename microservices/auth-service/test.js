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

const sql = `
    SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email, is_active, 4 AS rank
        FROM super_admin WHERE firebase_uid = $1
    UNION ALL
    SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email, is_active, 3 AS rank
        FROM admin WHERE firebase_uid = $1
    UNION ALL
    SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email, is_active, 2 AS rank
        FROM inspector WHERE firebase_uid = $1
    UNION ALL
    SELECT 'client' AS role, client_id AS id, first_name, last_name, email, is_active, 1 AS rank
        FROM client WHERE firebase_uid = $1
    ORDER BY rank DESC
`;

pool.query(sql, ['test-uid'])
    .then(r => {
        console.log('Query OK, rows:', r.rows.length);
        pool.end();
    })
    .catch(e => {
        console.error('Query FAILED:', e.message);
        pool.end();
    });
