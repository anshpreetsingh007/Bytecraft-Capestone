import { pool } from '../config/db';
import {
    DirectoryUser,
    InspectorSummary,
    RegisterClientInput,
    ResolvedUser,
    UpdateProfileInput,
    UserRole,
} from '../models/model';
import { conflict, invalidateIdentity, notFound, type Pagination } from '../shared';

/** Table and primary key for each role, so role handling stays data-driven. */
const ROLE_TABLES: Record<UserRole, { table: string; idColumn: string }> = {
    client: { table: 'client', idColumn: 'client_id' },
    inspector: { table: 'inspector', idColumn: 'inspector_id' },
    admin: { table: 'admin', idColumn: 'admin_id' },
    super_admin: { table: 'super_admin', idColumn: 'super_admin_id' },
};

const RESOLVE_SQL = `
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

export async function resolveByFirebaseUid(firebaseUid: string): Promise<ResolvedUser | null> {
    const result = await pool.query(RESOLVE_SQL, [firebaseUid]);
    const row = result.rows.find((candidate) => candidate.is_active !== false);
    if (!row) return null;

    return {
        role: row.role,
        id: Number(row.id),
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        isActive: true,
    };
}

export async function registerClient(data: RegisterClientInput): Promise<ResolvedUser> {
    const result = await pool.query(
        `INSERT INTO client
            (firebase_uid, first_name, last_name, email, role_client, phone, address,
             consent_accepted_at, consent_version)
         VALUES ($1, $2, $3, $4, 'client', $5, $6,
                 CASE WHEN $7::text IS NULL THEN NULL ELSE now() END, $7)
         RETURNING client_id, first_name, last_name, email, is_active`,
        [
            data.firebase_uid,
            data.first_name,
            data.last_name,
            data.email,
            data.phone,
            data.address,
            data.consent_version,
        ],
    );

    const row = result.rows[0];
    return {
        role: 'client',
        id: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        isActive: row.is_active !== false,
    };
}

export async function updateProfile(
    role: UserRole,
    id: number,
    data: UpdateProfileInput,
): Promise<ResolvedUser> {
    const { table, idColumn } = ROLE_TABLES[role];

    // client is the only identity table carrying a postal address, and admin
    // has no phone column, so the SET list is built per role.
    const assignments = ['first_name = COALESCE($2, first_name)', 'last_name = COALESCE($3, last_name)'];
    const params: unknown[] = [id, data.first_name ?? null, data.last_name ?? null];

    if (role !== 'admin') {
        params.push(data.phone ?? null);
        assignments.push(`phone = COALESCE($${params.length}, phone)`);
    }
    if (role === 'client') {
        params.push(data.address ?? null);
        assignments.push(`address = COALESCE($${params.length}, address)`);
    }

    const result = await pool.query(
        `UPDATE ${table} SET ${assignments.join(', ')}
         WHERE ${idColumn} = $1
         RETURNING ${idColumn} AS id, first_name, last_name, email, is_active`,
        params,
    );

    const row = result.rows[0];
    if (!row) throw notFound('Your profile could not be found');

    return {
        role,
        id: Number(row.id),
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        isActive: row.is_active !== false,
    };
}

export async function listInspectors(includeInactive = false): Promise<InspectorSummary[]> {
    const result = await pool.query(
        `SELECT inspector_id, first_name, last_name, email, phone
         FROM inspector
         ${includeInactive ? '' : 'WHERE is_active'}
         ORDER BY first_name, last_name`,
    );
    return result.rows;
}

const DIRECTORY_SQL = `
    SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email,
           firebase_uid, phone, is_active, 4 AS rank
        FROM super_admin
    UNION ALL
    SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email,
           firebase_uid, NULL AS phone, is_active, 3 AS rank
        FROM admin
    UNION ALL
    SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email,
           firebase_uid, phone, is_active, 2 AS rank
        FROM inspector
    UNION ALL
    SELECT 'client' AS role, client_id AS id, first_name, last_name, email,
           firebase_uid, phone, is_active, 1 AS rank
        FROM client
