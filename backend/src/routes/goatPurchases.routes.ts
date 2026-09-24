import { Router } from 'express';
import { Role } from '@prisma/client';
import * as goatPurchasesController from '../controllers/goatPurchases.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createGoatPurchaseSchema,
  goatPurchaseIdParamSchema,
  updateGoatPurchaseSchema,
} from '../validators/goatPurchases.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', goatPurchasesController.getGoatPurchases);
router.get(
  '/:id',
  validate(goatPurchaseIdParamSchema, 'params'),
  goatPurchasesController.getGoatPurchaseById
);
router.post('/', validate(createGoatPurchaseSchema), goatPurchasesController.createGoatPurchase);
router.patch(
  '/:id',
  validate(goatPurchaseIdParamSchema, 'params'),
  validate(updateGoatPurchaseSchema),
  goatPurchasesController.updateGoatPurchase
);
router.delete(
  '/:id',
  validate(goatPurchaseIdParamSchema, 'params'),
  goatPurchasesController.deleteGoatPurchase
);

export default router;
