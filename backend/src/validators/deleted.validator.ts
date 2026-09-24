import { z } from 'zod';

export const deletedEntitySchema = z.enum([
  'goat',
  'breeding',
  'kid',
  'goat-purchase',
  'sale',
  'expense',
  'worker',
  'inventory',
]);

export const listDeletedQuerySchema = z.object({
  entity: deletedEntitySchema.optional(),
});

export const restoreDeletedSchema = z.object({
  entity: deletedEntitySchema,
  recordId: z.string().min(1),
});

export type DeletedEntity = z.infer<typeof deletedEntitySchema>;
export type RestoreDeletedInput = z.infer<typeof restoreDeletedSchema>;
