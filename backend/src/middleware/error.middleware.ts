import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ApiErrorResponse } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      message: err.message,
      ...(err.errors !== undefined ? { errors: err.errors } : {}),
    };
    return res.status(err.statusCode).json(body);
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const body: ApiErrorResponse = {
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  };

  return res.status(500).json(body);
}
