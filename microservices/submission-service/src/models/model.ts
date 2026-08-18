export const REQUEST_STATUSES = [
    'pending',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/**
 * Which status changes are allowed from where.
 *
 * The status column used to be a free-form VARCHAR that any caller could set
 * to anything, so a request could jump from 'pending' straight to 'completed'
 * without an inspector ever being assigned, or come back from 'cancelled'.
 */
export const REQUEST_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['in_progress', 'pending', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export const ORDER_STATUSES = ['active', 'estimated', 'scheduled', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface InspectionRequest {
    request_id: number;
    client_id: number;
    inspector_id: number | null;
    status: RequestStatus;
    details: string;
    scheduled_date: string | null;
    duration_minutes: number;
    site_address: string | null;
    contact_phone: string | null;
    cancelled_reason: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface InspectionRequestWithDetails extends InspectionRequest {
    client_first_name: string | null;
    client_last_name: string | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
    existing_order_id: number | null;
}

export interface CreateInspectionRequestInput {
    client_id: number;
    details: string;
    site_address: string | null;
    contact_phone: string | null;
}

export interface UpdateInspectionRequestInput {
    inspector_id?: number | null;
    details?: string;
    site_address?: string | null;
    contact_phone?: string | null;
    scheduled_date?: string | null;
    duration_minutes?: number;
}

export interface ScheduleInput {
    inspector_id: number;
    scheduled_date: Date;
    duration_minutes: number;
}

export interface Order {
    order_id: number;
    client_id: number;
    request_id: number | null;
    order_date: string;
    status: OrderStatus;
}

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

export interface Inspector {
    inspector_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

/** Weekly working hours, stored as minutes past midnight. 0 = Sunday. */
export interface AvailabilityWindow {
    availability_id?: number;
    inspector_id?: number;
    weekday: number;
    start_minute: number;
    end_minute: number;
}

export interface ScheduleConflict {
    kind: 'appointment' | 'outside_hours' | 'time_off';
    message: string;
    request_id?: number;
    scheduled_date?: string;
}
