import { env } from './env';

export const appConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '7d' as const,
  },
  apiPrefix: '/api/v1',
};
