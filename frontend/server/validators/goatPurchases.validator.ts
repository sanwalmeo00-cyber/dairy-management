import { z } from 'zod';

export const goatPurchaseIdParamSchema = z.object({
  id: z.string().min(1),
});

const paymentStatus = z.enum(['Paid', 'Unpaid', 'Partial']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createGoatPurchaseSchema = z.object({
  date: dateString,
  tagNumber: z.string().min(1).max(64),
  goatId: z.string().min(1).optional().nullable(),
  seller: z.string().min(1).max(200),
  purchasePrice: z.coerce.number().nonnegative(),
  paymentStatus,
  notes: z.string().max(2000).optional().nullable(),
  /** User who provided / paid the money */
  ownerId: z.string().min(1).optional().nullable(),
});

export const updateGoatPurchaseSchema = createGoatPurchaseSchema.partial();

export type CreateGoatPurchaseInput = z.infer<typeof createGoatPurchaseSchema>;
export type UpdateGoatPurchaseInput = z.infer<typeof updateGoatPurchaseSchema>;
