import { Response } from 'express';
import { breedingService } from '../services/breeding.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateBreedingInput, UpdateBreedingInput } from '../validators/breeding.validator';

export const getBreedings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rows = await breedingService.findAll();
  return sendSuccess(res, rows);
});

export const getBreedingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await breedingService.findById(req.params.id);
  return sendSuccess(res, row);
});

export const createBreeding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await breedingService.create(req.body as CreateBreedingInput, req.user!.userId);
  return sendSuccess(res, row, 201, 'Breeding record created');
});

export const updateBreeding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await breedingService.update(
    req.params.id,
    req.body as UpdateBreedingInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, row, 200, 'Breeding record updated');
});

export const deleteBreeding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await breedingService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, row, 200, 'Breeding record deleted');
});
