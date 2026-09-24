import { Router } from 'express';
import { Role } from '@prisma/client';
import * as salesController from '../controllers/sales.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createSaleSchema,
  saleIdParamSchema,
  updateSaleSchema,
} from '../validators/sales.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', salesController.getSales);
router.get('/:id', validate(saleIdParamSchema, 'params'), salesController.getSaleById);
router.post('/', validate(createSaleSchema), salesController.createSale);
router.patch(
  '/:id',
  validate(saleIdParamSchema, 'params'),
  validate(updateSaleSchema),
  salesController.updateSale
);
router.delete('/:id', validate(saleIdParamSchema, 'params'), salesController.deleteSale);

export default router;
