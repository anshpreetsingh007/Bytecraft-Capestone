import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import { isValidRecipientType, isValidNotificationType, NOTIFICATION_TYPE_ERROR } from '../models/model';

// create (single recipient)
export async function create(req: Request, res: Response) {
    try {
        const { recipient_type, recipient_id, type, title, message, related_entity_type, related_entity_id } = req.body;

        if (!recipient_type || !recipient_id || !type || !title) {
            res.status(400).json({ error: 'Missing required fields: recipient_type, recipient_id, type, title' });
            return;
        }
        if (!isValidRecipientType(recipient_type)) {
            res.status(400).json({ error: "Invalid recipient_type. Must be 'admin', 'client', or 'inspector'." });
            return;
        }
        if (!isValidNotificationType(type)) {
            res.status(400).json({ error: NOTIFICATION_TYPE_ERROR });
            return;
        }

        const notification = await notificationService.createNotification({
            recipient_type,
            recipient_id,
            type,
            title,
            message,
            related_entity_type,
            related_entity_id,
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
}

// broadcast to all admins
export async function broadcastAdmins(req: Request, res: Response) {
    try {
        const { type, title, message, related_entity_type, related_entity_id } = req.body;

        if (!type || !title) {
            res.status(400).json({ error: 'Missing required fields: type, title' });
            return;
        }
        if (!isValidNotificationType(type)) {
            res.status(400).json({ error: NOTIFICATION_TYPE_ERROR });
            return;
        }

        const notifications = await notificationService.broadcastToAdmins({
            type,
            title,
            message,
            related_entity_type,
            related_entity_id,
        });

        res.status(201).json(notifications);
    } catch (error) {
        console.error('Error broadcasting notification to admins:', error);
        res.status(500).json({ error: 'Failed to broadcast notification' });
    }
}

// list notifications for a recipient
// GET /api/notifications?recipientType=admin&recipientId=1&unreadOnly=true&limit=20
export async function getAll(req: Request, res: Response) {
    try {
        const recipientType = req.query.recipientType as string;
        const recipientId = parseInt(req.query.recipientId as string);
        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

        if (!recipientType || !recipientId || isNaN(recipientId)) {
            res.status(400).json({ error: 'Missing or invalid required query params: recipientType, recipientId' });
            return;
        }
        if (!isValidRecipientType(recipientType)) {
            res.status(400).json({ error: "Invalid recipientType. Must be 'admin', 'client', or 'inspector'." });
            return;
        }

        const notifications = await notificationService.getNotifications(recipientType, recipientId, unreadOnly, limit);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

// unread count
// GET /api/notifications/unread-count?recipientType=admin&recipientId=1
export async function getUnreadCount(req: Request, res: Response) {
    try {
        const recipientType = req.query.recipientType as string;
        const recipientId = parseInt(req.query.recipientId as string);

        if (!recipientType || !recipientId || isNaN(recipientId)) {
            res.status(400).json({ error: 'Missing or invalid required query params: recipientType, recipientId' });
            return;
        }
        if (!isValidRecipientType(recipientType)) {
            res.status(400).json({ error: "Invalid recipientType. Must be 'admin', 'client', or 'inspector'." });
            return;
        }

        const count = await notificationService.getUnreadCount(recipientType, recipientId);
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
}

// mark one as read
export async function markAsRead(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const updated = await notificationService.markAsRead(id);

        if (!updated) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

// mark all as read
// PATCH /api/notifications/read-all  body: { recipientType, recipientId }
export async function markAllAsRead(req: Request, res: Response) {
    try {
        const { recipientType, recipientId } = req.body;

        if (!recipientType || !recipientId) {
            res.status(400).json({ error: 'Missing required fields: recipientType, recipientId' });
            return;
        }
        if (!isValidRecipientType(recipientType)) {
            res.status(400).json({ error: "Invalid recipientType. Must be 'admin', 'client', or 'inspector'." });
            return;
        }

        const updatedCount = await notificationService.markAllAsRead(recipientType, recipientId);
        res.json({ updatedCount });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
}

// delete / dismiss
export async function remove(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const deleted = await notificationService.deleteNotification(id);

        if (!deleted) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
}