import { Router } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import * as uploadsController from '../controllers/uploads.controller';
import { authenticate, authorize } from '../middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.post('/image', upload.single('file'), uploadsController.uploadAnimalImage);

export default router;
