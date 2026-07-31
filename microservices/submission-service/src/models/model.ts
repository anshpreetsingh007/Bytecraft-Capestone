// This interface describes the shape of an inspection_request row
// coming back from the database
export interface InspectionRequest {
    request_id: number;
    client_id: number;
    inspector_id: number | null;   // null until an inspector is assigned
    status: string;                 // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    details: string;
    scheduled_date: string | null;  // comes back as a string from pg; null until scheduled
}

// When a client submits a new request, they don't pick an inspector or a
// scheduled date — those get filled in later by an admin/inspector.
export interface CreateInspectionRequestInput {
    client_id: number;
    details: string;
    status?: string;                // defaults to 'pending' if not provided
}

// When updating, all fields are optional — you only send what you want to change
export interface UpdateInspectionRequestInput {
    client_id?: number;
    inspector_id?: number | null;
    details?: string;
    status?: string;
    scheduled_date?: string | null;
}

// Joined view for the admin UI — includes names instead of bare IDs, plus
// whether this request already has an order (so the UI can hide/disable
// the "Convert to Order" action).
export interface InspectionRequestWithDetails extends InspectionRequest {
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
    existing_order_id: number | null;
}

// ─── Orders ────────────────────────────────────────────────
// `orders` is the bridge between an inspection_request and a cost_estimate.
// Nothing else in the system creates one — a request becomes an order only
// through the explicit convert-to-order action below.
export interface Order {
    order_id: number;
    client_id: number;
    request_id: number | null;
    order_date: string;
    status: string; // 'active' | 'estimated' | 'completed' | 'cancelled'
}

// Joined view used by the admin UI (the estimate-creation page) so it can
// show a real customer name/address/phone/email instead of bare IDs.
export interface OrderWithDetails extends Order {
    client_first_name: string | null;
    client_last_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    client_address: string | null;
    request_details: string | null;
    request_scheduled_date: string | null;
    inspector_id: number | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}

// ─── Inspectors ────────────────────────────────────────────
// Since the dedicated inspector-assignment page was scrapped, the admin
// picks an inspector directly on the estimate-creation form instead — this
// is what powers that dropdown.
export interface Inspector {
    inspector_id: number;
    first_name: string;
    last_name: string;
    email: string;
}