export const ESTIMATE_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const CLIENT_RESPONSES = ['pending', 'accepted', 'declined'] as const;
export type ClientResponse = (typeof CLIENT_RESPONSES)[number];

/**
 * Who is allowed to move an estimate where.
 *
 * 'approved' means an admin considers the estimate fit to send to the
 * customer. It is not the customer agreeing to it -- that is client_response,
 * and it is what actually starts the job.
 */
export const ESTIMATE_TRANSITIONS: Record<EstimateStatus, readonly EstimateStatus[]> = {
    draft: ['submitted'],
    submitted: ['approved', 'rejected', 'draft'],
    approved: ['rejected'],
    rejected: ['submitted', 'draft'],
};

export interface EstimateMaterial {
    material_id: number;
    quantity: number;
    cost: number;
}

export interface EstimateDimensions {
    length_ft: number | null;
    width_ft: number | null;
    pitch_ft: number | null;
}

export interface CostEstimate extends EstimateDimensions {
    estimate_id: number;
    order_id: number;
    inspector_id: number;
    admin_id: number | null;
    details: string;
    estimate_date: string;
    status: EstimateStatus;
    materials: EstimateMaterial[];
    total_amount: string | number | null;
    client_response: ClientResponse;
    client_responded_at: string | null;
    client_response_note: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface CostEstimateWithNames extends CostEstimate {
    client_id: number | null;
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}

export interface CreateEstimateInput {
    order_id: number;
    inspector_id: number;
    admin_id: number | null;
    details: string;
    estimate_date: string;
    status: EstimateStatus;
    materials: EstimateMaterial[];
    total_amount: number | null;
    length_ft: number | null;
    width_ft: number | null;
    pitch_ft: number | null;
}

export interface UpdateEstimateInput {
    details?: string;
    estimate_date?: string;
    status?: EstimateStatus;
    materials?: EstimateMaterial[];
    total_amount?: number | null;
    length_ft?: number | null;
    width_ft?: number | null;
    pitch_ft?: number | null;
    inspector_id?: number;
    admin_id?: number | null;
}
