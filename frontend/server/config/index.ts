import { env } from './env';

export const appConfig = {
  get env() {
    return env.NODE_ENV;
  },
  jwt: {
    get secret() {
      return env.JWT_SECRET;
    },
    expiresIn: '7d' as const,
  },
  apiPrefix: '/api/v1',
  s3: {
    get accessKeyId() {
      return env.AWS_ACCESS_KEY_ID;
    },
    get secretAccessKey() {
      return env.AWS_SECRET_ACCESS_KEY;
    },
    get region() {
      return env.AWS_REGION;
    },
    get bucket() {
      return env.AWS_S3_BUCKET;
    },
    get endpoint() {
      return env.AWS_S3_ENDPOINT;
    },
    get publicBaseUrl() {
      return env.AWS_S3_PUBLIC_BASE_URL;
    },
  },
};
