// Mirrors the response shapes returned by report-service (port 3006).
// Keep in sync with microservices/report-service/src/services/reportService.ts

export interface ReportOverview {
  inspections: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    acceptedJobs: number;
  };
  inspectors: {
    total: number;
    activeLast30Days: number;
    avgInspectionsPerInspector: number;
  };
}

export type ReportPeriod = "month" | "quarter" | "year";

export interface FinancialReportEntry {
  period: string; // ISO timestamp, truncated to the selected period
  materialUsedCost: number;
  materialWasteCost: number;
  profit: number;
  labourHours: number;
  jobsReported: number;
}

export interface InspectorPerformance {
  inspectorId: number;
  name: string;
  email: string;
  jobsCompleted: number;
  totalProfit: number;
  avgMaterialWaste: number;
  inspectionsAssigned: number;
  inspectionsCompleted: number;
  completionRate: number;
}

export interface EstimateReport {
  total: number;
  byStatus: Record<string, number>;
  byClientResponse: Record<string, { count: number; value: number }>;
  /** How often an estimate clears internal review. */
  approvalRate: number;
  /** How often a customer says yes once it reaches them. */
  acceptanceRate: number;
}

/**
 * Replaces the old invoice report.
 *
 * There is no invoicing in the product -- customers pay in cash or arrange
 * financing over the phone -- so "money owed" is not something the system
 * knows. What it does know is the pipeline: work priced, work the customer has
 * agreed to, and work finished but not yet written up.
 */
export interface AwaitingJobReport {
  orderId: number;
  clientId: number;
  clientName: string | null;
  value: number;
  acceptedAt: string;
}

export interface JobsReport {
  summary: {
    awaitingReview: number;
    awaitingCustomer: number;
    accepted: number;
    declined: number;
    acceptedValue: number;
    pipelineValue: number;
  };
  awaitingJobReport: AwaitingJobReport[];
  monthly: { month: string; jobs: number; value: number }[];
}
