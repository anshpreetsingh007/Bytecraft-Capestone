import { Router } from 'express';
import * as estimateController from '../controllers/controller';

const router = Router();

// IMPORTANT: Put specific paths BEFORE the generic /:id path!
// Otherwise Express thinks "order" is an ID and tries to parse it as a number

// GET /api/estimates — list all (optionally filter by ?status=approved)
router.get('/', estimateController.getAll);

// GET /api/estimates/order/5 — get all estimates for order #5
router.get('/order/:orderId', estimateController.getByOrder);

// GET /api/estimates/inspector/3 — get all estimates by inspector #3
router.get('/inspector/:inspectorId', estimateController.getByInspector);

// GET /api/estimates/7 — get estimate #7
router.get('/:id', estimateController.getById);

// POST /api/estimates — create a new estimate
router.post('/', estimateController.create);

// PUT /api/estimates/7 — full update of estimate #7
router.put('/:id', estimateController.update);

// PATCH /api/estimates/7/status — update only the status of estimate #7
router.patch('/:id/status', estimateController.updateStatus);

// DELETE /api/estimates/7 — delete estimate #7
router.delete('/:id', estimateController.remove);

export default router;
