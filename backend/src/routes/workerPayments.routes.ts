import { Router } from 'express';
import { Role } from '@prisma/client';
import * as workerPaymentsController from '../controllers/workerPayments.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createWorkerPaymentSchema,
  updateWorkerPaymentSchema,
  workerPaymentIdParamSchema,
} from '../validators/workerPayments.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', workerPaymentsController.getWorkerPayments);
router.get(
  '/:id',
  validate(workerPaymentIdParamSchema, 'params'),
  workerPaymentsController.getWorkerPaymentById
);
router.post(
  '/',
  validate(createWorkerPaymentSchema),
  workerPaymentsController.createWorkerPayment
);
router.patch(
  '/:id',
  validate(workerPaymentIdParamSchema, 'params'),
  validate(updateWorkerPaymentSchema),
  workerPaymentsController.updateWorkerPayment
);
router.delete(
  '/:id',
  validate(workerPaymentIdParamSchema, 'params'),
  workerPaymentsController.deleteWorkerPayment
);

export default router;
