import { Router } from 'express';
import { Role } from '@prisma/client';
import * as breedingController from '../controllers/breeding.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  breedingIdParamSchema,
  createBreedingSchema,
  updateBreedingSchema,
} from '../validators/breeding.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', breedingController.getBreedings);
router.get('/:id', validate(breedingIdParamSchema, 'params'), breedingController.getBreedingById);
router.post('/', validate(createBreedingSchema), breedingController.createBreeding);
router.patch(
  '/:id',
  validate(breedingIdParamSchema, 'params'),
  validate(updateBreedingSchema),
  breedingController.updateBreeding
);
router.delete(
  '/:id',
  validate(breedingIdParamSchema, 'params'),
  breedingController.deleteBreeding
);

export default router;
