/**
 * Estimate Database Service
 * 
 * Handles all direct database interactions (CRUD operations) for cost estimates
 * using the shared PostgreSQL database pool.
 */
import pool from '../config/db';
import { CostEstimate, CreateEstimateInput, UpdateEstimateInput, CostEstimateWithNames } from '../models/model';
import { notifyEstimateApproved } from './notifyClient';

// Shared join used by both getAllEstimates and getEstimateById so the admin
// UI can show "Jane Doe" instead of client_id: 4.
const ESTIMATE_WITH_NAMES_SELECT = `
    SELECT
        ce.*,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        i.first_name AS inspector_first_name,
        i.last_name AS inspector_last_name
    FROM cost_estimate ce
    LEFT JOIN orders o ON o.order_id = ce.order_id
    LEFT JOIN client c ON c.client_id = o.client_id
    LEFT JOIN inspector i ON i.inspector_id = ce.inspector_id
`;

// ─── GET ALL ESTIMATES ──────────────────────────────────────
// Optional status filter: /api/estimates?status=approved
export async function getAllEstimates(status?: string): Promise<CostEstimateWithNames[]> {
    if (status) {
        // $1 is a placeholder — pg replaces it with the value safely (prevents SQL injection)
        const result = await pool.query(
            `${ESTIMATE_WITH_NAMES_SELECT} WHERE ce.status = $1 ORDER BY ce.estimate_date DESC`,
            [status]
        );
        return result.rows;
    }

    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} ORDER BY ce.estimate_date DESC`
    );
    return result.rows;
}

// ─── GET ESTIMATE BY ID ─────────────────────────────────────
export async function getEstimateById(id: number): Promise<CostEstimateWithNames | null> {
    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} WHERE ce.estimate_id = $1`,
        [id]
    );
    // result.rows is an array — if empty, the estimate doesn't exist
    return result.rows[0] || null;
}


// ─── GET ESTIMATES BY CLIENT ────────────────────────────────
export async function getEstimatesByClient(clientId: number): Promise<CostEstimateWithNames[]> {
    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} WHERE o.client_id = $1 ORDER BY ce.estimate_date DESC`,
        [clientId]
    );
    return result.rows;
}

/**
 * Creates a new cost estimate in the database.
 */
export async function createEstimate(data: CreateEstimateInput): Promise<CostEstimate> {
    const result = await pool.query(
        `INSERT INTO cost_estimate (order_id, inspector_id, admin_id, details, estimate_date, status, material_id, material_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
        [data.order_id, data.inspector_id, data.admin_id || null, data.details, data.estimate_date, data.status, data.material_id || null, data.material_quantity || null]
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
         status = $6,
         material_id = $7,
         material_quantity = $8
     WHERE estimate_id = $9
     RETURNING *`,
        [
            data.order_id ?? current.order_id,           // if data.order_id is undefined, keep the current value
            data.inspector_id ?? current.inspector_id,
            data.admin_id !== undefined ? data.admin_id : current.admin_id,
            data.details ?? current.details,
            data.estimate_date ?? current.estimate_date,
            data.status ?? current.status,
            data.material_id !== undefined ? data.material_id : current.material_id,
            data.material_quantity !== undefined ? data.material_quantity : current.material_quantity,
            id
        ]
    );
    return result.rows[0];
}

/**
 * Updates an estimate's status (e.g. to "approved") and handles side effects
 * like inventory deduction and client notification.
 */
export async function updateEstimateStatus(id: number, status: string): Promise<CostEstimate | null> {
    const result = await pool.query(
        `UPDATE cost_estimate SET status = $1 WHERE estimate_id = $2 RETURNING *`,
        [status, id]
    );
    const updated = result.rows[0] || null;

    // When an estimate is approved, let the client know via notification-service.
    // This is best-effort: if it fails, the estimate update itself still succeeds.
    if (updated && status.toLowerCase() === 'approved') {
        // 1. Deduct material from inventory if specified
        if (updated.material_id && updated.material_quantity) {
            try {
                await pool.query(
                    `UPDATE items SET qty_on_hand = qty_on_hand - $1 WHERE item_id = $2`,
                    [updated.material_quantity, updated.material_id]
                );
            } catch (err) {
                console.error("Failed to deduct inventory for estimate:", err);
            }
        }

        // 2. Notify the client
        const orderResult = await pool.query(
            'SELECT client_id FROM orders WHERE order_id = $1',
            [updated.order_id]
        );
        const clientId = orderResult.rows[0]?.client_id;
        if (clientId) {
            await notifyEstimateApproved(clientId, updated.estimate_id);
        }
    }

    return updated;
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