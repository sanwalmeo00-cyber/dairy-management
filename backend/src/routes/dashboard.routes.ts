import { Router } from 'express';
import { Role } from '@prisma/client';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', dashboardController.getDashboard);

export default router;
