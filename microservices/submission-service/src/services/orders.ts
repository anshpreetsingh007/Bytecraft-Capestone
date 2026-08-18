import pool from '../config/db';
import { Order, OrderStatus, OrderWithDetails } from '../models/model';
import { conflict, notFound, type Pagination } from '../shared';

const ORDER_WITH_DETAILS_SELECT = `
    SELECT
        o.*,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        c.email AS client_email,
        c.phone AS client_phone,
        c.address AS client_address,
        ir.details AS request_details,
        ir.scheduled_date AS request_scheduled_date,
        ir.inspector_id AS inspector_id,
        insp.first_name AS inspector_first_name,
        insp.last_name AS inspector_last_name
    FROM orders o
    LEFT JOIN client c ON c.client_id = o.client_id
    LEFT JOIN inspection_request ir ON ir.request_id = o.request_id
    LEFT JOIN inspector insp ON insp.inspector_id = ir.inspector_id
`;

export interface OrderFilters {
    status?: OrderStatus | null;
    clientId?: number | null;
    needsEstimate?: boolean;
}

export async function listOrders(
    filters: OrderFilters,
    page: Pagination,
): Promise<{ rows: OrderWithDetails[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`o.status = $${params.length}`);
    }
    if (filters.clientId) {
        params.push(filters.clientId);
        conditions.push(`o.client_id = $${params.length}`);
    }

    // "Orders with no estimate yet" is exactly what the create-estimate page
    // needs to offer. A soft-deleted estimate must not count as one.
    const estimateJoin = filters.needsEstimate
        ? ' LEFT JOIN cost_estimate ce ON ce.order_id = o.order_id AND ce.deleted_at IS NULL'
        : '';
    if (filters.needsEstimate) conditions.push('ce.estimate_id IS NULL');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, total] = await Promise.all([
        pool.query(
            `${ORDER_WITH_DETAILS_SELECT}${estimateJoin} ${where}
             ORDER BY o.order_date DESC, o.order_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count FROM orders o${estimateJoin} ${where}`,
            params,
        ),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getOrderById(id: number): Promise<OrderWithDetails | null> {
    const result = await pool.query(`${ORDER_WITH_DETAILS_SELECT} WHERE o.order_id = $1`, [id]);
    return result.rows[0] ?? null;
}

/**
 * Turns an inspection request into an order. Nothing else in the system
 * creates one, so this is the hinge between "somebody asked" and "we are
 * pricing the job".
 *
 * The uniqueness of one-order-per-request is enforced by a partial unique
 * index as well as the check below: two admins clicking at the same moment
 * both used to pass the application-level check and create duplicates.
 */
export async function convertRequestToOrder(requestId: number): Promise<Order> {
    const request = await pool.query(
        'SELECT * FROM inspection_request WHERE request_id = $1 AND deleted_at IS NULL',
        [requestId],
    );
    if (!request.rows[0]) throw notFound('Inspection request not found');

    if (request.rows[0].status === 'cancelled') {
        throw conflict('A cancelled inspection request cannot become an order');
    }

    const existing = await pool.query('SELECT * FROM orders WHERE request_id = $1', [requestId]);
    if (existing.rows[0]) {
        throw conflict('This request has already been converted to an order', {
            existingOrder: existing.rows[0],
        });
    }

    const result = await pool.query(
        `INSERT INTO orders (client_id, request_id, order_date, status)
         VALUES ($1, $2, CURRENT_DATE, 'active')
         RETURNING *`,
        [request.rows[0].client_id, requestId],
    );

    return result.rows[0];
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
        [status, id],
    );
    if (!result.rows[0]) throw notFound('Order not found');
    return result.rows[0];
}
