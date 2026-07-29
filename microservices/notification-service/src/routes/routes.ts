import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';

const router = Router();

// IMPORTANT: specific paths before generic /:id path (same convention as estimate-service)

// GET /api/notifications?recipientType=admin&recipientId=1&unreadOnly=true&limit=20
router.get('/', notificationController.getAll);

// GET /api/notifications/unread-count?recipientType=admin&recipientId=1
router.get('/unread-count', notificationController.getUnreadCount);

// POST /api/notifications — create a notification for a single recipient
router.post('/', notificationController.create);

// POST /api/notifications/broadcast-admins — create the same notification for every admin
router.post('/broadcast-admins', notificationController.broadcastAdmins);

// PATCH /api/notifications/read-all — mark all of a recipient's notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/7/read — mark notification #7 as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/7 — dismiss/delete notification #7
router.delete('/:id', notificationController.remove);

export default router;