import { Response } from 'express';
import { usersService } from '../services/users.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import {
  ChangePasswordInput,
  CreateUserInput,
  SetUserStatusInput,
  UpdateMeInput,
  UpdateUserInput,
} from '../validators/users.validator';

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

export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.updateMe(req.user!.userId, req.body as UpdateMeInput);
  return sendSuccess(res, user, 200, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await usersService.changePassword(
    req.user!.userId,
    req.body as ChangePasswordInput
  );
  return sendSuccess(res, result, 200, 'Password updated');
});

export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.createBySuperAdmin(
    req.body as CreateUserInput,
    req.user!.userId
  );
  return sendSuccess(res, user, 201, 'User created');
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.update(req.params.id, req.body as UpdateUserInput);
  return sendSuccess(res, user, 200, 'User updated');
});

export const setUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.setStatus(
    req.params.id,
    req.body as SetUserStatusInput,
    req.user!.userId
  );
  return sendSuccess(res, user, 200, `User marked ${user.status}`);
});
