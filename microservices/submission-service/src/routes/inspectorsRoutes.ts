import { Router } from 'express';
import * as inspectorsController from '../controllers/inspectorsController';

const router = Router();

// GET /api/inspectors
router.get('/', inspectorsController.getAll);

export default router;