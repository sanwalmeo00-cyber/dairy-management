import { z } from 'zod';

export const expenseIdParamSchema = z.object({
  id: z.string().min(1),
});

const expenseCategory = z.enum([
  'Feed',
  'Medicine',
  'Veterinary',
  'Worker Salary',
  'Transport',
  'Equipment',
  'Maintenance',
  'Utilities',
  'Other',
]);
const paymentMethod = z.enum(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Other']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createExpenseSchema = z.object({
  date: dateString,
  description: z.string().min(1).max(500),
  category: expenseCategory,
  amount: z.coerce.number().nonnegative(),
  paymentMethod,
  notes: z.string().max(2000).optional().nullable(),
  /** User who provided / paid the money */
  ownerId: z.string().min(1).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
