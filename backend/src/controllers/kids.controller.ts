import { Response } from 'express';
import { kidsService } from '../services/kids.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateKidInput, UpdateKidInput } from '../validators/kids.validator';

export const getKids = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const kids = await kidsService.findAll();
  return sendSuccess(res, kids);
});

export const getKidById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const kid = await kidsService.findById(req.params.id);
  return sendSuccess(res, kid);
});

export const createKid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const kid = await kidsService.create(req.body as CreateKidInput, req.user!.userId);
  return sendSuccess(res, kid, 201, 'Kid created');
});

export const updateKid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const kid = await kidsService.update(
    req.params.id,
    req.body as UpdateKidInput,
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, kid, 200, 'Kid updated');
});

export const deleteKid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const kid = await kidsService.remove(req.params.id, req.user!.userId, req.user!.role);
  return sendSuccess(res, kid, 200, 'Kid deleted');
});
