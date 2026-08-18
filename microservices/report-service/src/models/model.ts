export const JOB_REPORT_STATUSES = ['draft', 'submitted', 'reviewed'] as const;
export type JobReportStatus = (typeof JOB_REPORT_STATUSES)[number];

/**
 * The write side of the `report` table.
 *
 * The table and the analytics that read from it both existed, but nothing in
 * the system ever inserted a row -- so every financial and per-inspector
 * report was reading from an empty table. This is the inspector-facing job
 * report that finally fills it.
 */
export interface JobReport {
    report_id: number;
    order_id: number;
    inspector_id: number;
    admin_id: number | null;
    title: string;
    findings: string | null;
    recommendations: string | null;
    material_used_cost: string | number | null;
    material_waste_cost: string | number | null;
    labour_hours: string | number | null;
    profit: string | number | null;
    details: string | null;
    report_date: string;
    status: JobReportStatus;
    submitted_at: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface JobReportWithNames extends JobReport {
    client_id: number | null;
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}

export interface CreateJobReportInput {
    order_id: number;
    inspector_id: number;
    title: string;
    findings: string | null;
    recommendations: string | null;
    details: string | null;
    material_used_cost: number | null;
    material_waste_cost: number | null;
    labour_hours: number | null;
    profit: number | null;
    report_date: string;
    status: JobReportStatus;
}

export interface UpdateJobReportInput {
    title?: string;
    findings?: string | null;
    recommendations?: string | null;
    details?: string | null;
    material_used_cost?: number | null;
    material_waste_cost?: number | null;
    labour_hours?: number | null;
    profit?: number | null;
    report_date?: string;
    status?: JobReportStatus;
}
