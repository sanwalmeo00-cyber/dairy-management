/** Categories that must track expiry and leave usable stock when past date. */
export const EXPIRABLE_CATEGORIES = ['Medicine', 'Vaccines'] as const;

export type ExpirableCategory = (typeof EXPIRABLE_CATEGORIES)[number];

export type ExpiryStatus = 'Expired' | 'Expiring soon' | 'Ok';

/** Days before expiry to warn as “Expiring soon”. */
export const EXPIRING_SOON_DAYS = 30;

export function isExpirableCategory(category: string): category is ExpirableCategory {
  return (EXPIRABLE_CATEGORIES as readonly string[]).includes(category);
}

/** Calendar date at local midnight for YYYY-MM-DD or Date. */
export function toDateOnly(value: string | Date): Date {
  if (typeof value === 'string') {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isPastExpiry(expiryDate?: string | Date | null): boolean {
  if (!expiryDate) return false;
  return toDateOnly(expiryDate).getTime() < todayDateOnly().getTime();
}

export function deriveExpiryStatus(
  category: string,
  expiryDate?: string | Date | null
): ExpiryStatus | null {
  if (!isExpirableCategory(category) || !expiryDate) return null;
  const exp = toDateOnly(expiryDate);
  const today = todayDateOnly();
  if (exp.getTime() < today.getTime()) return 'Expired';
  const soon = new Date(today);
  soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS);
  if (exp.getTime() <= soon.getTime()) return 'Expiring soon';
  return 'Ok';
}
