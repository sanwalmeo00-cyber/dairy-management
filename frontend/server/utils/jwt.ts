import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { appConfig } from '../config';
import { JwtPayload } from '../types';

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: appConfig.jwt.expiresIn };
  return jwt.sign(payload, appConfig.jwt.secret as Secret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, appConfig.jwt.secret as Secret) as JwtPayload;
}
