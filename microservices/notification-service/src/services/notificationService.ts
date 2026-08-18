import { pool } from '../config/db';
import {
    BroadcastInput,
    CreateNotificationInput,
    Notification,
    RecipientType,
} from '../models/model';
import type { Pagination } from '../shared';

export async function createNotification(data: CreateNotificationInput): Promise<Notification> {
    const result = await pool.query(
        `INSERT INTO notification
            (recipient_type, recipient_id, type, title, message, related_entity_type, related_entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         -- One open low-stock alert per item. Without this the inventory page
         -- would raise a fresh alert on every save while an item stayed low.
         ON CONFLICT (related_entity_type, related_entity_id)
             WHERE type = 'low_stock' AND is_read = FALSE
             DO NOTHING
         RETURNING *`,
        [
            data.recipient_type,
            data.recipient_id,
            data.type,
            data.title,
            data.message ?? null,
            data.related_entity_type ?? null,
            data.related_entity_id ?? null,
        ],
    );

    if (result.rows[0]) return result.rows[0];

    // DO NOTHING returned no row, so an equivalent open alert already exists.
    const existing = await pool.query(
        `SELECT * FROM notification
         WHERE related_entity_type = $1 AND related_entity_id = $2
           AND type = 'low_stock' AND is_read = FALSE`,
        [data.related_entity_type ?? null, data.related_entity_id ?? null],
    );
    return existing.rows[0];
}

/**
 * Fan out to every admin and super admin. An estimate awaiting approval is not
 * owned by one admin -- it sits in a shared queue -- and super admins were
 * previously left out of the broadcast entirely.
 */
export async function broadcastToAdmins(data: BroadcastInput): Promise<Notification[]> {
    const recipients = await pool.query(
        `SELECT 'admin' AS recipient_type, admin_id AS recipient_id FROM admin WHERE is_active
         UNION ALL
         SELECT 'super_admin' AS recipient_type, super_admin_id AS recipient_id FROM super_admin WHERE is_active`,
    );

    const created: Notification[] = [];
    for (const row of recipients.rows) {
        const notification = await createNotification({
            recipient_type: row.recipient_type as RecipientType,
            recipient_id: row.recipient_id,
            type: data.type,
            title: data.title,
            message: data.message,
            related_entity_type: data.related_entity_type,
            related_entity_id: data.related_entity_id,
        });
        if (notification) created.push(notification);
    }

    return created;
}

export async function listNotifications(
    recipientType: RecipientType,
    recipientId: number,
    unreadOnly: boolean,
    page: Pagination,
): Promise<{ rows: Notification[]; total: number }> {
    const filters = ['recipient_type = $1', 'recipient_id = $2'];
    if (unreadOnly) filters.push('is_read = FALSE');
    const where = `WHERE ${filters.join(' AND ')}`;

    const [rows, total] = await Promise.all([
        pool.query(
            `SELECT * FROM notification ${where}
             ORDER BY created_at DESC, notification_id DESC
             LIMIT $3 OFFSET $4`,
            [recipientType, recipientId, page.limit, page.offset],
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM notification ${where}`, [
            recipientType,
            recipientId,
        ]),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getUnreadCount(recipientType: RecipientType, recipientId: number): Promise<number> {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notification
         WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = FALSE`,
        [recipientType, recipientId],
    );
    return result.rows[0].count;
}

/**
 * Scoped to the recipient on purpose. Passing the id alone would let any
 * signed-in user mark, or delete, somebody else's notifications by guessing
 * sequential ids.
 */
export async function markAsRead(
    id: number,
    recipientType: RecipientType,
    recipientId: number,
): Promise<Notification | null> {
    const result = await pool.query(
        `UPDATE notification
         SET is_read = TRUE, read_at = now()
         WHERE notification_id = $1 AND recipient_type = $2 AND recipient_id = $3
         RETURNING *`,
        [id, recipientType, recipientId],
    );
    return result.rows[0] ?? null;
}

export async function markAllAsRead(recipientType: RecipientType, recipientId: number): Promise<number> {
    const result = await pool.query(
        `UPDATE notification
         SET is_read = TRUE, read_at = now()
         WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = FALSE`,
        [recipientType, recipientId],
    );
    return result.rowCount ?? 0;
}

export async function deleteNotification(
    id: number,
    recipientType: RecipientType,
    recipientId: number,
): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM notification WHERE notification_id = $1 AND recipient_type = $2 AND recipient_id = $3',
        [id, recipientType, recipientId],
    );
    return (result.rowCount ?? 0) > 0;
}
