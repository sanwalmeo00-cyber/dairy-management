import jwt from 'jsonwebtoken';
import { appConfig } from '../config';
import { JwtPayload } from '../types';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, appConfig.jwt.secret) as JwtPayload;
}
