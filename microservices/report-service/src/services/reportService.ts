import { pool } from '../config/db';

export const REPORT_PERIODS = ['month', 'quarter', 'year'] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

/**
 * Revenue is measured from estimates the customer has accepted, not from
 * invoices.
 *
 * Markit takes payment in cash or arranges financing over the phone, so there
 * is no invoicing in the product. The invoice table was therefore never
 * written to and every revenue figure that read from it was reporting zero.
 * An accepted estimate is the real commitment to do paid work, so that is the
 * number these reports use.
 */
const ACCEPTED_WORK = `
    FROM cost_estimate ce
    WHERE ce.deleted_at IS NULL
      AND ce.client_response = 'accepted'
`;

export async function getOverview() {
    const [inspections, revenue, team] = await Promise.all([
        pool.query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress'))::int AS in_progress,
                COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
            FROM inspection_request
            WHERE deleted_at IS NULL
        `),
        pool.query(`
            SELECT
                COALESCE(SUM(ce.total_amount), 0) AS total_revenue,
                COALESCE(SUM(ce.total_amount) FILTER (
                    WHERE date_trunc('month', ce.client_responded_at) = date_trunc('month', CURRENT_DATE)
                ), 0) AS this_month_revenue,
                COALESCE(SUM(ce.total_amount) FILTER (
                    WHERE date_trunc('month', ce.client_responded_at)
                        = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                ), 0) AS last_month_revenue,
                COUNT(*)::int AS accepted_jobs
            ${ACCEPTED_WORK}
        `),
        pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM inspector WHERE is_active) AS total_inspectors,
                (SELECT COUNT(DISTINCT inspector_id)::int FROM inspection_request
                    WHERE scheduled_date >= now() - INTERVAL '30 days' AND deleted_at IS NULL)
                    AS active_inspectors,
                (SELECT COUNT(*)::int FROM inspection_request
                    WHERE scheduled_date >= now() - INTERVAL '30 days' AND deleted_at IS NULL)
                    AS inspections_last_30_days
        `),
    ]);

    const insp = inspections.rows[0];
    const rev = revenue.rows[0];
    const staff = team.rows[0];

    return {
        inspections: {
            total: insp.total,
            completed: insp.completed,
            pending: insp.pending,
            inProgress: insp.in_progress,
            cancelled: insp.cancelled,
        },
        revenue: {
            total: Number(rev.total_revenue),
            thisMonth: Number(rev.this_month_revenue),
            lastMonth: Number(rev.last_month_revenue),
            acceptedJobs: rev.accepted_jobs,
        },
        inspectors: {
            total: staff.total_inspectors,
            activeLast30Days: staff.active_inspectors,
            avgInspectionsPerInspector:
                staff.active_inspectors > 0
                    ? Number((staff.inspections_last_30_days / staff.active_inspectors).toFixed(2))
                    : 0,
        },
    };
}

export async function getFinancialReport(period: ReportPeriod, start?: string | null, end?: string | null) {
    const conditions = ['deleted_at IS NULL', "status <> 'draft'"];
    const params: unknown[] = [period];

    if (start) {
        params.push(start);
        conditions.push(`report_date >= $${params.length}`);
    }
    if (end) {
        params.push(end);
        conditions.push(`report_date <= $${params.length}`);
    }

    const result = await pool.query(
        `SELECT
            date_trunc($1, report_date) AS period,
            COALESCE(SUM(material_used_cost), 0) AS material_used_cost,
            COALESCE(SUM(material_waste_cost), 0) AS material_waste_cost,
            COALESCE(SUM(profit), 0) AS profit,
            COALESCE(SUM(labour_hours), 0) AS labour_hours,
            COUNT(*)::int AS jobs_reported
         FROM report
         WHERE ${conditions.join(' AND ')}
         GROUP BY period
         ORDER BY period ASC`,
        params,
    );

    return result.rows.map((row) => ({
        period: row.period,
        materialUsedCost: Number(row.material_used_cost),
        materialWasteCost: Number(row.material_waste_cost),
        profit: Number(row.profit),
        labourHours: Number(row.labour_hours),
        jobsReported: row.jobs_reported,
    }));
}

export async function getInspectorPerformance() {
    const result = await pool.query(`
        WITH report_stats AS (
            SELECT inspector_id,
                   COUNT(*)::int AS jobs_completed,
                   COALESCE(SUM(profit), 0) AS total_profit,
                   COALESCE(AVG(material_waste_cost), 0) AS avg_material_waste
            FROM report
            WHERE deleted_at IS NULL AND status <> 'draft'
            GROUP BY inspector_id
        ),
        inspection_stats AS (
            SELECT inspector_id,
                   COUNT(*)::int AS inspections_assigned,
                   COUNT(*) FILTER (WHERE status = 'completed')::int AS inspections_completed
            FROM inspection_request
            WHERE deleted_at IS NULL
            GROUP BY inspector_id
        )
        SELECT ins.inspector_id, ins.first_name, ins.last_name, ins.email, ins.is_active,
               COALESCE(rs.jobs_completed, 0) AS jobs_completed,
               COALESCE(rs.total_profit, 0) AS total_profit,
               COALESCE(rs.avg_material_waste, 0) AS avg_material_waste,
               COALESCE(ist.inspections_assigned, 0) AS inspections_assigned,
               COALESCE(ist.inspections_completed, 0) AS inspections_completed
        FROM inspector ins
        LEFT JOIN report_stats rs ON rs.inspector_id = ins.inspector_id
        LEFT JOIN inspection_stats ist ON ist.inspector_id = ins.inspector_id
        WHERE ins.is_active
        ORDER BY total_profit DESC NULLS LAST
    `);

    return result.rows.map((row) => ({
        inspectorId: row.inspector_id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        jobsCompleted: row.jobs_completed,
        totalProfit: Number(row.total_profit),
        avgMaterialWaste: Number(row.avg_material_waste),
        inspectionsAssigned: row.inspections_assigned,
        inspectionsCompleted: row.inspections_completed,
        completionRate:
            row.inspections_assigned > 0
                ? Number(((row.inspections_completed / row.inspections_assigned) * 100).toFixed(1))
                : 0,
    }));
}

