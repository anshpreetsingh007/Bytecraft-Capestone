import pool from '../config/db';
import { Order, OrderWithDetails } from '../models/model';

// Joined view: order + the client who owns it + the inspection request and
// inspector behind it. Used by the admin UI (estimate creation) so it can
// show "Jane Doe, 123 Main St" instead of client_id: 4.
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

// Thrown when a request has already been converted — the controller turns
// this into a 409 rather than silently creating a duplicate order.
export class OrderConflictError extends Error {
    existingOrder: Order;
    constructor(message: string, existingOrder: Order) {
        super(message);
        this.name = 'OrderConflictError';
        this.existingOrder = existingOrder;
    }
}

// ─── GET ALL ────────────────────────────────────────────────
// Optional filters:
//   ?status=active            — only orders in this status
//   ?needsEstimate=true       — only orders with no cost_estimate yet
//     (this is exactly what the "create an estimate" page needs to offer)
export async function getAllOrders(status?: string, needsEstimate?: boolean): Promise<OrderWithDetails[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
        params.push(status);
        conditions.push(`o.status = $${params.length}`);
    }

    let query = ORDER_WITH_DETAILS_SELECT;
    if (needsEstimate) {
        query += ` LEFT JOIN cost_estimate ce ON ce.order_id = o.order_id`;
        conditions.push(`ce.estimate_id IS NULL`);
    }

    if (conditions.length) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY o.order_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
}

// ─── GET BY ID ──────────────────────────────────────────────
export async function getOrderById(id: number): Promise<OrderWithDetails | null> {
    const result = await pool.query(`${ORDER_WITH_DETAILS_SELECT} WHERE o.order_id = $1`, [id]);
    return result.rows[0] || null;
}

// ─── GET BY CLIENT ──────────────────────────────────────────
export async function getOrdersByClient(clientId: number): Promise<OrderWithDetails[]> {
    const result = await pool.query(
        `${ORDER_WITH_DETAILS_SELECT} WHERE o.client_id = $1 ORDER BY o.order_date DESC`,
        [clientId]
    );
    return result.rows;
}

// ─── CONVERT AN INSPECTION REQUEST INTO AN ORDER ─────────────
// This is the missing link: nothing else in the system creates an `orders`
// row. Returns null if the request doesn't exist. Throws OrderConflictError
// if this request was already converted (one order per request).
export async function convertRequestToOrder(requestId: number): Promise<Order | null> {
    const requestResult = await pool.query(
        'SELECT * FROM inspection_request WHERE request_id = $1',
        [requestId]
    );
    const request = requestResult.rows[0];
    if (!request) return null;

    const existing = await pool.query('SELECT * FROM orders WHERE request_id = $1', [requestId]);
    if (existing.rows[0]) {
        throw new OrderConflictError('This request has already been converted to an order', existing.rows[0]);
    }

    const result = await pool.query(
        `INSERT INTO orders (client_id, request_id, order_date, status)
         VALUES ($1, $2, CURRENT_DATE, 'active')
         RETURNING *`,
        [request.client_id, requestId]
    );
    return result.rows[0];
}