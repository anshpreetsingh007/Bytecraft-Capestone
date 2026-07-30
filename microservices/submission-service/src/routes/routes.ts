import { Router } from 'express';
import * as submissionController from '../controllers/submissionController';

const router = Router();

router.get('/inspection-requests', submissionController.getInspectionRequests);
router.get('/inspection-requests/:id', submissionController.getInspectionRequestById);
router.post('/estimates', submissionController.createEstimate);
router.get('/estimates', submissionController.getEstimates);
router.patch('/estimates/:id/approve', submissionController.approveEstimate);

export default router;
