import { Router } from 'express';
import { Role } from '@prisma/client';
import * as workersController from '../controllers/workers.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createWorkerSchema,
  updateWorkerSchema,
  workerIdParamSchema,
} from '../validators/workers.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', workersController.getWorkers);
router.post('/', validate(createWorkerSchema), workersController.createWorker);
router.get(
  '/:id/payments',
  validate(workerIdParamSchema, 'params'),
  workersController.getWorkerPayments
);
router.get(
  '/:id/month-summary',
  validate(workerIdParamSchema, 'params'),
  workersController.getWorkerMonthSummary
);
router.get('/:id', validate(workerIdParamSchema, 'params'), workersController.getWorkerById);
router.patch(
  '/:id',
  validate(workerIdParamSchema, 'params'),
  validate(updateWorkerSchema),
  workersController.updateWorker
);
router.delete('/:id', validate(workerIdParamSchema, 'params'), workersController.deleteWorker);

export default router;
