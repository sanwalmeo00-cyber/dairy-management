import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }

  const token = header.slice(7);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
