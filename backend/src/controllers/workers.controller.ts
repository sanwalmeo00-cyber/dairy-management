import { Response } from 'express';
import { workersService } from '../services/workers.service';
import { workerPaymentsService } from '../services/workerPayments.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateWorkerInput, UpdateWorkerInput } from '../validators/workers.validator';
import { monthSummaryQuerySchema } from '../validators/workerPayments.validator';

export const getWorkers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await workersService.findAll();
  return sendSuccess(res, rows);
});

export const getWorkerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workersService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workersService.create(req.body as CreateWorkerInput, req.user!.userId);
  return sendSuccess(res, row, 201, 'Worker created');
});

export const updateWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workersService.update(
    req.params.id,
    req.body as UpdateWorkerInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Worker updated');
});

export const deleteWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workersService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, row, 200, 'Worker deleted');
});

export const getWorkerPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  await workersService.findById(req.params.id);
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  const rows = await workerPaymentsService.findAll({
    workerId: req.params.id,
    forMonth: month,
  });
  return sendSuccess(res, rows);
});

export const getWorkerMonthSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = monthSummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Query month is required (YYYY-MM)',
      errors: parsed.error.flatten(),
    });
  }
  const summary = await workersService.monthSummary(req.params.id, parsed.data.month);
  return sendSuccess(res, summary);
});
