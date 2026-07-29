import pool from '../config/db';
import {
    InspectionRequest,
    CreateInspectionRequestInput,
    UpdateInspectionRequestInput,
} from '../models/model';
import { notifyInspectionRequestSubmitted } from './notifyClient';

// ─── GET ALL ─────────────────────────────────────────────────
// Optional status filter: /api/inspection-requests?status=pending
export async function getAllRequests(status?: string): Promise<InspectionRequest[]> {
    if (status) {
        const result = await pool.query(
            'SELECT * FROM inspection_request WHERE status = $1 ORDER BY request_id DESC',
            [status]
        );
        return result.rows;
    }

    const result = await pool.query(
        'SELECT * FROM inspection_request ORDER BY request_id DESC'
    );
    return result.rows;
}

// ─── GET BY ID ───────────────────────────────────────────────
export async function getRequestById(id: number): Promise<InspectionRequest | null> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE request_id = $1',
        [id]
    );
    return result.rows[0] || null;
}

// ─── GET BY CLIENT ───────────────────────────────────────────
export async function getRequestsByClient(clientId: number): Promise<InspectionRequest[]> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE client_id = $1 ORDER BY request_id DESC',
        [clientId]
    );
    return result.rows;
}

// ─── GET BY INSPECTOR ────────────────────────────────────────
export async function getRequestsByInspector(inspectorId: number): Promise<InspectionRequest[]> {
    const result = await pool.query(
        'SELECT * FROM inspection_request WHERE inspector_id = $1 ORDER BY request_id DESC',
        [inspectorId]
    );
    return result.rows;
}

// ─── CREATE (client submits a new request) ──────────────────
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

// ─── UPDATE (e.g. assign inspector, set schedule, edit details) ─
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

// ─── UPDATE STATUS ONLY ──────────────────────────────────────
export async function updateRequestStatus(id: number, status: string): Promise<InspectionRequest | null> {
    const result = await pool.query(
        `UPDATE inspection_request SET status = $1 WHERE request_id = $2 RETURNING *`,
        [status, id]
    );
    return result.rows[0] || null;
}

// ─── DELETE ───────────────────────────────────────────────────
export async function deleteRequest(id: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM inspection_request WHERE request_id = $1',
        [id]
    );
    return (result.rowCount ?? 0) > 0;
}
