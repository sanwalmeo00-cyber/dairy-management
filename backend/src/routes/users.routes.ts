import { Router } from 'express';
import { Role } from '@prisma/client';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize, validate } from '../middleware';
import { updateUserSchema, userIdParamSchema } from '../validators/users.validator';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.get('/', authorize(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER), usersController.getUsers);
router.get(
  '/:id',
  authorize(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER),
  validate(userIdParamSchema, 'params'),
  usersController.getUserById
);
router.patch(
  '/:id',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  usersController.updateUser
);

export default router;
