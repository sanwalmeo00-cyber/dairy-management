import { z } from 'zod';

export const breedingIdParamSchema = z.object({
  id: z.string().min(1),
});

const breedingStatus = z.enum(['Planned', 'Completed', 'Pregnant', 'Failed']);

const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const createBreedingSchema = z.object({
  femaleGoatId: z.string().min(1),
  maleGoatId: z.string().min(1).optional().nullable(),
  breedingDate: dateString,
  expectedDueDate: dateString,
  actualBirthDate: dateString.optional().nullable(),
  status: breedingStatus.default('Planned'),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateBreedingSchema = createBreedingSchema.partial();

export type CreateBreedingInput = z.infer<typeof createBreedingSchema>;
export type UpdateBreedingInput = z.infer<typeof updateBreedingSchema>;
