/** Lifecycle / condition statuses for animals (goats & kids). */
export const GOAT_STATUSES = [
  'Healthy',
  'Ill',
  'Under Treatment',
  'Recovering',
  'Pregnant',
  'Sold',
  'Deceased',
] as const;

export type GoatStatusValue = (typeof GOAT_STATUSES)[number];

/** Legacy value still present in older records. */
const LEGACY_ACTIVE = 'Active';

export function normalizeGoatStatus(status: string): GoatStatusValue | string {
  if (status === LEGACY_ACTIVE) return 'Healthy';
  return status;
}

export function isOnFarmStatus(status: string): boolean {
  const s = normalizeGoatStatus(status);
  return s !== 'Sold' && s !== 'Deceased';
}

/** Map animal status → healthStatus column (kept for vaccines / older UI). */
export function healthFromGoatStatus(
  status: string,
  previousHealth?: string | null
): string {
  const s = normalizeGoatStatus(status);
  switch (s) {
    case 'Healthy':
      return 'Healthy';
    case 'Ill':
      return 'Sick';
    case 'Under Treatment':
      return 'Under Treatment';
    case 'Recovering':
      return 'Recovering';
    case 'Pregnant':
      return previousHealth && previousHealth !== 'Sick' ? previousHealth : 'Healthy';
    default:
      return previousHealth || 'Healthy';
  }
}

export const GOAT_STATUS_OPTIONS = GOAT_STATUSES.map((value) => ({
  label: value,
  value,
}));
