import { Response } from 'express';
import { workerPaymentsService } from '../services/workerPayments.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import {
  CreateWorkerPaymentInput,
  UpdateWorkerPaymentInput,
} from '../validators/workerPayments.validator';

export const getWorkerPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workerId = typeof req.query.workerId === 'string' ? req.query.workerId : undefined;
  const forMonth = typeof req.query.month === 'string' ? req.query.month : undefined;
  const rows = await workerPaymentsService.findAll({ workerId, forMonth });
  return sendSuccess(res, rows);
});

export const getWorkerPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workerPaymentsService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createWorkerPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workerPaymentsService.create(
    req.body as CreateWorkerPaymentInput,
    req.user!.userId
  );
  return sendSuccess(res, row, 201, 'Worker payment recorded');
});

export const updateWorkerPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workerPaymentsService.update(
    req.params.id,
    req.body as UpdateWorkerPaymentInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Worker payment updated');
});

export const deleteWorkerPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await workerPaymentsService.remove(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Worker payment deleted');
});
