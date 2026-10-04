import { z } from 'zod';

export const milkIdParamSchema = z.object({
  id: z.string().min(1),
});

const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

const milkSession = z.enum(['Morning', 'Evening', 'Combined']);

export const createMilkSchema = z.object({
  date: dateString,
  quantityKg: z.coerce.number().positive('Enter milk quantity in kg'),
  session: milkSession.default('Morning'),
  goatId: z.string().min(1).optional().nullable(),
  tagNumber: z.string().max(64).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateMilkSchema = createMilkSchema.partial();

export type CreateMilkInput = z.infer<typeof createMilkSchema>;
export type UpdateMilkInput = z.infer<typeof updateMilkSchema>;
