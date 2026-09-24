import { Router } from 'express';
import { Role } from '@prisma/client';
import * as deletedController from '../controllers/deleted.controller';
import { authenticate, authorize, validate } from '../middleware';
import { restoreDeletedSchema } from '../validators/deleted.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', deletedController.getDeleted);
router.post('/restore', validate(restoreDeletedSchema), deletedController.restoreDeleted);

export default router;
