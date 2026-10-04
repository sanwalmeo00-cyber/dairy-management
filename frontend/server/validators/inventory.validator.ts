import { z } from 'zod';

export const inventoryIdParamSchema = z.object({
  id: z.string().min(1),
});

const inventoryCategory = z.enum([
  'Goat Feed',
  'Medicine',
  'Vaccines',
  'Equipment',
  'Other Supplies',
]);

const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

const inventoryItemFields = z.object({
  name: z.string().min(1).max(200),
  category: inventoryCategory,
  unit: z.string().min(1).max(40),
  currentStock: z.coerce.number().nonnegative().optional().default(0),
  minimumStock: z.coerce.number().nonnegative().optional().default(0),
  cost: z.coerce.number().nonnegative().optional().default(0),
  dailyUsage: z.coerce.number().positive().optional().nullable(),
  expiryDate: dateString.optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

function requireExpiryForMedicineVaccine(
  data: { category?: string; expiryDate?: string | null },
  ctx: z.RefinementCtx
) {
  if (
    (data.category === 'Medicine' || data.category === 'Vaccines') &&
    !data.expiryDate
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expiryDate'],
      message: 'Expiration date is required for medicine and vaccines',
    });
  }
}

export const createInventoryItemSchema = inventoryItemFields.superRefine(
  requireExpiryForMedicineVaccine
);

export const updateInventoryItemSchema = inventoryItemFields
  .partial()
  .superRefine((data, ctx) => {
    // Only enforce when category is being set to medicine/vaccine on this update
    if (data.category === 'Medicine' || data.category === 'Vaccines') {
      requireExpiryForMedicineVaccine(data, ctx);
    }
  });

export const stockInSchema = z.object({
  date: dateString,
  quantity: z.coerce.number().positive(),
  /** Total purchase price for this stock-in (not unit price). */
  cost: z.coerce.number().positive(),
  /** Required when stocking medicine/vaccines — becomes the item expiry. */
  expiryDate: dateString.optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const stockOutSchema = z.object({
  date: dateString,
  quantity: z.coerce.number().positive(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
