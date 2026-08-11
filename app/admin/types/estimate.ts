
// Types for the Estimates (approve/reject) page
// Mirrors estimate-service's joined GET response (port 3002).
// Note: cost_estimate has no dollar-amount column — the creation
// form above embeds "Total: $X.XX" inside `details` as text, which
// the approve page parses back out for display.

export type EstimateStatus = "draft" | "submitted" | "approved" | "rejected";

export interface EstimateWithNames {
  estimate_id: number;
  order_id: number;
  inspector_id: number;
  admin_id: number | null;
  details: string;
  estimate_date: string;
  status: EstimateStatus;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
}
