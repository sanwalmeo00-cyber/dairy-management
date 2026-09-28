import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

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

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy proxy so importing API routes during `next build` does not require
 * Turso env vars until a request actually uses the database.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop as string | symbol, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
