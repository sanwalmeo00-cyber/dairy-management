import { Router } from 'express';
import { Role } from '@prisma/client';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createInventoryItemSchema,
  inventoryIdParamSchema,
  stockInSchema,
  stockOutSchema,
  updateInventoryItemSchema,
} from '../validators/inventory.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', inventoryController.getInventoryItems);
router.post('/', validate(createInventoryItemSchema), inventoryController.createInventoryItem);

router.get(
  '/:id/transactions',
  validate(inventoryIdParamSchema, 'params'),
  inventoryController.getInventoryTransactions
);
router.post(
  '/:id/stock-in',
  validate(inventoryIdParamSchema, 'params'),
  validate(stockInSchema),
  inventoryController.stockIn
);
router.post(
  '/:id/stock-out',
  validate(inventoryIdParamSchema, 'params'),
  validate(stockOutSchema),
  inventoryController.stockOut
);

router.get(
  '/:id',
  validate(inventoryIdParamSchema, 'params'),
  inventoryController.getInventoryItemById
);
router.patch(
  '/:id',
  validate(inventoryIdParamSchema, 'params'),
  validate(updateInventoryItemSchema),
  inventoryController.updateInventoryItem
);
router.delete(
  '/:id',
  validate(inventoryIdParamSchema, 'params'),
  inventoryController.deleteInventoryItem
);

export default router;
