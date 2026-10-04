export const ANIMAL_TYPES = ['Goat', 'Cow', 'Buffalo'] as const;

export type AnimalType = (typeof ANIMAL_TYPES)[number];

export const ANIMAL_TYPE_OPTIONS = ANIMAL_TYPES.map((value) => ({
  label: value === 'Buffalo' ? 'Buffalo' : value === 'Cow' ? 'Cow' : 'Goat',
  value,
}));

export function normalizeAnimalType(value?: string | null): AnimalType {
  if (value === 'Cow' || value === 'Buffalo' || value === 'Goat') return value;
  return 'Goat';
}
