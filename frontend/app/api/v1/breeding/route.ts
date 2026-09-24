import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { breedingService } from '@/server/services/breeding.service';
import {
  createBreedingSchema,
  type CreateBreedingInput,
} from '@/server/validators/breeding.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await breedingService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateBreedingInput>(
    createBreedingSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await breedingService.create(body, user.userId),
    201,
    'Breeding record created'
  );
});
