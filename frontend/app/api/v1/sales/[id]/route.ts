import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { salesService } from '@/server/services/sales.service';
import {
  saleIdParamSchema,
  updateSaleSchema,
  type UpdateSaleInput,
} from '@/server/validators/sales.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(saleIdParamSchema, await params);
  return jsonSuccess(await salesService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(saleIdParamSchema, await params);
  const body = parseWithSchema<UpdateSaleInput>(updateSaleSchema, await readJson(request));
  return jsonSuccess(
    await salesService.update(id, body, user.userId, user.role),
    200,
    'Sale updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(saleIdParamSchema, await params);
  return jsonSuccess(
    await salesService.remove(id, user.userId, user.role),
    200,
    'Sale deleted'
  );
});
