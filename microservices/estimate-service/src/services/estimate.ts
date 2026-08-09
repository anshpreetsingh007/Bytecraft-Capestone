
import pool from '../config/db';
import { CostEstimate, CreateEstimateInput, UpdateEstimateInput, CostEstimateWithNames } from '../models/model';
import { notifyEstimateApproved } from './notifyClient';

// combine tables to get actual names instead of just IDs
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

// fetch all estimates, optionally filtering by status
export async function getAllEstimates(status?: string): Promise<CostEstimateWithNames[]> {
    if (status) {
        // safely inject the status to prevent sql injection
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

// fetch a specific estimate by its id
export async function getEstimateById(id: number): Promise<CostEstimateWithNames | null> {
    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} WHERE ce.estimate_id = $1`,
        [id]
    );
    // return the estimate if it exists, otherwise return null
    return result.rows[0] || null;
}


// fetch all estimates for a specific client (only approved ones are sent to customer view)
export async function getEstimatesByClient(clientId: number): Promise<CostEstimateWithNames[]> {
    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} WHERE o.client_id = $1 AND ce.status = 'approved' ORDER BY ce.estimate_date DESC`,
        [clientId]
    );
    return result.rows;
}

// insert a new cost estimate into the database
export async function createEstimate(data: CreateEstimateInput): Promise<CostEstimate> {
    const result = await pool.query(
        `INSERT INTO cost_estimate (order_id, inspector_id, admin_id, details, estimate_date, status, material_id, material_quantity, materials)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
        [data.order_id, data.inspector_id, data.admin_id || null, data.details, data.estimate_date, data.status, data.material_id || null, data.material_quantity || null, data.materials ? JSON.stringify(data.materials) : '[]']
    );
    // return the newly created row
    return result.rows[0];
}

// update an existing estimate
export async function updateEstimate(id: number, data: UpdateEstimateInput): Promise<CostEstimate | null> {
    // grab the current data to fill in any missing fields
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
         material_quantity = $8,
         materials = $9
     WHERE estimate_id = $10
     RETURNING *`,
        [
            data.order_id ?? current.order_id,
            data.inspector_id ?? current.inspector_id,
            data.admin_id !== undefined ? data.admin_id : current.admin_id,
            data.details ?? current.details,
            data.estimate_date ?? current.estimate_date,
            data.status ?? current.status,
            data.material_id !== undefined ? data.material_id : current.material_id,
            data.material_quantity !== undefined ? data.material_quantity : current.material_quantity,
            data.materials ? JSON.stringify(data.materials) : current.materials,
            id
        ]
    );
    return result.rows[0];
}

// update the status (like "approved") and handle notifications
export async function updateEstimateStatus(id: number, status: string): Promise<CostEstimate | null> {
    const result = await pool.query(
        `UPDATE cost_estimate SET status = $1 WHERE estimate_id = $2 RETURNING *`,
        [status, id]
    );
    const updated = result.rows[0] || null;

    // if approved, notify the client
    if (updated && status.toLowerCase() === 'approved') {
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

// completely delete an estimate
export async function deleteEstimate(id: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM cost_estimate WHERE estimate_id = $1',
        [id]
    );
    // return true if something was actually deleted
    return (result.rowCount ?? 0) > 0;
}