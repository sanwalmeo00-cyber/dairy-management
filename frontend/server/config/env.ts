import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Local sqlite file for Prisma CLI only (migrate/generate). Runtime uses Turso. */
  DATABASE_URL: z.string().optional(),
  TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
  TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
    );
  }
  cached = parsed.data;
  return cached;
}

/** Lazy proxy so importing modules does not crash at build time. */
export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof ServerEnv];
  },
});
