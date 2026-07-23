import pool from '../config/db';
import { CostEstimate, CreateEstimateInput, UpdateEstimateInput } from '../models/model';

// ─── GET ALL ESTIMATES ──────────────────────────────────────
// Optional status filter: /api/estimates?status=approved
export async function getAllEstimates(status?: string): Promise<CostEstimate[]> {
    if (status) {
        // $1 is a placeholder — pg replaces it with the value safely (prevents SQL injection)
        const result = await pool.query(
            'SELECT * FROM cost_estimate WHERE status = $1 ORDER BY estimate_date DESC',
            [status]
        );
        return result.rows;
    }

    const result = await pool.query(
        'SELECT * FROM cost_estimate ORDER BY estimate_date DESC'
    );
    return result.rows;
}

// ─── GET ESTIMATE BY ID ─────────────────────────────────────
export async function getEstimateById(id: number): Promise<CostEstimate | null> {
    const result = await pool.query(
        'SELECT * FROM cost_estimate WHERE estimate_id = $1',
        [id]
    );
    // result.rows is an array — if empty, the estimate doesn't exist
    return result.rows[0] || null;
}

// ─── GET ESTIMATES BY ORDER ─────────────────────────────────
export async function getEstimatesByOrder(orderId: number): Promise<CostEstimate[]> {
    const result = await pool.query(
        'SELECT * FROM cost_estimate WHERE order_id = $1 ORDER BY estimate_date DESC',
        [orderId]
    );
    return result.rows;
}

// ─── GET ESTIMATES BY INSPECTOR ─────────────────────────────
export async function getEstimatesByInspector(inspectorId: number): Promise<CostEstimate[]> {
    const result = await pool.query(
        'SELECT * FROM cost_estimate WHERE inspector_id = $1 ORDER BY estimate_date DESC',
        [inspectorId]
    );
    return result.rows;
}

// ─── CREATE ESTIMATE ────────────────────────────────────────
export async function createEstimate(data: CreateEstimateInput): Promise<CostEstimate> {
    const result = await pool.query(
        `INSERT INTO cost_estimate (order_id, inspector_id, admin_id, details, estimate_date, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [data.order_id, data.inspector_id, data.admin_id || null, data.details, data.estimate_date, data.status]
    );
    // RETURNING * means: after inserting, give me back the full row (including the auto-generated estimate_id)
    return result.rows[0];
}

// ─── UPDATE ESTIMATE ────────────────────────────────────────
export async function updateEstimate(id: number, data: UpdateEstimateInput): Promise<CostEstimate | null> {
    // First, get the current estimate so we can fill in any fields the user didn't send
    const current = await getEstimateById(id);
    if (!current) return null;

    const result = await pool.query(
        `UPDATE cost_estimate
     SET order_id = $1,
         inspector_id = $2,
         admin_id = $3,
         details = $4,
         estimate_date = $5,
         status = $6
     WHERE estimate_id = $7
     RETURNING *`,
        [
            data.order_id ?? current.order_id,           // if data.order_id is undefined, keep the current value
            data.inspector_id ?? current.inspector_id,
            data.admin_id !== undefined ? data.admin_id : current.admin_id,
            data.details ?? current.details,
            data.estimate_date ?? current.estimate_date,
            data.status ?? current.status,
            id
        ]
    );
    return result.rows[0];
}

// ─── UPDATE STATUS ONLY ─────────────────────────────────────
export async function updateEstimateStatus(id: number, status: string): Promise<CostEstimate | null> {
    const result = await pool.query(
        `UPDATE cost_estimate SET status = $1 WHERE estimate_id = $2 RETURNING *`,
        [status, id]
    );
    return result.rows[0] || null;
}

// ─── DELETE ESTIMATE ────────────────────────────────────────
export async function deleteEstimate(id: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM cost_estimate WHERE estimate_id = $1',
        [id]
    );
    // result.rowCount tells you how many rows were deleted — 0 means the ID didn't exist
    return (result.rowCount ?? 0) > 0;
}
