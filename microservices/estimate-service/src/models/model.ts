// db cost_estimate row

export interface CostEstimate {
    estimate_id: number;
    order_id: number;
    inspector_id: number;
    admin_id: number | null;   // null because not every estimate has an admin assigned
    details: string;
    estimate_date: string;      // comes back as a string from pg
    status: string;             // 'draft' | 'submitted' | 'approved' | 'rejected'
    material_id?: number | null;
    material_quantity?: number | null;
}

// input for new estimate

export interface CreateEstimateInput {
    order_id: number;
    inspector_id: number;
    admin_id?: number | null;   // optional when creating
    details: string;
    estimate_date: string;
    status: string;
    material_id?: number | null;
    material_quantity?: number | null;
}

// input for updating estimate

export interface UpdateEstimateInput {
    order_id?: number;
    inspector_id?: number;
    admin_id?: number | null;
    details?: string;
    estimate_date?: string;
    status?: string;
    material_id?: number | null;
    material_quantity?: number | null;
}

// estimate with joined names

export interface CostEstimateWithNames extends CostEstimate {
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}