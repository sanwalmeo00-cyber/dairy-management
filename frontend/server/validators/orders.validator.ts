import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
