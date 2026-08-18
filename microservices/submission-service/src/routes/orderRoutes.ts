import { Router } from 'express';
import * as ordersController from '../controllers/ordersController';
import { asyncHandler, requireAuth, requireRole } from '../shared';

const router = Router();

// Specific paths before the generic /:id path.

// GET /api/orders?status=active&needsEstimate=true
router.get('/', requireAuth, asyncHandler(ordersController.getAll));

// GET /api/orders/client/5
router.get('/client/:clientId', requireAuth, asyncHandler(ordersController.getByClient));

// POST /api/orders/from-request/12
router.post(
    '/from-request/:requestId',
    requireRole('admin', 'super_admin'),
    asyncHandler(ordersController.convertToOrder),
);

// GET /api/orders/7
router.get('/:id', requireAuth, asyncHandler(ordersController.getById));

// PATCH /api/orders/7/status
router.patch(
    '/:id/status',
    requireRole('admin', 'super_admin'),
    asyncHandler(ordersController.updateStatus),
);

export default router;
