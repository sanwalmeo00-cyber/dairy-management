import { Response } from 'express';
import { goatsService } from '../services/goats.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateGoatInput, UpdateGoatInput } from '../validators/goats.validator';

export const getGoats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const goats = await goatsService.findAll();
  return sendSuccess(res, goats);
});

export const getGoatById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goat = await goatsService.findById(req.params.id);
  return sendSuccess(res, goat);
});

export const createGoat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goat = await goatsService.create(req.body as CreateGoatInput, req.user!.userId);
  return sendSuccess(res, goat, 201, 'Goat created');
});

export const updateGoat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goat = await goatsService.update(
    req.params.id,
    req.body as UpdateGoatInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, goat, 200, 'Goat updated');
});

export const deleteGoat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goat = await goatsService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, goat, 200, 'Goat deleted');
});
