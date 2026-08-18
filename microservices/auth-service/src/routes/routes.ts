import { Router } from 'express';
import * as authController from '../controllers/authController';
import { asyncHandler, requireAuth, requireRole, strictRateLimit } from '../shared';

const router = Router();

// Every route below requires a verified Firebase ID token. Before this, the
// whole service was anonymous -- including PATCH /users/role, which meant
// anyone who could reach port 3004 could make themselves an admin.

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(authController.me));

// PATCH /api/auth/me
router.patch('/me', requireAuth, strictRateLimit(), asyncHandler(authController.updateMe));

// GET /api/auth/resolve/abc123
router.get('/resolve/:firebaseUid', requireAuth, asyncHandler(authController.resolve));

// POST /api/auth/register — creates the Postgres profile after Firebase signup
router.post('/register', requireAuth, strictRateLimit(), asyncHandler(authController.register));

// GET /api/auth/inspectors — used to populate assignment dropdowns
router.get(
    '/inspectors',
    requireRole('inspector', 'admin', 'super_admin'),
    asyncHandler(authController.getInspectors),
);

// GET /api/auth/users
router.get('/users', requireRole('super_admin'), asyncHandler(authController.getAllUsers));

// PATCH /api/auth/users/role
router.patch(
    '/users/role',
    requireRole('super_admin'),
    strictRateLimit(),
    asyncHandler(authController.assignRole),
);

// PATCH /api/auth/users/status
router.patch(
    '/users/status',
    requireRole('super_admin'),
    strictRateLimit(),
    asyncHandler(authController.setUserActive),
);

// GET /api/auth/audit
router.get('/audit', requireRole('super_admin'), asyncHandler(authController.getAuditLog));

export default router;
