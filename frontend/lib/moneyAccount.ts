/**
 * Farm cash sits in a single Wallet.
 * Money in adds to it; money out is taken from it.
 * (DB column `account` kept for compatibility — always stores "Wallet".)
 */
export const WALLET_ACCOUNT = 'Wallet' as const;

export type MoneyAccount = typeof WALLET_ACCOUNT;

export const DEFAULT_MONEY_ACCOUNT: MoneyAccount = WALLET_ACCOUNT;

/** @deprecated multi-wallet options removed — farm uses one Wallet */
export const MONEY_ACCOUNTS = [WALLET_ACCOUNT] as const;

export const MONEY_ACCOUNT_OPTIONS = [{ label: 'Wallet', value: WALLET_ACCOUNT }];

export function isMoneyAccount(value: string): value is MoneyAccount {
  return value === WALLET_ACCOUNT || value === 'Cash in Hand';
}

export function normalizeMoneyAccount(_value?: string | null): MoneyAccount {
  return WALLET_ACCOUNT;
}

/** Legacy paymentMethod for Sale/Expense rows. */
export function paymentMethodFromAccount(_account?: MoneyAccount): string {
  return 'Cash';
}
