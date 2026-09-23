import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
