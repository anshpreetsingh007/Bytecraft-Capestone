// Mirrors the response shape from notification-service (port 3005).
// Keep in sync with microservices/notification-service/src/models/model.ts
// and the CHECK constraint in database/migrations/002_platform_hardening.sql.

export type NotificationRecipientType = "admin" | "client" | "inspector" | "super_admin";

export type NotificationType =
  | "inspection_request_submitted"
  | "inspection_assigned"
  | "inspection_scheduled"
  | "inspection_status_changed"
  | "estimate_submitted"
  | "estimate_approved"
  | "estimate_rejected"
  | "estimate_accepted_by_client"
  | "estimate_declined_by_client"
  | "job_report_submitted"
  | "low_stock"
  | "role_changed";

export interface Notification {
  notification_id: number;
  recipient_type: NotificationRecipientType;
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
