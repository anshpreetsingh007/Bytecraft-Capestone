const { Pool } = require('pg');

const pool = new Pool({
  host: 'markit-roofing-db-sait26.postgres.database.azure.com',
  port: 5432,
  database: 'markit_roofing',
  user: 'markitadmin',
  password: 'Bytecraft123.',
  ssl: { rejectUnauthorized: false }
});

async function promote() {
  const email = 'anshpret003@gmail.com';
  console.log(`Promoting ${email} to Super Admin...`);

  try {
    const res = await pool.query("SELECT * FROM client WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      console.log("Error: User not found in client table. Did you create the account?");
      process.exit(1);
    }
    const user = res.rows[0];

    await pool.query(
      "INSERT INTO super_admin (firebase_uid, first_name, last_name, email, role_superadmin) VALUES ($1, $2, $3, $4, 'super_admin') ON CONFLICT DO NOTHING",
      [user.firebase_uid, user.first_name, user.last_name, user.email]
    );

    await pool.query("DELETE FROM client WHERE firebase_uid = $1", [user.firebase_uid]);

    console.log(`Success! ${email} is now a super admin.`);
  } catch (err) {
    console.error("Error running query:", err);
  } finally {
    await pool.end();
  }
}

promote();
