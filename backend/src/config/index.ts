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
  s3: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
    endpoint: env.AWS_S3_ENDPOINT,
  },
};
