import { Router } from 'express';
import * as submissionController from '../controllers/submissionController';

const router = Router();

// IMPORTANT: specific paths before generic /:id path (same convention as estimate-service)

// GET /api/inspection-requests — list all (optionally filter by ?status=pending)
router.get('/', submissionController.getAll);

// GET /api/inspection-requests/client/5 — get all requests submitted by client #5
router.get('/client/:clientId', submissionController.getByClient);

// GET /api/inspection-requests/inspector/3 — get all requests assigned to inspector #3
router.get('/inspector/:inspectorId', submissionController.getByInspector);

// GET /api/inspection-requests/7 — get request #7
router.get('/:id', submissionController.getById);

// POST /api/inspection-requests — client submits a new request
router.post('/', submissionController.create);

// PUT /api/inspection-requests/7 — full update (e.g. assign inspector, set schedule)
router.put('/:id', submissionController.update);

// PATCH /api/inspection-requests/7/status — update only the status
router.patch('/:id/status', submissionController.updateStatus);

// DELETE /api/inspection-requests/7 — delete request #7
router.delete('/:id', submissionController.remove);

export default router;
