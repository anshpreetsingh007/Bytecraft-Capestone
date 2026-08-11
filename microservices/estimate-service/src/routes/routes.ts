import { Router } from 'express';
import * as estimateController from '../controllers/controller';

const router = Router();


// GET /api/estimates — list all (optionally filter by ?status=approved)
router.get('/', estimateController.getAll);

// GET /api/estimates/client/3 — get all estimates for client #3
router.get('/client/:clientId', estimateController.getByClient);

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
