import { Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import {
  CreateInventoryItemInput,
  StockInInput,
  StockOutInput,
  UpdateInventoryItemInput,
} from '../validators/inventory.validator';

export const getInventoryItems = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await inventoryService.findAll();
  return sendSuccess(res, rows);
});

export const getInventoryItemById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await inventoryService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await inventoryService.create(req.body as CreateInventoryItemInput, req.user!.userId);
  return sendSuccess(res, row, 201, 'Inventory item created');
});

export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await inventoryService.update(
    req.params.id,
    req.body as UpdateInventoryItemInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Inventory item updated');
});

export const deleteInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await inventoryService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, row, 200, 'Inventory item deleted');
});

export const stockIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await inventoryService.stockIn(
    req.params.id,
    req.body as StockInInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, result, 201, 'Stock in recorded');
});

export const stockOut = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await inventoryService.stockOut(
    req.params.id,
    req.body as StockOutInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, result, 201, 'Stock out recorded');
});

export const getInventoryTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rows = await inventoryService.findTransactions(req.params.id);
  return sendSuccess(res, rows);
});