`;

/**
 * The super admin user directory.
 *
 * Deduplication by firebase_uid has to happen after the union, because one
 * person legitimately has rows in several tables. Paginating in SQL would
 * therefore slice the page in the wrong place, so the page is taken after the
 * dedupe. Fine at this scale; if the user base outgrows it, this becomes a
 * materialised view.
 */
export async function listUsers(
    page: Pagination,
    search: string | null,
): Promise<{ rows: DirectoryUser[]; total: number }> {
    const result = await pool.query(DIRECTORY_SQL);

    const byUid = new Map<string, DirectoryUser & { rank: number }>();
    for (const row of result.rows) {
        // A demoted staff row is inactive, so it must never outrank the active
        // client row underneath it.
        const candidate = {
            role: row.role as UserRole,
            id: Number(row.id),
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            firebaseUid: row.firebase_uid,
            phone: row.phone ?? null,
            isActive: row.is_active !== false,
            rank: row.is_active === false ? -1 : Number(row.rank),
        };
        const existing = byUid.get(row.firebase_uid);
        if (!existing || candidate.rank > existing.rank) byUid.set(row.firebase_uid, candidate);
    }

    let users = Array.from(byUid.values()).map(({ rank, ...user }) => user);

    if (search) {
        const needle = search.toLowerCase();
        users = users.filter(
            (user) =>
                user.email.toLowerCase().includes(needle) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(needle),
        );
    }

    users.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    return { rows: users.slice(page.offset, page.offset + page.limit), total: users.length };
}

export interface RoleChangeResult {
    previousRole: UserRole | null;
    newRole: UserRole;
}

/**
 * Promote or demote an account.
 *
 * Demotion deactivates the staff row instead of deleting it. The old code ran
 * `DELETE FROM inspector`, which now fails outright against the foreign key
 * from inspection_request -- and before that constraint existed it silently
 * orphaned the history of every job that person had worked.
 */
export async function assignRole(
    firebaseUid: string,
    newRole: UserRole,
    profile: { firstName: string; lastName: string; email: string },
): Promise<RoleChangeResult> {
    if (newRole === 'super_admin') {
        throw conflict('Super admin has to be granted directly in the database');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const current = await client.query(RESOLVE_SQL, [firebaseUid]);
        const activeRow = current.rows.find((row) => row.is_active !== false);
        const previousRole = (activeRow?.role as UserRole | undefined) ?? null;

        if (previousRole === 'super_admin') {
            throw conflict('A super admin cannot be demoted from here');
        }

        if (newRole === 'client') {
            await client.query('UPDATE admin SET is_active = FALSE WHERE firebase_uid = $1', [firebaseUid]);
            await client.query('UPDATE inspector SET is_active = FALSE WHERE firebase_uid = $1', [firebaseUid]);
            const clientRow = await client.query(
                'UPDATE client SET is_active = TRUE WHERE firebase_uid = $1 RETURNING client_id',
                [firebaseUid],
            );
            if (clientRow.rowCount === 0) {
                throw notFound('That account has no customer profile to fall back to');
            }
        } else {
            const { table } = ROLE_TABLES[newRole];
            const roleColumn = newRole === 'inspector' ? 'role_inspector' : 'role_admin';

            // Re-promoting somebody previously demoted reactivates their old
            // row rather than creating a duplicate.
            await client.query(
                `INSERT INTO ${table} (firebase_uid, first_name, last_name, email, ${roleColumn}, is_active)
                 VALUES ($1, $2, $3, $4, $5, TRUE)
                 ON CONFLICT (firebase_uid) DO UPDATE
                    SET is_active = TRUE,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        email = EXCLUDED.email`,
                [firebaseUid, profile.firstName, profile.lastName, profile.email, newRole],
            );

            // Staff roles are exclusive: an admin is not also an inspector.
            const other = newRole === 'inspector' ? 'admin' : 'inspector';
            await client.query(`UPDATE ${other} SET is_active = FALSE WHERE firebase_uid = $1`, [firebaseUid]);
        }

        await client.query('COMMIT');
        // The 30 second identity cache would otherwise keep serving the old
        // role to the other six services.
        invalidateIdentity(firebaseUid);
        return { previousRole, newRole };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function setAccountActive(firebaseUid: string, isActive: boolean): Promise<number> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let affected = 0;
        for (const { table } of Object.values(ROLE_TABLES)) {
            const result = await client.query(
                `UPDATE ${table} SET is_active = $2 WHERE firebase_uid = $1`,
                [firebaseUid, isActive],
            );
            affected += result.rowCount ?? 0;
        }
        if (affected === 0) throw notFound('No account found for that user');
        await client.query('COMMIT');
        invalidateIdentity(firebaseUid);
        return affected;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function listAuditLog(
    page: Pagination,
    query: { entityType: string | null; action: string | null },
): Promise<{ rows: unknown[]; total: number }> {
    const filters: string[] = [];
    const params: unknown[] = [];

    if (query.entityType) {
        params.push(query.entityType);
        filters.push(`entity_type = $${params.length}`);
    }
    if (query.action) {
        params.push(query.action);
        filters.push(`action = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [rows, total] = await Promise.all([
        pool.query(
            `SELECT * FROM audit_log ${where}
             ORDER BY created_at DESC, audit_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM audit_log ${where}`, params),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}
