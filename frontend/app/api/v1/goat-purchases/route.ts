import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { goatPurchasesService } from '@/server/services/goatPurchases.service';
import {
  createGoatPurchaseSchema,
  type CreateGoatPurchaseInput,
} from '@/server/validators/goatPurchases.validator';

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
  return jsonSuccess(
    await goatPurchasesService.create(body, user.userId),
    201,
    'Goat purchase created'
  );
});
