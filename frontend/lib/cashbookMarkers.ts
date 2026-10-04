/** Tag stored on Sale rows that are milk revenue (not animal / partner investment). */
export const MILK_SALE_TAG = 'MILK';

/** Notes prefix for milk sale cashbook rows. */
export const MILK_SALE_NOTE_PREFIX = 'Milk sale';

export function isMilkSale(r: { tagNumber?: string | null; notes?: string | null }) {
  return (
    r.tagNumber === MILK_SALE_TAG ||
    Boolean(r.notes?.startsWith(MILK_SALE_NOTE_PREFIX))
  );
}

/** Animal sold from the herd — not partner investment and not milk sale. */
export function isAnimalSale(r: {
  goatId?: string | null;
  tagNumber?: string | null;
  notes?: string | null;
}) {
  if (isMilkSale(r)) return false;
  return Boolean(r.goatId) || Boolean(r.tagNumber && r.tagNumber !== '—');
}

export function milkSaleNotes(quantityKg?: number | null, userNotes?: string | null) {
  const kg =
    quantityKg != null && quantityKg > 0
      ? `${MILK_SALE_NOTE_PREFIX} · ${quantityKg} kg`
      : MILK_SALE_NOTE_PREFIX;
  const extra = userNotes?.trim();
  return extra ? `${kg}\n${extra}` : kg;
}
