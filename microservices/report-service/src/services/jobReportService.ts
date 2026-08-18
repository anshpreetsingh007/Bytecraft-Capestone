import { pool } from '../config/db';
import {
    CreateJobReportInput,
    JobReportStatus,
    JobReportWithNames,
    UpdateJobReportInput,
} from '../models/model';
import { badRequest, conflict, notFound, type Pagination } from '../shared';
import { notifyJobReportSubmitted } from './notifyClient';

const REPORT_SELECT = `
    SELECT r.*,
           o.client_id AS client_id,
           c.first_name AS client_first_name,
           c.last_name AS client_last_name,
           i.first_name AS inspector_first_name,
           i.last_name AS inspector_last_name
    FROM report r
    LEFT JOIN orders o ON o.order_id = r.order_id
    LEFT JOIN client c ON c.client_id = o.client_id
    LEFT JOIN inspector i ON i.inspector_id = r.inspector_id
`;

export interface JobReportFilters {
    orderId?: number | null;
    inspectorId?: number | null;
    status?: JobReportStatus | null;
}

export async function listJobReports(
    filters: JobReportFilters,
    page: Pagination,
): Promise<{ rows: JobReportWithNames[]; total: number }> {
    const conditions = ['r.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.orderId) {
        params.push(filters.orderId);
        conditions.push(`r.order_id = $${params.length}`);
    }
    if (filters.inspectorId) {
        params.push(filters.inspectorId);
        conditions.push(`r.inspector_id = $${params.length}`);
    }
    if (filters.status) {
        params.push(filters.status);
        conditions.push(`r.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, total] = await Promise.all([
        pool.query(
            `${REPORT_SELECT} ${where}
             ORDER BY r.report_date DESC, r.report_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count FROM report r ${where}`,
            params,
        ),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getJobReport(id: number): Promise<JobReportWithNames | null> {
    const result = await pool.query(`${REPORT_SELECT} WHERE r.report_id = $1 AND r.deleted_at IS NULL`, [id]);
    return result.rows[0] ?? null;
}

export async function createJobReport(data: CreateJobReportInput): Promise<JobReportWithNames> {
    const order = await pool.query('SELECT order_id FROM orders WHERE order_id = $1', [data.order_id]);
    if (order.rowCount === 0) throw badRequest('That order does not exist');

    // One report per job -- enforced by a partial unique index too, because
    // two of them would double-count in every financial rollup.
    const existing = await pool.query(
        'SELECT report_id FROM report WHERE order_id = $1 AND deleted_at IS NULL',
        [data.order_id],
    );
    if (existing.rows[0]) {
        throw conflict('This job already has a report', { reportId: existing.rows[0].report_id });
    }

    const result = await pool.query(
        `INSERT INTO report
            (order_id, inspector_id, title, findings, recommendations, details,
             material_used_cost, material_waste_cost, labour_hours, profit,
             report_date, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                 CASE WHEN $12 = 'submitted' THEN now() ELSE NULL END)
         RETURNING report_id`,
        [
            data.order_id,
            data.inspector_id,
            data.title,
            data.findings,
            data.recommendations,
            data.details,
            data.material_used_cost,
            data.material_waste_cost,
            data.labour_hours,
            data.profit,
            data.report_date,
            data.status,
        ],
    );

    const created = await getJobReport(result.rows[0].report_id);
    if (!created) throw notFound('Report could not be read back after creation');

    if (created.status === 'submitted') {
        await notifyJobReportSubmitted(created.report_id, created.order_id);
    }

    return created;
}

export async function updateJobReport(id: number, data: UpdateJobReportInput): Promise<JobReportWithNames> {
    const current = await getJobReport(id);
    if (!current) throw notFound('Report not found');

    if (current.status === 'reviewed') {
        throw conflict('A reviewed report can no longer be edited');
    }

    const nextStatus = data.status ?? current.status;

    const result = await pool.query(
        `UPDATE report
         SET title = COALESCE($2, title),
             findings = COALESCE($3, findings),
             recommendations = COALESCE($4, recommendations),
             details = COALESCE($5, details),
             material_used_cost = COALESCE($6, material_used_cost),
             material_waste_cost = COALESCE($7, material_waste_cost),
             labour_hours = COALESCE($8, labour_hours),
             profit = COALESCE($9, profit),
             report_date = COALESCE($10, report_date),
             status = $11,
             submitted_at = CASE
                WHEN $11 = 'submitted' AND submitted_at IS NULL THEN now()
                ELSE submitted_at
             END
         WHERE report_id = $1 AND deleted_at IS NULL
         RETURNING report_id`,
        [
            id,
            data.title ?? null,
            data.findings ?? null,
            data.recommendations ?? null,
            data.details ?? null,
            data.material_used_cost ?? null,
            data.material_waste_cost ?? null,
            data.labour_hours ?? null,
            data.profit ?? null,
            data.report_date ?? null,
            nextStatus,
        ],
    );

    const updated = await getJobReport(result.rows[0].report_id);
    if (!updated) throw notFound('Report not found');

    if (current.status !== 'submitted' && updated.status === 'submitted') {
        await notifyJobReportSubmitted(updated.report_id, updated.order_id);
    }

    return updated;
}

/** Admin sign-off. Also closes the order out. */
export async function reviewJobReport(id: number, adminId: number | null): Promise<JobReportWithNames> {
    const current = await getJobReport(id);
    if (!current) throw notFound('Report not found');

    if (current.status !== 'submitted') {
        throw conflict('Only a submitted report can be marked reviewed');
    }

    await pool.query(
        `UPDATE report SET status = 'reviewed', reviewed_at = now(), admin_id = COALESCE($2, admin_id)
         WHERE report_id = $1`,
        [id, adminId],
    );

    await pool.query(`UPDATE orders SET status = 'completed' WHERE order_id = $1`, [current.order_id]);

    const reviewed = await getJobReport(id);
    if (!reviewed) throw notFound('Report not found');
    return reviewed;
}

export async function softDeleteJobReport(id: number): Promise<boolean> {
    const result = await pool.query(
        'UPDATE report SET deleted_at = now() WHERE report_id = $1 AND deleted_at IS NULL',
        [id],
    );
    return (result.rowCount ?? 0) > 0;
}
