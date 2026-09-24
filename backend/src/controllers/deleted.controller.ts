import { Response } from 'express';
import { deletedService } from '../services/deleted.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import {
  listDeletedQuerySchema,
  RestoreDeletedInput,
} from '../validators/deleted.validator';

export const getDeleted = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listDeletedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query',
      errors: parsed.error.flatten(),
    });
  }
  const rows = await deletedService.findAll(
    req.user!.userId,
    req.user!.role,
    parsed.data.entity
  );
  return sendSuccess(res, rows);
});

export const restoreDeleted = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await deletedService.restore(
    req.body as RestoreDeletedInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, result, 200, 'Record restored');
});
