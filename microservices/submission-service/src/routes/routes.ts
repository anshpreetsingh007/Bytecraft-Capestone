import { Router } from 'express';
import * as submissionController from '../controllers/submissionController';
import { asyncHandler, requireAuth, requireRole, strictRateLimit } from '../shared';

const router = Router();

// Specific paths before the generic /:id path.

// GET /api/inspection-requests?status=pending&page=1
router.get('/', requireAuth, asyncHandler(submissionController.getAll));

// GET /api/inspection-requests/client/5
router.get('/client/:clientId', requireAuth, asyncHandler(submissionController.getByClient));

// GET /api/inspection-requests/inspector/3
router.get('/inspector/:inspectorId', requireAuth, asyncHandler(submissionController.getByInspector));

// GET /api/inspection-requests/7
router.get('/:id', requireAuth, asyncHandler(submissionController.getById));

// POST /api/inspection-requests
router.post('/', requireAuth, strictRateLimit(), asyncHandler(submissionController.create));

// PUT /api/inspection-requests/7
router.put('/:id', requireRole('admin', 'super_admin'), asyncHandler(submissionController.update));

// PATCH /api/inspection-requests/7/schedule
router.patch(
    '/:id/schedule',
    requireRole('admin', 'super_admin'),
    asyncHandler(submissionController.schedule),
);

// PATCH /api/inspection-requests/7/status — inspectors move their own jobs on
router.patch(
    '/:id/status',
    requireRole('inspector', 'admin', 'super_admin'),
    asyncHandler(submissionController.updateStatus),
);

// DELETE /api/inspection-requests/7 — soft delete
router.delete('/:id', requireRole('admin', 'super_admin'), asyncHandler(submissionController.remove));

export default router;
