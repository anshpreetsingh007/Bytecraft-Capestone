import { pool } from '../config/db';

export type ReportPeriod = 'month' | 'quarter' | 'year';

const VALID_PERIODS: ReportPeriod[] = ['month', 'quarter', 'year'];

export function isValidPeriod(value: string): value is ReportPeriod {
    return VALID_PERIODS.includes(value as ReportPeriod);
}

// OVERVIEW:  dashboard summary cards

export async function getOverview() {
    const [inspections, revenue, inspectors] = await Promise.all([
        pool.query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE status NOT IN ('completed', 'pending'))::int AS in_progress
            FROM inspection_request
        `),
        pool.query(`
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(SUM(total_amount) FILTER (
                    WHERE date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE)
                ), 0) AS this_month_revenue,
                COALESCE(SUM(total_amount) FILTER (
                    WHERE date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                ), 0) AS last_month_revenue
            FROM invoice
        `),
        pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM inspector) AS total_inspectors,
                (SELECT COUNT(DISTINCT inspector_id)::int FROM inspection_request
                    WHERE scheduled_date >= CURRENT_DATE - INTERVAL '30 days') AS active_inspectors,
                (SELECT COUNT(*)::int FROM inspection_request
                    WHERE scheduled_date >= CURRENT_DATE - INTERVAL '30 days') AS inspections_last_30_days
        `),
    ]);

    const insp = inspections.rows[0];
    const rev = revenue.rows[0];
    const team = inspectors.rows[0];

    return {
        inspections: {
            total: insp.total,
            completed: insp.completed,
            pending: insp.pending,
            inProgress: insp.in_progress,
        },
        revenue: {
            total: Number(rev.total_revenue),
            thisMonth: Number(rev.this_month_revenue),
            lastMonth: Number(rev.last_month_revenue),
        },
        inspectors: {
            total: team.total_inspectors,
            activeLast30Days: team.active_inspectors,
            avgInspectionsPerInspector:
                team.active_inspectors > 0
                    ? Number((team.inspections_last_30_days / team.active_inspectors).toFixed(2))
                    : 0,
        },
    };
}

// FINANCIAL: material waste + profit trends over time

export async function getFinancialReport(period: ReportPeriod, start?: string, end?: string) {
    const conditions: string[] = [];
    const params: any[] = [period];

    if (start) {
        params.push(start);
        conditions.push(`report_date >= $${params.length}`);
    }
    if (end) {
        params.push(end);
        conditions.push(`report_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
        `
        SELECT
            date_trunc($1, report_date) AS period,
            COALESCE(SUM(material_used_cost), 0) AS material_used_cost,
            COALESCE(SUM(material_waste_cost), 0) AS material_waste_cost,
            COALESCE(SUM(profit), 0) AS profit,
            COUNT(*)::int AS jobs_reported
        FROM report
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC
        `,
        params
    );

    return result.rows.map((row) => ({
        period: row.period,
        materialUsedCost: Number(row.material_used_cost),
        materialWasteCost: Number(row.material_waste_cost),
        profit: Number(row.profit),
        jobsReported: row.jobs_reported,
    }));
}

// INSPECTORS: per-inspector performance

export async function getInspectorPerformance() {
    const result = await pool.query(`
        WITH report_stats AS (
            SELECT
                inspector_id,
                COUNT(*)::int AS jobs_completed,
                COALESCE(SUM(profit), 0) AS total_profit,
                COALESCE(AVG(material_waste_cost), 0) AS avg_material_waste
            FROM report
            GROUP BY inspector_id
        ),
        inspection_stats AS (
            SELECT
                inspector_id,
                COUNT(*)::int AS inspections_assigned,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS inspections_completed
            FROM inspection_request
            GROUP BY inspector_id
        )
        SELECT
            ins.inspector_id,
            ins.first_name,
            ins.last_name,
            ins.email,
            COALESCE(rs.jobs_completed, 0) AS jobs_completed,
            COALESCE(rs.total_profit, 0) AS total_profit,
            COALESCE(rs.avg_material_waste, 0) AS avg_material_waste,
            COALESCE(ist.inspections_assigned, 0) AS inspections_assigned,
            COALESCE(ist.inspections_completed, 0) AS inspections_completed
        FROM inspector ins
        LEFT JOIN report_stats rs ON rs.inspector_id = ins.inspector_id
        LEFT JOIN inspection_stats ist ON ist.inspector_id = ins.inspector_id
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
    }));
}

// ESTIMATES: approval rate

export async function getEstimateReport() {
    const result = await pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM cost_estimate
        GROUP BY status
    `);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of result.rows) {
        byStatus[row.status ?? 'unknown'] = row.count;
        total += row.count;
    }

    const approved = byStatus['approved'] ?? 0;

    return {
        total,
        byStatus,
        approvalRate: total > 0 ? Number(((approved / total) * 100).toFixed(1)) : 0,
    };
}

// INVOICES: aging / outstanding balance

export async function getInvoiceReport() {
    const [summary, overdue] = await Promise.all([
        pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
                COUNT(*) FILTER (WHERE status != 'paid' AND due_date < CURRENT_DATE)::int AS overdue_count,
                COUNT(*) FILTER (WHERE status != 'paid' AND due_date >= CURRENT_DATE)::int AS pending_count,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
                COALESCE(SUM(total_amount) FILTER (WHERE status != 'paid'), 0) AS total_outstanding
            FROM invoice
        `),
        pool.query(`
            SELECT invoice_id, client_id, total_amount, due_date, status
            FROM invoice
            WHERE status != 'paid' AND due_date < CURRENT_DATE
            ORDER BY due_date ASC
        `),
    ]);

    const s = summary.rows[0];

    return {
        summary: {
            paidCount: s.paid_count,
            overdueCount: s.overdue_count,
            pendingCount: s.pending_count,
            totalPaid: Number(s.total_paid),
            totalOutstanding: Number(s.total_outstanding),
        },
        overdueInvoices: overdue.rows.map((row) => ({
            invoiceId: row.invoice_id,
            clientId: row.client_id,
            totalAmount: Number(row.total_amount),
            dueDate: row.due_date,
            status: row.status,
        })),
    };
}