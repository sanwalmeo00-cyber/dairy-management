import prisma from '../database/prisma';
import { ValidationError } from './errors';
import { cacheGet, cacheSet, cacheDel } from './cache';

const WALLET_CACHE_KEY = 'wallet:balance';
const WALLET_TTL_MS = 8_000;

/**
 * Farm wallet = all money in (partner invest + animal sales)
 *             − all money out (purchases + expenses + cash out to partners).
 */
export async function getWalletBalance(options?: { fresh?: boolean }): Promise<number> {
  if (!options?.fresh) {
    const cached = cacheGet<number>(WALLET_CACHE_KEY);
    if (cached != null) return cached;
  }

  const [sales, purchases, expenses] = await Promise.all([
    prisma.sale.aggregate({
      where: { deletedAt: null },
      _sum: { salePrice: true },
    }),
    prisma.goatPurchase.aggregate({
      where: { deletedAt: null },
      _sum: { purchasePrice: true },
    }),
    prisma.expense.aggregate({
      where: { deletedAt: null },
      _sum: { amount: true },
    }),
  ]);

  const moneyIn = Number(sales._sum.salePrice ?? 0);
  const moneyOut =
    Number(purchases._sum.purchasePrice ?? 0) + Number(expenses._sum.amount ?? 0);
  const balance = moneyIn - moneyOut;
  cacheSet(WALLET_CACHE_KEY, balance, WALLET_TTL_MS);
  return balance;
}

export function invalidateWalletCache() {
  cacheDel(WALLET_CACHE_KEY);
}

/** Block spending when wallet cannot cover the amount. */
export async function assertWalletCanSpend(amount: number, actionLabel: string) {
  if (!(amount > 0)) return;

  const balance = await getWalletBalance({ fresh: true });
  if (balance < amount) {
    const bal = balance.toLocaleString();
    const need = amount.toLocaleString();
    throw new ValidationError(
      `Not enough money in wallet for ${actionLabel}. Wallet has Rs. ${bal}, but Rs. ${need} is needed. Add Money in first.`
    );
  }
}

/**
 * When editing a cashbook amount, block changes that would make the wallet negative.
 * Current balance already includes the old amount.
 */
export async function assertWalletAllowsAmountChange(opts: {
  direction: 'in' | 'out';
  oldAmount: number;
  newAmount: number;
  actionLabel: string;
}) {
  const { direction, oldAmount, newAmount, actionLabel } = opts;
  if (!(newAmount >= 0) || Number.isNaN(newAmount)) return;

  const extraNeeded =
    direction === 'out' ? newAmount - oldAmount : oldAmount - newAmount;
  if (extraNeeded > 0) {
    await assertWalletCanSpend(extraNeeded, actionLabel);
  }
}
