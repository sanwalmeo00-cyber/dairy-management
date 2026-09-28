import type { PrismaClient } from '@prisma/client';
import { WALLET_ACCOUNT } from '@/lib/moneyAccount';

type Db = PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Set account via SQL so it works even if a stale Prisma client omits the field. */
export async function setRecordAccount(
  db: Db,
  table: 'Sale' | 'GoatPurchase' | 'Expense',
  id: string,
  account: string = WALLET_ACCOUNT
) {
  if (table === 'Sale') {
    await db.$executeRaw`UPDATE Sale SET account = ${account} WHERE id = ${id}`;
  } else if (table === 'GoatPurchase') {
    await db.$executeRaw`UPDATE GoatPurchase SET account = ${account} WHERE id = ${id}`;
  } else {
    await db.$executeRaw`UPDATE Expense SET account = ${account} WHERE id = ${id}`;
  }
}
