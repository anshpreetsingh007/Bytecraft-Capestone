// Mirrors the response shapes returned by report-service (port 3006).
// Keep in sync with microservices/report-service/src/services/reportService.ts

export interface ReportOverview {
  inspections: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
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
}

export interface EstimateReport {
  total: number;
  byStatus: Record<string, number>;
  approvalRate: number;
}

export interface OverdueInvoice {
  invoiceId: number;
  clientId: number;
  totalAmount: number;
  dueDate: string;
  status: string;
}

export interface InvoiceReport {
  summary: {
    paidCount: number;
    overdueCount: number;
    pendingCount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  overdueInvoices: OverdueInvoice[];
}
