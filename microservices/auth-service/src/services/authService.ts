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
        SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email
            FROM super_admin WHERE firebase_uid = $1
        UNION ALL
        SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email
            FROM admin WHERE firebase_uid = $1
        UNION ALL
        SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email
            FROM inspector WHERE firebase_uid = $1
        UNION ALL
        SELECT 'client' AS role, client_id AS id, first_name, last_name, email
            FROM client WHERE firebase_uid = $1
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

