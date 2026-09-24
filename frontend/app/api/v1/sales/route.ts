import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { salesService } from '@/server/services/sales.service';
import { createSaleSchema, type CreateSaleInput } from '@/server/validators/sales.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await salesService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateSaleInput>(createSaleSchema, await readJson(request));
  return jsonSuccess(await salesService.create(body, user.userId), 201, 'Sale created');
});
