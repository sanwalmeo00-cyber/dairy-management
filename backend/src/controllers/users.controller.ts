import { Response } from 'express';
import { usersService } from '../services/users.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { UpdateUserInput } from '../validators/users.validator';

export const getUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await usersService.findAll();
  return sendSuccess(res, users);
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.findById(req.params.id);
  return sendSuccess(res, user);
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.findById(req.user!.userId);
  return sendSuccess(res, user);
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.update(req.params.id, req.body as UpdateUserInput);
  return sendSuccess(res, user, 200, 'User updated');
});
