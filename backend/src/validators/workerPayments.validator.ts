import { z } from 'zod';

export const workerPaymentIdParamSchema = z.object({
  id: z.string().min(1),
});

const paymentType = z.enum(['Salary', 'Advance', 'Bonus', 'Other']);
const paymentMethod = z.enum(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });
const monthString = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'forMonth must be YYYY-MM');

export const createWorkerPaymentSchema = z.object({
  workerId: z.string().min(1),
  date: dateString,
  forMonth: monthString,
  type: paymentType,
  amount: z.coerce.number().positive(),
  paymentMethod,
  notes: z.string().max(2000).optional().nullable(),
});

export const updateWorkerPaymentSchema = createWorkerPaymentSchema.partial();

export const monthSummaryQuerySchema = z.object({
  month: monthString,
});

export type CreateWorkerPaymentInput = z.infer<typeof createWorkerPaymentSchema>;
export type UpdateWorkerPaymentInput = z.infer<typeof updateWorkerPaymentSchema>;
