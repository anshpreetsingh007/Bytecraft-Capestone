import { Router } from 'express';
import * as ordersController from '../controllers/ordersController';

const router = Router();

// IMPORTANT: specific paths before generic /:id path

// GET /api/orders?status=active&needsEstimate=true
router.get('/', ordersController.getAll);

// GET /api/orders/client/5 — all orders belonging to client #5
router.get('/client/:clientId', ordersController.getByClient);

// POST /api/orders/from-request/12 — convert inspection request #12 into an order
router.post('/from-request/:requestId', ordersController.convertToOrder);

// GET /api/orders/7 — get order #7
router.get('/:id', ordersController.getById);

export default router;