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