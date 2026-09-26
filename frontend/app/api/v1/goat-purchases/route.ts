import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { goatPurchasesService } from '@/server/services/goatPurchases.service';
import {
  createGoatPurchaseSchema,
  type CreateGoatPurchaseInput,
} from '@/server/validators/goatPurchases.validator';
import { resolveFinanceOwnerId } from '@/server/utils/owner';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await goatPurchasesService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateGoatPurchaseInput>(
    createGoatPurchaseSchema,
    await readJson(request)
  );
  const cashHandlerId = await resolveFinanceOwnerId(
    user.userId,
    body.cashHandlerId ?? body.ownerId
  );
  return jsonSuccess(
    await goatPurchasesService.create(body, user.userId, cashHandlerId),
    201,
    'Goat purchase created'
  );
});
