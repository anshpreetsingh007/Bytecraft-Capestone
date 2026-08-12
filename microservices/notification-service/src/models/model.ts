// This interface describes the shape of a notification row
// coming back from the database
export interface Notification {
    notification_id: number;
    recipient_type: RecipientType;
    recipient_id: number;
    type: NotificationType;
    title: string;
    message: string | null;
    related_entity_type: string | null;
    related_entity_id: number | null;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
}

export type RecipientType = 'admin' | 'client' | 'inspector';

export type NotificationType =
    | 'estimate_approved'
    | 'estimate_submitted'
    | 'low_stock'
    | 'inspection_request_submitted';

const VALID_RECIPIENT_TYPES: RecipientType[] = ['admin', 'client', 'inspector'];
const VALID_NOTIFICATION_TYPES: NotificationType[] = [
    'estimate_approved',
    // Raised when an inspector sends an estimate for approval, or edits a
    // settled one back into the queue. Broadcast to admins.
    'estimate_submitted',
    'low_stock',
    'inspection_request_submitted',
];

// Single source of truth for the validation error message, so the list can't
// drift out of sync with VALID_NOTIFICATION_TYPES the way it did before.
export const NOTIFICATION_TYPE_ERROR = `Invalid type. Must be one of: ${VALID_NOTIFICATION_TYPES.map((t) => `'${t}'`).join(', ')}.`;

export function isValidRecipientType(value: string): value is RecipientType {
    return VALID_RECIPIENT_TYPES.includes(value as RecipientType);
}

export function isValidNotificationType(value: string): value is NotificationType {
    return VALID_NOTIFICATION_TYPES.includes(value as NotificationType);
}

// Payload for creating a single notification (e.g. "estimate approved" -> one client)
export interface CreateNotificationInput {
    recipient_type: RecipientType;
    recipient_id: number;
    type: NotificationType;
    title: string;
    message?: string;
    related_entity_type?: string;
    related_entity_id?: number;
}

// Payload for broadcasting the same notification to every admin
// (e.g. "low stock" or "inspection request submitted")
export interface BroadcastAdminsInput {
    type: NotificationType;
    title: string;
    message?: string;
    related_entity_type?: string;
    related_entity_id?: number;
}