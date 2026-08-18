import { Router } from 'express';
import * as jobReportController from '../controllers/jobReportController';
import { asyncHandler, requireRole } from '../shared';

const router = Router();

const STAFF = requireRole('inspector', 'admin', 'super_admin');
const ADMIN = requireRole('admin', 'super_admin');

// GET /api/job-reports?status=submitted&page=1
router.get('/', STAFF, asyncHandler(jobReportController.getAll));

// GET /api/job-reports/7
router.get('/:id', STAFF, asyncHandler(jobReportController.getById));

// POST /api/job-reports — an inspector closing a job out
router.post('/', STAFF, asyncHandler(jobReportController.create));

// PUT /api/job-reports/7
router.put('/:id', STAFF, asyncHandler(jobReportController.update));

// PATCH /api/job-reports/7/review — admin sign-off
router.patch('/:id/review', ADMIN, asyncHandler(jobReportController.review));

// DELETE /api/job-reports/7 — soft delete
router.delete('/:id', ADMIN, asyncHandler(jobReportController.remove));

export default router;
