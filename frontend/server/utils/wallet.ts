import prisma from '../database/prisma';
import { ValidationError } from './errors';

/**
 * Farm wallet = all money in (partner invest + animal sales)
 *             − all money out (purchases + expenses + cash out to partners).
 */
export async function getWalletBalance(): Promise<number> {
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
  return moneyIn - moneyOut;
}

/** Block spending when wallet cannot cover the amount. */
export async function assertWalletCanSpend(amount: number, actionLabel: string) {
  if (!(amount > 0)) return;

  const balance = await getWalletBalance();
  if (balance < amount) {
    const bal = balance.toLocaleString();
    const need = amount.toLocaleString();
    throw new ValidationError(
      `Not enough money in wallet for ${actionLabel}. Wallet has Rs. ${bal}, but Rs. ${need} is needed. Add Money in first.`
    );
  }
}
