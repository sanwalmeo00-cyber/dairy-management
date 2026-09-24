import { Response } from 'express';
import { goatPurchasesService } from '../services/goatPurchases.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import {
  CreateGoatPurchaseInput,
  UpdateGoatPurchaseInput,
} from '../validators/goatPurchases.validator';

export const getGoatPurchases = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await goatPurchasesService.findAll();
  return sendSuccess(res, rows);
});

export const getGoatPurchaseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await goatPurchasesService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createGoatPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await goatPurchasesService.create(
    req.body as CreateGoatPurchaseInput,
    req.user!.userId
  );
  return sendSuccess(res, row, 201, 'Goat purchase created');
});

export const updateGoatPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await goatPurchasesService.update(
    req.params.id,
    req.body as UpdateGoatPurchaseInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Goat purchase updated');
});

export const deleteGoatPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await goatPurchasesService.remove(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Goat purchase deleted');
});
