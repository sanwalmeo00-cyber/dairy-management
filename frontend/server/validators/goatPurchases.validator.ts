import { z } from 'zod';
import { MONEY_ACCOUNTS } from '@/lib/moneyAccount';

export const goatPurchaseIdParamSchema = z.object({
  id: z.string().min(1),
});

const paymentStatus = z.enum(['Paid', 'Unpaid', 'Partial']);
const moneyAccount = z.enum(MONEY_ACCOUNTS);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createGoatPurchaseSchema = z.object({
  date: dateString,
  tagNumber: z.string().min(1).max(64),
  goatId: z.string().min(1).optional().nullable(),
  /** Optional — not collected in cashbook UI */
  seller: z.string().max(200).optional().nullable(),
  purchasePrice: z.coerce.number().nonnegative(),
  paymentStatus: paymentStatus.optional().default('Paid'),
  account: moneyAccount.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateGoatPurchaseSchema = createGoatPurchaseSchema.partial();

export type CreateGoatPurchaseInput = z.infer<typeof createGoatPurchaseSchema>;
export type UpdateGoatPurchaseInput = z.infer<typeof updateGoatPurchaseSchema>;
