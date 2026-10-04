import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { milkService } from '@/server/services/milk.service';
import {
  milkIdParamSchema,
  updateMilkSchema,
  type UpdateMilkInput,
} from '@/server/validators/milk.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(milkIdParamSchema, await params);
  return jsonSuccess(await milkService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(milkIdParamSchema, await params);
  const body = parseWithSchema<UpdateMilkInput>(updateMilkSchema, await readJson(request));
  return jsonSuccess(
    await milkService.update(id, body, user.userId, user.role),
    200,
    'Milk record updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(milkIdParamSchema, await params);
  return jsonSuccess(
    await milkService.remove(id, user.userId, user.role),
    200,
    'Milk record deleted'
  );
});
