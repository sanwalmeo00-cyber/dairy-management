import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { salesService } from '@/server/services/sales.service';
import { createSaleSchema, type CreateSaleInput } from '@/server/validators/sales.validator';
import { resolveFinanceOwnerId } from '@/server/utils/owner';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await salesService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateSaleInput>(createSaleSchema, await readJson(request));
  const cashHandlerId = await resolveFinanceOwnerId(
    user.userId,
    body.cashHandlerId ?? body.ownerId
  );
  return jsonSuccess(
    await salesService.create(body, user.userId, cashHandlerId),
    201,
    'Sale created'
  );
});
