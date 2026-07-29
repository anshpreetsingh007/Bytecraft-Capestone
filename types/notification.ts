// Mirrors the response shape from notification-service (port 3005).
// Keep in sync with microservices/notification-service/src/models/model.ts

export type NotificationRecipientType = "admin" | "client" | "inspector";

export type NotificationType =
  | "estimate_approved"
  | "low_stock"
  | "inspection_request_submitted";

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