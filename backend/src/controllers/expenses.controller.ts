import { Response } from 'express';
import { expensesService } from '../services/expenses.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateExpenseInput, UpdateExpenseInput } from '../validators/expenses.validator';

export const getExpenses = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await expensesService.findAll();
  return sendSuccess(res, rows);
});

export const getExpenseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await expensesService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await expensesService.create(req.body as CreateExpenseInput, req.user!.userId);
  return sendSuccess(res, row, 201, 'Expense created');
});

export const updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await expensesService.update(
    req.params.id,
    req.body as UpdateExpenseInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Expense updated');
});

export const deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await expensesService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, row, 200, 'Expense deleted');
});