export async function getEstimateReport() {
    const [byStatusResult, responseResult] = await Promise.all([
        pool.query(`
            SELECT status, COUNT(*)::int AS count
            FROM cost_estimate
            WHERE deleted_at IS NULL
            GROUP BY status
        `),
        pool.query(`
            SELECT client_response, COUNT(*)::int AS count,
                   COALESCE(SUM(total_amount), 0) AS value
            FROM cost_estimate
            WHERE deleted_at IS NULL AND status = 'approved'
            GROUP BY client_response
        `),
    ]);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of byStatusResult.rows) {
        byStatus[row.status ?? 'unknown'] = row.count;
        total += row.count;
    }

    const byResponse: Record<string, { count: number; value: number }> = {};
    let sentToCustomers = 0;
    for (const row of responseResult.rows) {
        byResponse[row.client_response] = { count: row.count, value: Number(row.value) };
        sentToCustomers += row.count;
    }

    const approved = byStatus.approved ?? 0;
    const accepted = byResponse.accepted?.count ?? 0;

    return {
        total,
        byStatus,
        byClientResponse: byResponse,
        // How often an estimate clears internal review.
        approvalRate: total > 0 ? Number(((approved / total) * 100).toFixed(1)) : 0,
        // How often a customer says yes once it reaches them. This is the
        // number the business actually cares about.
        acceptanceRate: sentToCustomers > 0 ? Number(((accepted / sentToCustomers) * 100).toFixed(1)) : 0,
    };
}

/**
 * Replaces the old invoice aging report.
 *
 * With no invoicing in the product, "money owed" is not something the system
 * knows. What it does know is the pipeline: work priced, work the customer has
 * agreed to, and work finished but not yet written up.
 */
export async function getJobsReport() {
    const [pipeline, awaitingReport, monthly] = await Promise.all([
        pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE ce.status = 'submitted')::int AS awaiting_review,
                COUNT(*) FILTER (WHERE ce.status = 'approved' AND ce.client_response = 'pending')::int
                    AS awaiting_customer,
                COUNT(*) FILTER (WHERE ce.client_response = 'accepted')::int AS accepted,
                COUNT(*) FILTER (WHERE ce.client_response = 'declined')::int AS declined,
                COALESCE(SUM(ce.total_amount) FILTER (WHERE ce.client_response = 'accepted'), 0)
                    AS accepted_value,
                COALESCE(SUM(ce.total_amount) FILTER (
                    WHERE ce.status = 'approved' AND ce.client_response = 'pending'
                ), 0) AS pipeline_value
            FROM cost_estimate ce
            WHERE ce.deleted_at IS NULL
        `),
        pool.query(`
            SELECT o.order_id, o.client_id, c.first_name, c.last_name, ce.total_amount,
                   ce.client_responded_at
            FROM orders o
            JOIN cost_estimate ce ON ce.order_id = o.order_id AND ce.deleted_at IS NULL
                 AND ce.client_response = 'accepted'
            LEFT JOIN client c ON c.client_id = o.client_id
            LEFT JOIN report r ON r.order_id = o.order_id AND r.deleted_at IS NULL
            WHERE r.report_id IS NULL
            ORDER BY ce.client_responded_at ASC
            LIMIT 50
        `),
        pool.query(`
            SELECT date_trunc('month', client_responded_at) AS month,
                   COUNT(*)::int AS jobs,
                   COALESCE(SUM(total_amount), 0) AS value
            FROM cost_estimate
            WHERE deleted_at IS NULL AND client_response = 'accepted'
              AND client_responded_at >= now() - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month ASC
        `),
    ]);

    const row = pipeline.rows[0];

    return {
        summary: {
            awaitingReview: row.awaiting_review,
            awaitingCustomer: row.awaiting_customer,
            accepted: row.accepted,
            declined: row.declined,
            acceptedValue: Number(row.accepted_value),
            pipelineValue: Number(row.pipeline_value),
        },
        awaitingJobReport: awaitingReport.rows.map((entry) => ({
            orderId: entry.order_id,
            clientId: entry.client_id,
            clientName: [entry.first_name, entry.last_name].filter(Boolean).join(' ') || null,
            value: Number(entry.total_amount ?? 0),
            acceptedAt: entry.client_responded_at,
        })),
        monthly: monthly.rows.map((entry) => ({
            month: entry.month,
            jobs: entry.jobs,
            value: Number(entry.value),
        })),
    };
}
