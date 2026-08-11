import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// GET /api/auth/resolve/abc123 — resolve a Firebase UID to role + DB id
router.get('/resolve/:firebaseUid', authController.resolve);

// POST /api/auth/register — create the Postgres client row after Firebase signup
router.post('/register', authController.register);

// GET /api/auth/inspectors — get all inspectors
router.get('/inspectors', authController.getInspectors);

export default router;