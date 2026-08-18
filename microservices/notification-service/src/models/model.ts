export type RecipientType = 'admin' | 'client' | 'inspector' | 'super_admin';

/**
 * Kept in lockstep with the CHECK constraint in
 * database/migrations/002_platform_hardening.sql. They had drifted:
 * estimate-service was emitting 'estimate_submitted', which the database
 * rejected with a 23514 that the fire-and-forget catch then swallowed, so the
 * "estimate needs approval" alert never reached anyone.
 */
export type NotificationType =
    | 'inspection_request_submitted'
    | 'inspection_assigned'
    | 'inspection_scheduled'
    | 'inspection_status_changed'
    | 'estimate_submitted'
    | 'estimate_approved'
    | 'estimate_rejected'
    | 'estimate_accepted_by_client'
    | 'estimate_declined_by_client'
    | 'job_report_submitted'
    | 'low_stock'
    | 'role_changed';

export const RECIPIENT_TYPES: readonly RecipientType[] = ['admin', 'client', 'inspector', 'super_admin'];

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
    'inspection_request_submitted',
    'inspection_assigned',
    'inspection_scheduled',
    'inspection_status_changed',
    'estimate_submitted',
    'estimate_approved',
    'estimate_rejected',
    'estimate_accepted_by_client',
    'estimate_declined_by_client',
    'job_report_submitted',
    'low_stock',
    'role_changed',
];

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

export interface CreateNotificationInput {
    recipient_type: RecipientType;
    recipient_id: number;
    type: NotificationType;
    title: string;
    message?: string | null;
    related_entity_type?: string | null;
    related_entity_id?: number | null;
}

export interface BroadcastInput {
    type: NotificationType;
    title: string;
    message?: string | null;
    related_entity_type?: string | null;
    related_entity_id?: number | null;
}
