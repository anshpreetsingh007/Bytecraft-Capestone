import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { asyncHandler, requireRole } from '../shared';

const router = Router();

// Business-wide financials. Admin and above only -- this used to be open to
// anyone who could reach port 3006.
const ADMIN = requireRole('admin', 'super_admin');

router.get('/overview', ADMIN, asyncHandler(reportController.getOverview));
router.get('/financial', ADMIN, asyncHandler(reportController.getFinancialReport));
router.get('/inspectors', ADMIN, asyncHandler(reportController.getInspectorReport));
router.get('/estimates', ADMIN, asyncHandler(reportController.getEstimateReport));

// Replaces /invoices: the pipeline of priced, accepted and finished work.
router.get('/jobs', ADMIN, asyncHandler(reportController.getJobsReport));

export default router;
