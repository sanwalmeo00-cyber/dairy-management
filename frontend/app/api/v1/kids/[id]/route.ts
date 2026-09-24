import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { kidsService } from '@/server/services/kids.service';
import {
  kidIdParamSchema,
  updateKidSchema,
  type UpdateKidInput,
} from '@/server/validators/kids.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(kidIdParamSchema, await params);
  return jsonSuccess(await kidsService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(kidIdParamSchema, await params);
  const body = parseWithSchema<UpdateKidInput>(updateKidSchema, await readJson(request));
  return jsonSuccess(
    await kidsService.update(id, body, user.userId, user.role),
    200,
    'Kid updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(kidIdParamSchema, await params);
  return jsonSuccess(
    await kidsService.remove(id, user.userId, user.role),
    200,
    'Kid deleted'
  );
});
