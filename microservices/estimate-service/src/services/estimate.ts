import pool from '../config/db';
import {
    ClientResponse,
    CostEstimate,
    CostEstimateWithNames,
    CreateEstimateInput,
    ESTIMATE_TRANSITIONS,
    EstimateStatus,
    UpdateEstimateInput,
} from '../models/model';
import { badRequest, conflict, logger, notFound, type Pagination } from '../shared';
import {
    consumeMaterials,
    notifyClientResponse,
    notifyEstimateDecision,
    notifyEstimateSubmitted,
    notifyInspectorOfDecision,
} from './notifyClient';

const ESTIMATE_WITH_NAMES_SELECT = `
    SELECT
        ce.*,
        o.client_id AS client_id,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        i.first_name AS inspector_first_name,
        i.last_name AS inspector_last_name
    FROM cost_estimate ce
    LEFT JOIN orders o ON o.order_id = ce.order_id
    LEFT JOIN client c ON c.client_id = o.client_id
    LEFT JOIN inspector i ON i.inspector_id = ce.inspector_id
`;

export interface EstimateFilters {
    status?: EstimateStatus | null;
    clientId?: number | null;
    inspectorId?: number | null;
    clientResponse?: ClientResponse | null;
    /** Customers only ever see estimates an admin has approved for sending. */
    approvedOnly?: boolean;
}

