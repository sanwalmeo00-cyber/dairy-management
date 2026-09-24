import { z } from 'zod';

export const goatIdParamSchema = z.object({
  id: z.string().min(1),
});

const goatGender = z.enum(['Male', 'Female']);
const goatStatus = z.enum(['Active', 'Sold', 'Deceased']);
const healthStatus = z.enum(['Healthy', 'Sick', 'Under Treatment', 'Recovering']);
const vaccinationStatus = z.enum(['Up to Date', 'Due', 'Overdue', 'Not Vaccinated']);

const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createGoatSchema = z.object({
  tagNumber: z.string().min(1).max(64),
  name: z.string().max(100).optional(),
  breed: z.string().min(1).max(100),
  gender: goatGender,
  dateOfBirth: dateString,
  purchaseDate: dateString.optional().nullable(),
  purchasePrice: z.coerce.number().nonnegative().optional().nullable(),
  currentValue: z.coerce.number().nonnegative(),
  weight: z.coerce.number().positive(),
  color: z.string().min(1).max(100),
  healthStatus,
  vaccinationStatus,
  status: goatStatus.default('Active'),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  fatherId: z.string().min(1).optional().nullable(),
  motherId: z.string().min(1).optional().nullable(),
});

export const updateGoatSchema = createGoatSchema.partial();

export type CreateGoatInput = z.infer<typeof createGoatSchema>;
export type UpdateGoatInput = z.infer<typeof updateGoatSchema>;
