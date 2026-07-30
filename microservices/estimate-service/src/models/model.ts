// This interface describes the shape of a cost_estimate row
// coming back from the database
export interface CostEstimate {
    estimate_id: number;
    order_id: number;
    inspector_id: number;
    admin_id: number | null;   // null because not every estimate has an admin assigned
    details: string;
    estimate_date: string;      // comes back as a string from pg
    status: string;             // 'draft' | 'submitted' | 'approved' | 'rejected'
}

// When creating a new estimate, the user doesn't provide estimate_id
// because the database auto-generates it (SERIAL PRIMARY KEY)
export interface CreateEstimateInput {
    order_id: number;
    inspector_id: number;
    admin_id?: number | null;   // optional when creating
    details: string;
    estimate_date: string;
    status: string;
}

// When updating, all fields are optional — you only send what you want to change
export interface UpdateEstimateInput {
    order_id?: number;
    inspector_id?: number;
    admin_id?: number | null;
    details?: string;
    estimate_date?: string;
    status?: string;
}

// GET endpoints join in client/inspector names for display purposes.
// The cost_estimate table itself has no name or dollar-amount columns —
// only IDs, details text, a date, and a status.
export interface CostEstimateWithNames extends CostEstimate {
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}