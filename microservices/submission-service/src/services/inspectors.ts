import pool from '../config/db';
import { Inspector } from '../models/model';

/** Lookup list that powers the assignment and estimate-creation dropdowns. */
export async function getAllInspectors(includeInactive = false): Promise<Inspector[]> {
    const result = await pool.query(
        `SELECT inspector_id, first_name, last_name, email, phone
         FROM inspector
         ${includeInactive ? '' : 'WHERE is_active'}
         ORDER BY first_name, last_name`,
    );
    return result.rows;
}

export async function inspectorExists(inspectorId: number): Promise<boolean> {
    const result = await pool.query(
        'SELECT 1 FROM inspector WHERE inspector_id = $1 AND is_active',
        [inspectorId],
    );
    return (result.rowCount ?? 0) > 0;
}
