import { Router } from 'express';
import { Role } from '@prisma/client';
import * as goatsController from '../controllers/goats.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createGoatSchema,
  goatIdParamSchema,
  updateGoatSchema,
} from '../validators/goats.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', goatsController.getGoats);
router.get('/:id', validate(goatIdParamSchema, 'params'), goatsController.getGoatById);
router.post('/', validate(createGoatSchema), goatsController.createGoat);
router.patch(
  '/:id',
  validate(goatIdParamSchema, 'params'),
  validate(updateGoatSchema),
  goatsController.updateGoat
);
router.delete('/:id', validate(goatIdParamSchema, 'params'), goatsController.deleteGoat);

export default router;
