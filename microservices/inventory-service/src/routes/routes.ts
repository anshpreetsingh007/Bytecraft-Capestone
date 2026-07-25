import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.get('/', inventoryController.getAllItems);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

export default router;
