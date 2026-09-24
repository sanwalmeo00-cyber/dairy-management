import { Router } from 'express';
import { Role } from '@prisma/client';
import * as kidsController from '../controllers/kids.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createKidSchema,
  kidIdParamSchema,
  updateKidSchema,
} from '../validators/kids.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', kidsController.getKids);
router.get('/:id', validate(kidIdParamSchema, 'params'), kidsController.getKidById);
router.post('/', validate(createKidSchema), kidsController.createKid);
router.patch(
  '/:id',
  validate(kidIdParamSchema, 'params'),
  validate(updateKidSchema),
  kidsController.updateKid
);
router.delete('/:id', validate(kidIdParamSchema, 'params'), kidsController.deleteKid);

export default router;
