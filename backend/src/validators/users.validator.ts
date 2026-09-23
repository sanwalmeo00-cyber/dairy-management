import { z } from 'zod';
import { Role } from '@prisma/client';

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
