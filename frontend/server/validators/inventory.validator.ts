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

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: inventoryCategory,
  unit: z.string().min(1).max(40),
  currentStock: z.coerce.number().nonnegative().default(0),
  minimumStock: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative(),
  dailyUsage: z.coerce.number().positive().optional().nullable(),
  expiryDate: dateString.optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const stockInSchema = z.object({
  date: dateString,
  quantity: z.coerce.number().positive(),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const stockOutSchema = z.object({
  date: dateString,
  quantity: z.coerce.number().positive(),
  reason: z.string().min(1).max(200),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
