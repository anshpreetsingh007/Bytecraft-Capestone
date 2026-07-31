import pool from '../config/db';
import { Inspector } from '../models/model';

// GET ALL INSPECTORS
// Simple lookup list - used by the estimate-creation form's inspector
export async function getAllInspectors(): Promise<Inspector[]> {
    const result = await pool.query(
        'SELECT inspector_id, first_name, last_name, email FROM inspector ORDER BY first_name, last_name'
    );
    return result.rows;
}