export async function listEstimates(
    filters: EstimateFilters,
    page: Pagination,
): Promise<{ rows: CostEstimateWithNames[]; total: number }> {
    const conditions = ['ce.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`ce.status = $${params.length}`);
    }
    if (filters.clientId) {
        params.push(filters.clientId);
        conditions.push(`o.client_id = $${params.length}`);
    }
    if (filters.inspectorId) {
        params.push(filters.inspectorId);
        conditions.push(`ce.inspector_id = $${params.length}`);
    }
    if (filters.clientResponse) {
        params.push(filters.clientResponse);
        conditions.push(`ce.client_response = $${params.length}`);
    }
    if (filters.approvedOnly) {
        conditions.push(`ce.status = 'approved'`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, total] = await Promise.all([
        pool.query(
            `${ESTIMATE_WITH_NAMES_SELECT} ${where}
             ORDER BY ce.estimate_date DESC, ce.estimate_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM cost_estimate ce
             LEFT JOIN orders o ON o.order_id = ce.order_id
             ${where}`,
            params,
        ),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getEstimateById(id: number): Promise<CostEstimateWithNames | null> {
    const result = await pool.query(
        `${ESTIMATE_WITH_NAMES_SELECT} WHERE ce.estimate_id = $1 AND ce.deleted_at IS NULL`,
        [id],
    );
    return result.rows[0] ?? null;
}

/** Sum of the material lines, used when the caller does not send a total. */
function deriveTotal(input: { materials: { quantity: number; cost: number }[] }): number {
    return Number(
        input.materials
            .reduce((running, line) => running + Number(line.cost || 0) * Number(line.quantity || 0), 0)
            .toFixed(2),
    );
}

export async function createEstimate(data: CreateEstimateInput): Promise<CostEstimate> {
    const orderExists = await pool.query('SELECT 1 FROM orders WHERE order_id = $1', [data.order_id]);
    if (orderExists.rowCount === 0) throw badRequest('That order does not exist');

    const result = await pool.query(
        `INSERT INTO cost_estimate (
            order_id, inspector_id, admin_id, details, estimate_date, status,
            materials, total_amount, length_ft, width_ft, pitch_ft
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
            data.order_id,
            data.inspector_id,
            data.admin_id,
            data.details,
            data.estimate_date,
            data.status,
            JSON.stringify(data.materials),
            data.total_amount ?? deriveTotal(data),
            data.length_ft,
            data.width_ft,
            data.pitch_ft,
        ],
    );

    const created = result.rows[0];

    // A draft is still the inspector's own work and should not ping anyone.
    if (created.status === 'submitted') {
        await notifyEstimateSubmitted(created.estimate_id, created.order_id);
    }

    return created;
}

export async function updateEstimate(id: number, data: UpdateEstimateInput): Promise<CostEstimate> {
    const current = await getEstimateById(id);
    if (!current) throw notFound('Estimate not found');

    if (current.client_response === 'accepted') {
        // The customer has agreed to this number. Changing it underneath them
        // would mean they accepted one price and get billed another.
        throw conflict('This estimate has been accepted by the customer and can no longer be edited');
    }

    /*
     * Re-approval rule.
     *
     * An approved estimate is what the customer sees. Editing one without
     * re-review would change the figure they are looking at with nobody
     * signing off, so any content edit knocks it back to 'submitted'.
     */
    const contentChanged =
        data.details !== undefined ||
        data.materials !== undefined ||
        data.total_amount !== undefined ||
        data.length_ft !== undefined ||
        data.width_ft !== undefined ||
        data.pitch_ft !== undefined;

    const requiresReReview =
        contentChanged && (current.status === 'approved' || current.status === 'rejected');

    const nextStatus: EstimateStatus = requiresReReview ? 'submitted' : (data.status ?? current.status);

    if (requiresReReview && data.status && data.status !== 'submitted') {
        logger.warn('forcing an edited estimate back into review', {
            estimateId: id,
            requestedStatus: data.status,
            previousStatus: current.status,
        });
    }

    const materials = data.materials ?? current.materials ?? [];
    const total =
        data.total_amount !== undefined
            ? data.total_amount
            : data.materials !== undefined
              ? deriveTotal({ materials })
              : current.total_amount;

    const result = await pool.query(
        `UPDATE cost_estimate
         SET inspector_id = $1,
             admin_id = $2,
             details = $3,
             estimate_date = $4,
             status = $5,
             materials = $6,
             total_amount = $7,
             length_ft = $8,
             width_ft = $9,
             pitch_ft = $10
         WHERE estimate_id = $11 AND deleted_at IS NULL
         RETURNING *`,
        [
            data.inspector_id ?? current.inspector_id,
            data.admin_id !== undefined ? data.admin_id : current.admin_id,
            data.details ?? current.details,
            data.estimate_date ?? current.estimate_date,
            nextStatus,
            JSON.stringify(materials),
            total,
            data.length_ft !== undefined ? data.length_ft : current.length_ft,
            data.width_ft !== undefined ? data.width_ft : current.width_ft,
            data.pitch_ft !== undefined ? data.pitch_ft : current.pitch_ft,
            id,
        ],
    );

    const updated = result.rows[0];

    const enteredQueue =
        requiresReReview || (current.status !== 'submitted' && nextStatus === 'submitted');
    if (updated && enteredQueue) {
        await notifyEstimateSubmitted(updated.estimate_id, updated.order_id, requiresReReview);
    }

    return updated;
}

/**
 * Admin approval or rejection.
 *
 * Approving is the point at which the priced materials leave stock: until
 * then the estimate is a proposal. inventory-service records the movement
 * against this estimate id and refuses to apply it twice, so clicking approve
 * on an already-approved estimate cannot deduct the same materials again.
 */
export async function updateEstimateStatus(
    id: number,
    status: EstimateStatus,
    adminId: number | null,
): Promise<CostEstimate> {
    const current = await getEstimateById(id);
    if (!current) throw notFound('Estimate not found');

    if (current.status === status) return current;

    const allowed = ESTIMATE_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(status)) {
        throw badRequest(`An estimate cannot go from ${current.status} to ${status}`, { allowed });
    }

    if (status === 'approved') {
        await consumeMaterials(id, current.materials ?? []);
    }

    const result = await pool.query(
        `UPDATE cost_estimate
         SET status = $1, admin_id = COALESCE($2, admin_id)
         WHERE estimate_id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [status, adminId, id],
    );

    const updated = result.rows[0];

    if (status === 'approved' || status === 'rejected') {
        if (current.client_id) {
            await notifyEstimateDecision(current.client_id, id, status === 'approved');
        }
        if (current.inspector_id) {
            await notifyInspectorOfDecision(current.inspector_id, id, status === 'approved');
        }
        if (status === 'approved') {
            await pool.query(`UPDATE orders SET status = 'estimated' WHERE order_id = $1 AND status = 'active'`, [
                updated.order_id,
            ]);
        }
    }

    return updated;
}

/**
 * The customer accepting or declining. Separate from `status` on purpose:
 * an admin approving means "fit to send", the customer accepting means
 * "do the work". Only the second one starts a job.
 */
export async function recordClientResponse(
    id: number,
    response: Exclude<ClientResponse, 'pending'>,
    note: string | null,
): Promise<CostEstimate> {
    const current = await getEstimateById(id);
    if (!current) throw notFound('Estimate not found');

    if (current.status !== 'approved') {
        throw conflict('This estimate is not ready for a decision yet');
    }
    if (current.client_response !== 'pending') {
        throw conflict(`You have already ${current.client_response} this estimate`);
    }

    const result = await pool.query(
        `UPDATE cost_estimate
         SET client_response = $1, client_responded_at = now(), client_response_note = $2
         WHERE estimate_id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [response, note, id],
    );

    const clientName = [current.client_first_name, current.client_last_name].filter(Boolean).join(' ');
    await notifyClientResponse(id, response === 'accepted', clientName || 'A customer');

    if (response === 'accepted') {
        await pool.query(`UPDATE orders SET status = 'scheduled' WHERE order_id = $1`, [current.order_id]);
    }

    return result.rows[0];
}

/** Soft delete: reports and invoices reference these rows. */
export async function softDeleteEstimate(id: number): Promise<boolean> {
    const current = await getEstimateById(id);
    if (!current) return false;

    if (current.client_response === 'accepted') {
        throw conflict('An estimate the customer has accepted cannot be deleted');
    }

    const result = await pool.query(
        'UPDATE cost_estimate SET deleted_at = now() WHERE estimate_id = $1 AND deleted_at IS NULL',
        [id],
    );
    return (result.rowCount ?? 0) > 0;
}
