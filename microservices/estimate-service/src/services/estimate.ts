
import pool from '../config/db';
import { CostEstimate, CreateEstimateInput, UpdateEstimateInput, CostEstimateWithNames } from '../models/model';
import { notifyEstimateApproved, notifyEstimateSubmitted } from './notifyClient';

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

// every estimate authored by one inspector.
// Unlike the client view above this is NOT restricted to 'approved' — an
// inspector needs to see their own drafts and rejections too.
// `limit` is optional and caps the result for dashboard-style widgets.
export async function getEstimatesByInspector(
    inspectorId: number,
    limit?: number
): Promise<CostEstimateWithNames[]> {
    if (limit !== undefined) {
        const result = await pool.query(
            `${ESTIMATE_WITH_NAMES_SELECT}
             WHERE ce.inspector_id = $1
             ORDER BY ce.estimate_date DESC, ce.estimate_id DESC
             LIMIT $2`,
            [inspectorId, limit]
        );
        return result.rows;
    }

    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT}
         WHERE ce.inspector_id = $1
         ORDER BY ce.estimate_date DESC, ce.estimate_id DESC`,
        [inspectorId]
    );
    return result.rows;
}

// insert a new cost estimate into the database
export async function createEstimate(data: CreateEstimateInput): Promise<CostEstimate> {
    const result = await pool.query(
        `INSERT INTO cost_estimate (
            order_id, inspector_id, admin_id, details, estimate_date, status,
            material_id, material_quantity, materials,
            length_ft, width_ft, pitch_ft
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
            data.order_id,
            data.inspector_id,
            data.admin_id || null,
            data.details,
            data.estimate_date,
            data.status,
            data.material_id || null,
            data.material_quantity || null,
            JSON.stringify(data.materials ?? []),
            data.length_ft ?? null,
            data.width_ft ?? null,
            data.pitch_ft ?? null,
        ]
    );

    const created = result.rows[0];

    // An estimate that lands as 'submitted' is waiting on an admin, so tell
    // them. Drafts are still the inspector's own work and shouldn't ping
    // anyone. Best-effort — see notifyClient.ts.
    if (created && String(created.status).toLowerCase() === 'submitted') {
        await notifyEstimateSubmitted(created.estimate_id, created.order_id);
    }

    return created;
}

// update an existing estimate
export async function updateEstimate(id: number, data: UpdateEstimateInput): Promise<CostEstimate | null> {
    // grab the current data to fill in any missing fields
    const current = await getEstimateById(id);
    if (!current) return null;

    /* Re-approval rule.
     *
     * An approved estimate is visible to the customer (getEstimatesByClient
     * only returns approved rows). If someone edits one, the figure the
     * customer is looking at would change with no review — so any content
     * edit knocks it back to 'submitted' and it has to be approved again.
     *
     * Enforced here rather than in the UI because both the admin and
     * inspector estimate forms hit this endpoint, and a client could call it
     * directly. A caller can still move status deliberately via
     * PATCH /:id/status, which is the approve/reject path and is untouched.
     *
     * "Content edit" means any of the fields a customer would actually see.
     */
    const contentChanged =
        data.details !== undefined ||
        data.materials !== undefined ||
        data.length_ft !== undefined ||
        data.width_ft !== undefined ||
        data.pitch_ft !== undefined;

    const currentStatus = String(current.status ?? '').toLowerCase();
    const requestedStatus = data.status !== undefined ? String(data.status).toLowerCase() : undefined;

    // Was already settled (approved/rejected) and is being edited → back to review.
    const requiresReReview =
        contentChanged && (currentStatus === 'approved' || currentStatus === 'rejected');

    const effectiveStatus = requiresReReview
        ? 'submitted'
        : (data.status ?? current.status);

    if (requiresReReview && requestedStatus && requestedStatus !== 'submitted') {
        console.warn(
            `Estimate ${id}: caller asked for status '${requestedStatus}' while editing a '${currentStatus}' estimate; forcing 'submitted' for re-approval.`
        );
    }

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
         materials = $9,
         length_ft = $10,
         width_ft = $11,
         pitch_ft = $12
     WHERE estimate_id = $13
     RETURNING *`,
        [
            data.order_id ?? current.order_id,
            data.inspector_id ?? current.inspector_id,
            data.admin_id !== undefined ? data.admin_id : current.admin_id,
            data.details ?? current.details,
            data.estimate_date ?? current.estimate_date,
            effectiveStatus,
            data.material_id !== undefined ? data.material_id : current.material_id,
            data.material_quantity !== undefined ? data.material_quantity : current.material_quantity,
            data.materials ? JSON.stringify(data.materials) : JSON.stringify(current.materials ?? []),
            data.length_ft !== undefined ? data.length_ft : current.length_ft,
            data.width_ft !== undefined ? data.width_ft : current.width_ft,
            data.pitch_ft !== undefined ? data.pitch_ft : current.pitch_ft,
            id
        ]
    );

    const updated = result.rows[0];

    // Editing a rejected or approved estimate puts it back in the admin
    // queue, so the queue's owners need to know it's there again.
    if (updated && requiresReReview) {
        await notifyEstimateSubmitted(updated.estimate_id, updated.order_id, true);
    }

    return updated;
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