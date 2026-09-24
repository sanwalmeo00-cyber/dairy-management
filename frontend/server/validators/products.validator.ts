import { z } from 'zod';

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().min(1).max(64),
  price: z.coerce.number().positive(),
  unit: z.string().min(1).max(32).default('liter'),
  stock: z.coerce.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
