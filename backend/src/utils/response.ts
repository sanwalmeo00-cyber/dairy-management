import { Response } from 'express';
import { ApiSuccessResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return res.status(statusCode).json(body);
}
