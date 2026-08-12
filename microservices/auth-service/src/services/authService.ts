import { pool } from "../config/db";
import { ResolvedUser, RegisterClientInput } from "../models/model";

// ─── RESOLVE: firebase_uid -> { role, id, name, email } ─────
// Checks all four identity tables in a single query. A firebase_uid should
// only ever exist in one of them, but LIMIT 1 guards against that anyway.
export async function resolveByFirebaseUid(
  firebaseUid: string,
): Promise<ResolvedUser | null> {
  const result = await pool.query(
    `
        SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email, 4 AS priority
            FROM super_admin WHERE firebase_uid = $1
        UNION ALL
        SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email, 3 AS priority
            FROM admin WHERE firebase_uid = $1
        UNION ALL
        SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email, 2 AS priority
            FROM inspector WHERE firebase_uid = $1
        UNION ALL
        SELECT 'client' AS role, client_id AS id, first_name, last_name, email, 1 AS priority
            FROM client WHERE firebase_uid = $1
        ORDER BY priority DESC
        LIMIT 1
        `,
    [firebaseUid],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    role: row.role,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  };
}

// ─── REGISTER: create a new client row after Firebase signup ───
export async function registerClient(
  data: RegisterClientInput,
): Promise<ResolvedUser> {
  const result = await pool.query(
    `INSERT INTO client (firebase_uid, first_name, last_name, email, role_client, phone, address)
         VALUES ($1, $2, $3, $4, 'client', $5, $6)
         RETURNING client_id, first_name, last_name, email`,
    [
      data.firebase_uid,
      data.first_name,
      data.last_name,
      data.email,
      data.phone ?? null,
      data.address ?? null,
    ],
  );

  const row = result.rows[0];
  return {
    role: "client",
    id: row.client_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  };
}

// ─── GET ALL INSPECTORS ───
export async function getAllInspectors(): Promise<ResolvedUser[]> {
  const result = await pool.query(
    `SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email
     FROM inspector`
  );

  return result.rows.map(row => ({
    role: row.role,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  }));
}

// ─── GET ALL USERS (FOR SUPER ADMIN) ───
export async function getAllUsers(): Promise<(ResolvedUser & { firebaseUid: string })[]> {
  const result = await pool.query(
    `
        SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email, firebase_uid
            FROM super_admin
        UNION ALL
        SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email, firebase_uid
            FROM admin
        UNION ALL
        SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email, firebase_uid
            FROM inspector
        UNION ALL
        SELECT 'client' AS role, client_id AS id, first_name, last_name, email, firebase_uid
            FROM client
        `
  );

  // Since a user might exist in multiple tables (e.g. client and inspector), 
  // we will deduplicate them by firebase_uid, keeping the highest privilege role.
  // The UNION ALL order doesn't guarantee final result order, so we do it in code.
  const rolePriority: Record<string, number> = {
    'super_admin': 4,
    'admin': 3,
    'inspector': 2,
    'client': 1
  };

  const userMap = new Map<string, any>();
  for (const row of result.rows) {
    const existing = userMap.get(row.firebase_uid);
    if (!existing || rolePriority[row.role] > rolePriority[existing.role]) {
      userMap.set(row.firebase_uid, row);
    }
  }

  return Array.from(userMap.values()).map(row => ({
    role: row.role,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    firebaseUid: row.firebase_uid
  }));
}

// ─── ASSIGN ROLE (FOR SUPER ADMIN) ───
export async function assignRole(firebaseUid: string, newRole: string, firstName: string, lastName: string, email: string): Promise<void> {
  // We only support promoting to inspector or admin. 
  // Super admin should be done directly in DB. Client is default.
  if (newRole === 'inspector') {
    await pool.query(
      `INSERT INTO inspector (firebase_uid, first_name, last_name, email, role_inspector)
       VALUES ($1, $2, $3, $4, 'inspector')
       ON CONFLICT (firebase_uid) DO NOTHING`,
      [firebaseUid, firstName, lastName, email]
    );
  } else if (newRole === 'admin') {
    await pool.query(
      `INSERT INTO admin (firebase_uid, first_name, last_name, email, role_admin)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (firebase_uid) DO NOTHING`,
      [firebaseUid, firstName, lastName, email]
    );
  } else if (newRole === 'client') {
    // Demoting back to client: we delete them from admin/inspector if they exist there.
    // They should already have a client record from when they first signed up.
    await pool.query(`DELETE FROM admin WHERE firebase_uid = $1`, [firebaseUid]);
    await pool.query(`DELETE FROM inspector WHERE firebase_uid = $1`, [firebaseUid]);
  } else {
    throw new Error(`Unsupported role assignment: ${newRole}`);
  }
}

