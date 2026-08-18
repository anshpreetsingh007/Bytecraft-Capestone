import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { asyncHandler, requireInternal, requireRole } from '../shared';

const router = Router();

// Stock levels and costs are commercially sensitive, so the whole service is
// staff-only. It used to be open to anyone who could reach port 3003.
const STAFF = requireRole('inspector', 'admin', 'super_admin');
const ADMIN = requireRole('admin', 'super_admin');

// Specific paths before the generic /:id path.

// POST /api/inventory/consume — estimate-service draws stock on approval
router.post('/consume', requireInternal, asyncHandler(inventoryController.consume));

// GET /api/inventory/movements — the whole ledger, newest first
router.get('/movements', STAFF, asyncHandler(inventoryController.getMovements));

// GET /api/inventory?search=shingle&lowStockOnly=true&page=1
router.get('/', STAFF, asyncHandler(inventoryController.getAllItems));

// POST /api/inventory
router.post('/', ADMIN, asyncHandler(inventoryController.createItem));

// GET /api/inventory/7
router.get('/:id', STAFF, asyncHandler(inventoryController.getItem));

// GET /api/inventory/7/movements
router.get('/:id/movements', STAFF, asyncHandler(inventoryController.getMovements));

// POST /api/inventory/7/movements — receive, return, write off
router.post('/:id/movements', ADMIN, asyncHandler(inventoryController.recordMovement));

// PUT /api/inventory/7
router.put('/:id', ADMIN, asyncHandler(inventoryController.updateItem));

// DELETE /api/inventory/7 — soft delete
router.delete('/:id', ADMIN, asyncHandler(inventoryController.deleteItem));

export default router;
