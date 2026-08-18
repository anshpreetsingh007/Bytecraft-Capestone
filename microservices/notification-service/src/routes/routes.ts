import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { asyncHandler, requireAuth, requireInternal } from '../shared';

const router = Router();

// Specific paths before the generic /:id path.

// GET /api/notifications?unreadOnly=true&page=1&limit=20
router.get('/', requireAuth, asyncHandler(notificationController.getAll));

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, asyncHandler(notificationController.getUnreadCount));

// Raised by other services, never by the browser -- so these two require the
// internal shared secret rather than a user token. Without that, anyone could
// have posted a fake "your estimate was approved" alert to any customer.
router.post('/', requireInternal, asyncHandler(notificationController.create));
router.post('/broadcast-admins', requireInternal, asyncHandler(notificationController.broadcastAdmins));

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, asyncHandler(notificationController.markAllAsRead));

// PATCH /api/notifications/7/read
router.patch('/:id/read', requireAuth, asyncHandler(notificationController.markAsRead));

// DELETE /api/notifications/7
router.delete('/:id', requireAuth, asyncHandler(notificationController.remove));

export default router;
