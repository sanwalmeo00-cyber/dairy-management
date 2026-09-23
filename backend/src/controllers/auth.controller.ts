import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  return sendSuccess(res, result, 201, 'Registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  return sendSuccess(res, result, 200, 'Logged in successfully');
});
