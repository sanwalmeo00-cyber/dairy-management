import { Response } from 'express';
import { salesService } from '../services/sales.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateSaleInput, UpdateSaleInput } from '../validators/sales.validator';

export const getSales = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await salesService.findAll();
  return sendSuccess(res, rows);
});

export const getSaleById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await salesService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await salesService.create(req.body as CreateSaleInput, req.user!.userId);
  return sendSuccess(res, row, 201, 'Sale created');
});

export const updateSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await salesService.update(
    req.params.id,
    req.body as UpdateSaleInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Sale updated');
});

export const deleteSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await salesService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, row, 200, 'Sale deleted');
});
