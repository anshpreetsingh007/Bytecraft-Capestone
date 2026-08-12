// db cost_estimate row

// A single material line stored on the estimate.
export interface EstimateMaterial {
    material_id: number;
    quantity: number;
    cost: number;
}

// The roof measurements the estimate was calculated from. Persisted so an
// estimate can be reopened and edited rather than re-entered from scratch —
// `details` is only a rendered summary and can't be reversed back into inputs.
// pitch is optional on the form, hence nullable.
export interface EstimateDimensions {
    length_ft: number | null;
    width_ft: number | null;
    pitch_ft: number | null;
}

export interface CostEstimate extends EstimateDimensions {
    estimate_id: number;
    order_id: number;
    inspector_id: number;
    admin_id: number | null;   // null because not every estimate has an admin assigned
    details: string;
    estimate_date: string;      // comes back as a string from pg
    status: string;             // 'draft' | 'submitted' | 'approved' | 'rejected'
    material_id?: number | null;
    material_quantity?: number | null;
    materials?: EstimateMaterial[];
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
    materials?: EstimateMaterial[];
    length_ft?: number | null;
    width_ft?: number | null;
    pitch_ft?: number | null;
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
    materials?: EstimateMaterial[];
    length_ft?: number | null;
    width_ft?: number | null;
    pitch_ft?: number | null;
}

// estimate with joined names

export interface CostEstimateWithNames extends CostEstimate {
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}