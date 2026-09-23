import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ordersController from '../controllers/orders.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createOrderSchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '../validators/orders.validator';

const router = Router();

router.use(authenticate);

router.get('/', ordersController.getOrders);
router.get(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  ordersController.getOrderById
);
router.post('/', validate(createOrderSchema), ordersController.createOrder);
router.patch(
  '/:id/status',
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF),
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  ordersController.updateOrderStatus
);

export default router;
