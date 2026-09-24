import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(32).optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(32).optional().nullable(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(32).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const setUserStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;
