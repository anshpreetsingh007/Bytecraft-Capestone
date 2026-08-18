import { Router } from 'express';
import * as estimateController from '../controllers/controller';
import { asyncHandler, requireAuth, requireRole } from '../shared';

const router = Router();

const AUTHOR = requireRole('inspector', 'admin', 'super_admin');
const ADMIN = requireRole('admin', 'super_admin');

// Specific paths before the generic /:id path.

// GET /api/estimates?status=approved&page=1
router.get('/', requireAuth, asyncHandler(estimateController.getAll));

// GET /api/estimates/client/3
router.get('/client/:clientId', requireAuth, asyncHandler(estimateController.getByClient));

// GET /api/estimates/inspector/3
router.get('/inspector/:inspectorId', requireAuth, asyncHandler(estimateController.getByInspector));

// GET /api/estimates/7
router.get('/:id', requireAuth, asyncHandler(estimateController.getById));

// POST /api/estimates
router.post('/', AUTHOR, asyncHandler(estimateController.create));

// PUT /api/estimates/7
router.put('/:id', AUTHOR, asyncHandler(estimateController.update));

// PATCH /api/estimates/7/status — approve or reject
router.patch('/:id/status', ADMIN, asyncHandler(estimateController.updateStatus));

// PATCH /api/estimates/7/response — the customer accepting or declining
router.patch('/:id/response', requireAuth, asyncHandler(estimateController.respond));

// DELETE /api/estimates/7 — soft delete
router.delete('/:id', ADMIN, asyncHandler(estimateController.remove));

export default router;
