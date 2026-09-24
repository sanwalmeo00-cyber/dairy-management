import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { breedingService } from '@/server/services/breeding.service';
import {
  breedingIdParamSchema,
  updateBreedingSchema,
  type UpdateBreedingInput,
} from '@/server/validators/breeding.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(breedingIdParamSchema, await params);
  return jsonSuccess(await breedingService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(breedingIdParamSchema, await params);
  const body = parseWithSchema<UpdateBreedingInput>(
    updateBreedingSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await breedingService.update(id, body, user.userId, user.role),
    200,
    'Breeding record updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(breedingIdParamSchema, await params);
  return jsonSuccess(
    await breedingService.remove(id, user.userId, user.role),
    200,
    'Breeding record deleted'
  );
});
