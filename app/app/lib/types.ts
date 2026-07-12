export type EstimateStatus = "draft" | "submitted" | "approved" | "denied";
export type OrderStatus = "pending" | "in_progress" | "completed";

export interface Estimate {
  id: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  length: number;
  width: number;
  height: number;
  material: string;
  costPerSheet: number;
  wastagePercent: number;
  laborCost: number;
  sheetsNeeded: number;
  totalCost: number;
  status: EstimateStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  estimateId: string;
  projectName: string;
  clientName: string;
  totalCost: number;
  status: OrderStatus;
  createdAt: string;
}