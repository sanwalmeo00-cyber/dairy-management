import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError, ForbiddenError, UnauthorizedError, ValidationError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import type { ApiErrorResponse, ApiSuccessResponse, JwtPayload } from '../types';

export function jsonSuccess<T>(data: T, status = 200, message?: string) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return NextResponse.json(body, { status });
}

export function jsonError(message: string, status = 500, errors?: unknown) {
  const body: ApiErrorResponse = {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return jsonError(err.message, err.statusCode, err.errors);
  }
  if (err instanceof ZodError) {
    return jsonError('Validation failed', 400, err.flatten());
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error('Unhandled API error', {
    message,
    stack: err instanceof Error && env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  return jsonError(
    env.NODE_ENV === 'production' ? 'Internal server error' : message,
    500
  );
}

export function parseWithSchema<T>(schema: ZodTypeAny, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error.flatten());
    }
    throw error;
  }
}

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
}

export function getQuery(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const out: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function requireAuth(request: Request, roles: Role[] = []): JwtPayload {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  let user: JwtPayload;
  try {
    user = verifyToken(header.slice(7));
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  return user;
}

export function apiRoute(
  handler: (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      return await handler(request, context);
    } catch (err) {
      return handleApiError(err);
    }
  };
}
