const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

/** Age in months (1 decimal) from date of birth. */
export function ageMonthsFromDob(dateOfBirth: string | Date, asOf: Date = new Date()): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return 0;
  const months = (asOf.getTime() - dob.getTime()) / MS_PER_MONTH;
  return Math.max(0, Math.round(months * 10) / 10);
}

/** Approximate date of birth from age in months (supports decimals, e.g. 3.5). */
export function dobFromAgeMonths(ageMonths: number, asOf: Date = new Date()): string {
  const ms = Math.max(0, ageMonths) * MS_PER_MONTH;
  return new Date(asOf.getTime() - ms).toISOString().slice(0, 10);
}

/** Display age as months, e.g. "12.5 mo". */
export function formatAgeMonths(dateOfBirth: string | Date, asOf: Date = new Date()): string {
  const months = ageMonthsFromDob(dateOfBirth, asOf);
  if (months === 0) return '0 mo';
  const label = Number.isInteger(months) ? String(months) : months.toFixed(1);
  return `${label} mo`;
}

/** @deprecated prefer formatAgeMonths — kept for older call sites */
export function formatAge(dateOfBirth: string | Date, asOf: Date = new Date()): string {
  return formatAgeMonths(dateOfBirth, asOf);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
