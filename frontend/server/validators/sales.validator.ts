import { z } from 'zod';

export const saleIdParamSchema = z.object({
  id: z.string().min(1),
});

const paymentStatus = z.enum(['Paid', 'Unpaid', 'Partial']);
const paymentMethod = z.enum(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createSaleSchema = z.object({
  date: dateString,
  tagNumber: z.string().min(1).max(64),
  buyer: z.string().min(1).max(200),
  salePrice: z.coerce.number().nonnegative(),
  paymentStatus,
  paymentMethod,
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSaleSchema = createSaleSchema.partial();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
