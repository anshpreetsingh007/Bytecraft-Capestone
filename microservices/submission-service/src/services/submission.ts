import pool from '../config/db';
import {
    CreateInspectionRequestInput,
    InspectionRequest,
    InspectionRequestWithDetails,
    REQUEST_TRANSITIONS,
    RequestStatus,
    ScheduleConflict,
    ScheduleInput,
    UpdateInspectionRequestInput,
} from '../models/model';
import { badRequest, conflict, notFound, type Pagination } from '../shared';
import { findScheduleConflicts } from './scheduling';
import {
    notifyClientScheduled,
    notifyClientStatusChanged,
    notifyInspectorAssigned,
    notifyRequestSubmitted,
} from './notifyClient';

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

export interface RequestFilters {
    status?: RequestStatus | null;
    clientId?: number | null;
    inspectorId?: number | null;
    search?: string | null;
    unscheduledOnly?: boolean;
}

/**
 * One query builder for every list endpoint. Soft-deleted rows are excluded
 * everywhere, and the result is always a bounded page -- this used to return
 * the whole table.
 */
export async function listRequests(
    filters: RequestFilters,
    page: Pagination,
): Promise<{ rows: InspectionRequestWithDetails[]; total: number }> {
    const conditions = ['ir.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`ir.status = $${params.length}`);
    }
    if (filters.clientId) {
        params.push(filters.clientId);
        conditions.push(`ir.client_id = $${params.length}`);
    }
    if (filters.inspectorId) {
        params.push(filters.inspectorId);
        conditions.push(`ir.inspector_id = $${params.length}`);
    }
    if (filters.unscheduledOnly) {
        conditions.push('ir.scheduled_date IS NULL');
    }
    if (filters.search) {
        params.push(`%${filters.search}%`);
        conditions.push(
            `(ir.details ILIKE $${params.length}
              OR ir.site_address ILIKE $${params.length}
              OR c.first_name ILIKE $${params.length}
              OR c.last_name ILIKE $${params.length})`,
        );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, total] = await Promise.all([
        pool.query(
            `${REQUEST_WITH_DETAILS_SELECT} ${where}
             ORDER BY ir.request_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM inspection_request ir
             LEFT JOIN client c ON c.client_id = ir.client_id
             ${where}`,
            params,
        ),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getRequestById(id: number): Promise<InspectionRequestWithDetails | null> {
    const result = await pool.query(
        `${REQUEST_WITH_DETAILS_SELECT} WHERE ir.request_id = $1 AND ir.deleted_at IS NULL`,
        [id],
    );
    return result.rows[0] ?? null;
}

async function clientDisplayName(clientId: number): Promise<string> {
    const result = await pool.query(
        'SELECT first_name, last_name FROM client WHERE client_id = $1',
        [clientId],
    );
    const row = result.rows[0];
    return row ? `${row.first_name} ${row.last_name}`.trim() : `Client #${clientId}`;
}

export async function createRequest(data: CreateInspectionRequestInput): Promise<InspectionRequest> {
    const result = await pool.query(
        `INSERT INTO inspection_request
            (client_id, inspector_id, details, site_address, contact_phone, scheduled_date, status)
         VALUES ($1, NULL, $2, $3, $4, NULL, 'pending')
         RETURNING *`,
        [data.client_id, data.details, data.site_address, data.contact_phone],
    );

    const created = result.rows[0];
    await notifyRequestSubmitted(created.request_id, await clientDisplayName(created.client_id));
    return created;
}

export async function updateRequest(
    id: number,
    data: UpdateInspectionRequestInput,
): Promise<InspectionRequest> {
    const current = await getRequestById(id);
    if (!current) throw notFound('Inspection request not found');

    const previousInspector = current.inspector_id;
    const nextInspector = data.inspector_id !== undefined ? data.inspector_id : current.inspector_id;
    const nextScheduled =
        data.scheduled_date !== undefined ? data.scheduled_date : current.scheduled_date;
    const nextDuration = data.duration_minutes ?? current.duration_minutes;

    // Assigning someone and giving them a time is a booking, so it goes
    // through the same conflict check as the dedicated schedule endpoint.
    if (nextInspector && nextScheduled) {
        const conflicts = await findScheduleConflicts({
            inspectorId: nextInspector,
            startsAt: new Date(nextScheduled),
            durationMinutes: nextDuration,
            ignoreRequestId: id,
        });
        const blocking = conflicts.filter((entry) => entry.kind === 'appointment');
        if (blocking.length > 0) {
            throw conflict(blocking[0].message, { conflicts });
        }
    }

    // Assigning an inspector moves a pending request forward automatically;
    // leaving it 'pending' with someone assigned was a state the dashboards
    // both had to special-case.
    const nextStatus: RequestStatus =
        current.status === 'pending' && nextInspector ? 'assigned' : current.status;

    const result = await pool.query(
        `UPDATE inspection_request
         SET inspector_id = $1,
             details = $2,
             site_address = $3,
             contact_phone = $4,
             scheduled_date = $5,
             duration_minutes = $6,
             status = $7
         WHERE request_id = $8 AND deleted_at IS NULL
         RETURNING *`,
        [
            nextInspector,
            data.details ?? current.details,
            data.site_address !== undefined ? data.site_address : current.site_address,
            data.contact_phone !== undefined ? data.contact_phone : current.contact_phone,
            nextScheduled,
            nextDuration,
            nextStatus,
            id,
        ],
    );

    const updated = result.rows[0];

    if (nextInspector && nextInspector !== previousInspector) {
        await notifyInspectorAssigned(nextInspector, id, nextScheduled);
    }
    if (nextScheduled && nextScheduled !== current.scheduled_date) {
        await notifyClientScheduled(current.client_id, id, new Date(nextScheduled).toISOString());
    }

    return updated;
}

/** Books a specific inspector at a specific time, conflicts checked first. */
export async function scheduleRequest(
    id: number,
    data: ScheduleInput,
): Promise<InspectionRequest & { warnings: ScheduleConflict[] }> {
    const current = await getRequestById(id);
    if (!current) throw notFound('Inspection request not found');

    if (current.status === 'cancelled' || current.status === 'completed') {
        throw conflict(`A ${current.status} inspection cannot be rescheduled`);
    }

    const conflicts = await findScheduleConflicts({
        inspectorId: data.inspector_id,
        startsAt: data.scheduled_date,
        durationMinutes: data.duration_minutes,
        ignoreRequestId: id,
    });

    // A double booking is a hard stop. Working hours and time off are advisory
    // -- an admin may knowingly book an emergency call-out on a Saturday -- so
    // those come back as warnings the UI shows before confirming.
    const doubleBooked = conflicts.filter((entry) => entry.kind === 'appointment');
    if (doubleBooked.length > 0) {
        throw conflict(doubleBooked[0].message, { conflicts });
    }

    const result = await pool.query(
        `UPDATE inspection_request
         SET inspector_id = $1,
             scheduled_date = $2,
             duration_minutes = $3,
             status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END
         WHERE request_id = $4 AND deleted_at IS NULL
         RETURNING *`,
        [data.inspector_id, data.scheduled_date.toISOString(), data.duration_minutes, id],
    );

    const updated = result.rows[0];

    if (data.inspector_id !== current.inspector_id) {
        await notifyInspectorAssigned(data.inspector_id, id, data.scheduled_date.toISOString());
    }
    await notifyClientScheduled(current.client_id, id, data.scheduled_date.toISOString());

    return { ...updated, warnings: conflicts.filter((entry) => entry.kind !== 'appointment') };
}

export async function updateRequestStatus(
    id: number,
    status: RequestStatus,
    reason: string | null,
): Promise<InspectionRequest> {
    const current = await getRequestById(id);
    if (!current) throw notFound('Inspection request not found');

    if (current.status === status) return current;

    const allowed = REQUEST_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(status)) {
        throw badRequest(
            allowed.length === 0
                ? `A ${current.status} inspection cannot change status again`
                : `An inspection cannot go from ${current.status} to ${status}`,
            { allowed },
        );
    }

    if (status === 'in_progress' && !current.inspector_id) {
        throw badRequest('Assign an inspector before starting this inspection');
    }

    const result = await pool.query(
        // $1 is bound to a text column via SET and compared against a string
        // literal inside the CASE; Postgres can't unify those two contexts
        // into one inferred type for the same placeholder ("inconsistent
        // types deduced for parameter $1") unless it's cast explicitly.
        `UPDATE inspection_request
         SET status = $1::varchar,
             cancelled_reason = CASE WHEN $1::varchar = 'cancelled' THEN $2 ELSE cancelled_reason END
         WHERE request_id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [status, reason, id],
    );

    await notifyClientStatusChanged(current.client_id, id, status);
    return result.rows[0];
}

/**
 * Soft delete. A hard DELETE breaks the foreign keys from orders and, through
 * them, from estimates and reports -- and destroys the record of work that was
 * genuinely done.
 */
export async function softDeleteRequest(id: number): Promise<boolean> {
    const result = await pool.query(
        `UPDATE inspection_request
         SET deleted_at = now(), status = CASE WHEN status IN ('completed') THEN status ELSE 'cancelled' END
         WHERE request_id = $1 AND deleted_at IS NULL`,
        [id],
    );
    return (result.rowCount ?? 0) > 0;
}
