import pool from '../config/db';
import {
    InspectionRequest,
    CreateInspectionRequestInput,
    UpdateInspectionRequestInput,
    InspectionRequestWithDetails,
} from '../models/model';
import { notifyInspectionRequestSubmitted } from './notifyClient';

const REQUEST_WITH_DETAILS_SELECT = `
    SELECT
        ir.*,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        insp.first_name AS inspector_first_name,
        insp.last_name AS inspector_last_name,
        o.order_id AS existing_order_id
    FROM inspection_request ir
    LEFT JOIN client c ON c.client_id = ir.client_id
    LEFT JOIN inspector insp ON insp.inspector_id = ir.inspector_id
    LEFT JOIN orders o ON o.request_id = ir.request_id
`;

// get all
// Optional status filter: /api/inspection-requests?status=pending
export async function getAllRequests(status?: string): Promise<InspectionRequestWithDetails[]> {
    if (status) {
        const result = await pool.query(
            `${REQUEST_WITH_DETAILS_SELECT} WHERE ir.status = $1 ORDER BY ir.request_id DESC`,
            [status]
        );
        return result.rows;
    }

    const result = await pool.query(
        `${REQUEST_WITH_DETAILS_SELECT} ORDER BY ir.request_id DESC`
    );
    return result.rows;
}

// get by id
export async function getRequestById(id: number): Promise<InspectionRequest | null> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE request_id = $1',
        [id]
    );
    return result.rows[0] || null;
}

// get by client
export async function getRequestsByClient(clientId: number): Promise<InspectionRequest[]> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE client_id = $1 ORDER BY request_id DESC',
        [clientId]
    );
    return result.rows;
}

// get by inspector
export async function getRequestsByInspector(inspectorId: number): Promise<InspectionRequest[]> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE inspector_id = $1 ORDER BY request_id DESC',
        [inspectorId]
    );
    return result.rows;
}

// create (client submits a new request)
export async function createRequest(data: CreateInspectionRequestInput): Promise<InspectionRequest> {
    const result = await pool.query(
        `INSERT INTO inspection_request (client_id, inspector_id, details, scheduled_date, status)
         VALUES ($1, NULL, $2, NULL, $3)
         RETURNING *`,
        [data.client_id, data.details, data.status || 'pending']
    );

    const created = result.rows[0];

    // Let every admin know a new request came in. Best-effort — a
    // notification-service outage should never fail the submission itself.
    await notifyInspectionRequestSubmitted(created.request_id, created.client_id);

    return created;
}

// update (e.g. assign inspector, set schedule, edit details)
export async function updateRequest(id: number, data: UpdateInspectionRequestInput): Promise<InspectionRequest | null> {
    const current = await getRequestById(id);
    if (!current) return null;

    const result = await pool.query(
        `UPDATE inspection_request
         SET client_id = $1,
             inspector_id = $2,
             details = $3,
             status = $4,
             scheduled_date = $5
         WHERE request_id = $6
         RETURNING *`,
        [
            data.client_id ?? current.client_id,
            data.inspector_id !== undefined ? data.inspector_id : current.inspector_id,
            data.details ?? current.details,
            data.status ?? current.status,
            data.scheduled_date !== undefined ? data.scheduled_date : current.scheduled_date,
            id,
        ]
    );
    return result.rows[0];
}

// update status only
export async function updateRequestStatus(id: number, status: string): Promise<InspectionRequest | null> {
    const result = await pool.query(
        `UPDATE inspection_request SET status = $1 WHERE request_id = $2 RETURNING *`,
        [status, id]
    );
    return result.rows[0] || null;
}

// delete
export async function deleteRequest(id: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM inspection_request WHERE request_id = $1',
        [id]
    );
    return (result.rowCount ?? 0) > 0;
}