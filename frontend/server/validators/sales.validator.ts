import { z } from 'zod';
import { MONEY_ACCOUNTS } from '@/lib/moneyAccount';

export const saleIdParamSchema = z.object({
  id: z.string().min(1),
});

const paymentStatus = z.enum(['Paid', 'Unpaid', 'Partial']);
const moneyAccount = z.enum(MONEY_ACCOUNTS);
const paymentMethod = z.enum(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createSaleSchema = z.object({
  date: dateString,
  /** Optional — animal sales set this; cashbook money-in leaves it blank */
  tagNumber: z.string().max(64).optional().nullable(),
  /** Who the money came from (partner / person) */
  buyer: z.string().min(1).max(200),
  salePrice: z.coerce.number().nonnegative(),
  paymentStatus,
  /** Preferred: which business wallet received money */
  account: moneyAccount.optional(),
  /** Legacy — derived from account when omitted */
  paymentMethod: paymentMethod.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
