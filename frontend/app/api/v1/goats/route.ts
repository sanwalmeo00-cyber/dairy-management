import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { goatsService } from '@/server/services/goats.service';
import {
  createGoatSchema,
  type CreateGoatInput,
} from '@/server/validators/goats.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await goatsService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateGoatInput>(createGoatSchema, await readJson(request));
  return jsonSuccess(await goatsService.create(body, user.userId), 201, 'Goat created');
});
