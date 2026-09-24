import { z } from 'zod';

export const kidIdParamSchema = z.object({
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

export const createKidSchema = z.object({
  tagNumber: z.string().min(1).max(64),
  name: z.string().max(100).optional(),
  gender: goatGender,
  dateOfBirth: dateString,
  motherId: z.string().min(1),
  fatherId: z.string().min(1).optional().nullable(),
  weight: z.coerce.number().positive(),
  healthStatus,
  vaccinationStatus,
  status: goatStatus.default('Active'),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  breedingId: z.string().min(1).optional().nullable(),
});

export const updateKidSchema = createKidSchema.partial();

export type CreateKidInput = z.infer<typeof createKidSchema>;
export type UpdateKidInput = z.infer<typeof updateKidSchema>;
