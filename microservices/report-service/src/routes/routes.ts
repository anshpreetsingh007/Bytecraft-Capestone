import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router = Router();

router.get('/overview', reportController.getOverview);
router.get('/financial', reportController.getFinancialReport);
router.get('/inspectors', reportController.getInspectorReport);
router.get('/estimates', reportController.getEstimateReport);
router.get('/invoices', reportController.getInvoiceReport);

export default router;