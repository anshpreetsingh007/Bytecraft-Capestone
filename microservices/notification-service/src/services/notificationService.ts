import { pool } from '../config/db';
import {
    Notification,
    RecipientType,
    CreateNotificationInput,
    BroadcastAdminsInput,
} from '../models/model';

// ─── CREATE (single recipient) ──────────────────────────────
// Used for things like "estimate approved" -> notify one specific client.
export async function createNotification(data: CreateNotificationInput): Promise<Notification> {
    const result = await pool.query(
        `INSERT INTO notification
            (recipient_type, recipient_id, type, title, message, related_entity_type, related_entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         -- If this is a low_stock alert and an unread one already exists for the
         -- same item, don't insert a duplicate — just return the existing row.
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
        ]
    );

    if (result.rows[0]) {
        return result.rows[0];
    }

    // ON CONFLICT DO NOTHING means no row was returned — fetch the existing one instead.
    const existing = await pool.query(
        `SELECT * FROM notification
         WHERE related_entity_type = $1 AND related_entity_id = $2
           AND type = 'low_stock' AND is_read = FALSE`,
        [data.related_entity_type ?? null, data.related_entity_id ?? null]
    );
    return existing.rows[0];
}

// ─── BROADCAST TO ALL ADMINS ────────────────────────────────
// Used for "low stock" and "inspection request submitted" alerts,
// which every admin should see.
export async function broadcastToAdmins(data: BroadcastAdminsInput): Promise<Notification[]> {
    const admins = await pool.query('SELECT admin_id FROM admin');

    if (admins.rows.length === 0) {
        return [];
    }

    const created: Notification[] = [];
    for (const row of admins.rows) {
        const notification = await createNotification({
            recipient_type: 'admin',
            recipient_id: row.admin_id,
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

// ─── LIST NOTIFICATIONS FOR A RECIPIENT ─────────────────────
export async function getNotifications(
    recipientType: RecipientType,
    recipientId: number,
    unreadOnly: boolean,
    limit: number
): Promise<Notification[]> {
    const conditions = ['recipient_type = $1', 'recipient_id = $2'];
    const params: any[] = [recipientType, recipientId];

    if (unreadOnly) {
        conditions.push('is_read = FALSE');
    }

    params.push(limit);

    const result = await pool.query(
        `SELECT * FROM notification
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT $${params.length}`,
        params
    );

    return result.rows;
}

// ─── UNREAD COUNT (for a bell-icon badge) ───────────────────
export async function getUnreadCount(recipientType: RecipientType, recipientId: number): Promise<number> {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notification
         WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = FALSE`,
        [recipientType, recipientId]
    );
    return result.rows[0].count;
}

// ─── MARK ONE AS READ ────────────────────────────────────────
export async function markAsRead(id: number): Promise<Notification | null> {
    const result = await pool.query(
        `UPDATE notification
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE notification_id = $1
         RETURNING *`,
        [id]
    );
    return result.rows[0] || null;
}

// ─── MARK ALL AS READ FOR A RECIPIENT ───────────────────────
export async function markAllAsRead(recipientType: RecipientType, recipientId: number): Promise<number> {
    const result = await pool.query(
        `UPDATE notification
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = FALSE`,
        [recipientType, recipientId]
    );
    return result.rowCount ?? 0;
}

// ─── DELETE / DISMISS ────────────────────────────────────────
export async function deleteNotification(id: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM notification WHERE notification_id = $1',
        [id]
    );
    return (result.rowCount ?? 0) > 0;
}
