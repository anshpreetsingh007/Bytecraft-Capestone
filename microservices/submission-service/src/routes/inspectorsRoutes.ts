import { Router } from 'express';
import * as inspectorsController from '../controllers/inspectorsController';
import { asyncHandler, requireRole } from '../shared';

const router = Router();

const STAFF = requireRole('inspector', 'admin', 'super_admin');
const ADMIN = requireRole('admin', 'super_admin');

// GET /api/inspectors
router.get('/', STAFF, asyncHandler(inspectorsController.getAll));

// GET /api/inspectors/3/availability
router.get('/:id/availability', STAFF, asyncHandler(inspectorsController.getAvailability));

// PUT /api/inspectors/3/availability
router.put('/:id/availability', ADMIN, asyncHandler(inspectorsController.replaceAvailability));

// GET /api/inspectors/3/schedule?from=...&to=...
router.get('/:id/schedule', STAFF, asyncHandler(inspectorsController.getSchedule));

// POST /api/inspectors/3/schedule/check — dry run for the booking form
router.post('/:id/schedule/check', ADMIN, asyncHandler(inspectorsController.checkAvailability));

export default router;
