import { z } from 'zod';

export const workerIdParamSchema = z.object({
  id: z.string().min(1),
});

const workerStatus = z.enum(['Active', 'Inactive']);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createWorkerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(32),
  role: z.string().min(1).max(100),
  salary: z.coerce.number().nonnegative(),
  joiningDate: dateString,
  status: workerStatus.default('Active'),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateWorkerSchema = createWorkerSchema.partial();

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
