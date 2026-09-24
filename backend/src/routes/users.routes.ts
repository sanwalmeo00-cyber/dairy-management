import { Router } from 'express';
import { Role } from '@prisma/client';
import * as usersController from '../controllers/users.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  changePasswordSchema,
  createUserSchema,
  setUserStatusSchema,
  updateMeSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validators/users.validator';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.patch('/me', validate(updateMeSchema), usersController.updateMe);
router.post(
  '/me/change-password',
  validate(changePasswordSchema),
  usersController.changePassword
);
router.get('/', authorize(Role.SUPER_ADMIN), usersController.getUsers);
router.post(
  '/',
  authorize(Role.SUPER_ADMIN),
  validate(createUserSchema),
  usersController.createUser
);
router.get(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  validate(userIdParamSchema, 'params'),
  usersController.getUserById
);
router.patch(
  '/:id',
  authorize(Role.SUPER_ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  usersController.updateUser
);
router.patch(
  '/:id/status',
  authorize(Role.SUPER_ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(setUserStatusSchema),
  usersController.setUserStatus
);

export default router;
