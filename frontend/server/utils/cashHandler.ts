import type { PrismaClient } from '@prisma/client';

type Db = PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Set cashHandlerId via SQL so it works even if a stale Prisma client omits the field. */
export async function setCashHandlerId(
  db: Db,
  table: 'Sale' | 'GoatPurchase' | 'Expense',
  id: string,
  cashHandlerId: string
) {
  if (table === 'Sale') {
    await db.$executeRaw`UPDATE Sale SET cashHandlerId = ${cashHandlerId} WHERE id = ${id}`;
  } else if (table === 'GoatPurchase') {
    await db.$executeRaw`UPDATE GoatPurchase SET cashHandlerId = ${cashHandlerId} WHERE id = ${id}`;
  } else {
    await db.$executeRaw`UPDATE Expense SET cashHandlerId = ${cashHandlerId} WHERE id = ${id}`;
  }
}
