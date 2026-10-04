import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

/** Bump when Prisma models change so hot-reload drops a stale client. */
const PRISMA_CLIENT_REV = 6;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: number;
};

function tursoHttpUrl(raw: string): string {
  // Prisma/libSQL HTTP adapter is more reliable with https:// than libsql://
  return raw.replace(/^libsql:\/\//i, 'https://');
}

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is required. Set it in .env.local (local) or Vercel Environment Variables (Production).'
    );
  }
  if (!authToken) {
    throw new Error(
      'TURSO_AUTH_TOKEN is required. Set it in .env.local (local) or Vercel Environment Variables (Production).'
    );
  }

  const adapter = new PrismaLibSql({
    url: tursoHttpUrl(url),
    authToken,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function clientHasMilk(client: PrismaClient) {
  return Boolean((client as unknown as { milkRecord?: unknown }).milkRecord);
}

function getPrisma(): PrismaClient {
  const stale =
    !globalForPrisma.prisma ||
    globalForPrisma.prismaRev !== PRISMA_CLIENT_REV ||
    !clientHasMilk(globalForPrisma.prisma);

  if (stale) {
    const prev = globalForPrisma.prisma;
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
    void prev?.$disconnect().catch(() => undefined);
  }

  return globalForPrisma.prisma!;
}

/**
 * Lazy proxy so importing API routes during `next build` does not require
 * Turso env vars until a request actually uses the database.
 * Use the real client as getter receiver so Prisma model delegates resolve.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});

export default prisma;
