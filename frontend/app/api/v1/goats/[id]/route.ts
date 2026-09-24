import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { goatsService } from '@/server/services/goats.service';
import {
  goatIdParamSchema,
  updateGoatSchema,
  type UpdateGoatInput,
} from '@/server/validators/goats.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatIdParamSchema, await params);
  return jsonSuccess(await goatsService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatIdParamSchema, await params);
  const body = parseWithSchema<UpdateGoatInput>(updateGoatSchema, await readJson(request));
  return jsonSuccess(
    await goatsService.update(id, body, user.userId, user.role),
    200,
    'Goat updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatIdParamSchema, await params);
  return jsonSuccess(
    await goatsService.remove(id, user.userId, user.role),
    200,
    'Goat deleted'
  );
});
