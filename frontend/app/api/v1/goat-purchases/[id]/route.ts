import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { goatPurchasesService } from '@/server/services/goatPurchases.service';
import {
  goatPurchaseIdParamSchema,
  updateGoatPurchaseSchema,
  type UpdateGoatPurchaseInput,
} from '@/server/validators/goatPurchases.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatPurchaseIdParamSchema, await params);
  return jsonSuccess(await goatPurchasesService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatPurchaseIdParamSchema, await params);
  const body = parseWithSchema<UpdateGoatPurchaseInput>(
    updateGoatPurchaseSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await goatPurchasesService.update(id, body, user.userId, user.role),
    200,
    'Goat purchase updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(goatPurchaseIdParamSchema, await params);
  return jsonSuccess(
    await goatPurchasesService.remove(id, user.userId, user.role),
    200,
    'Goat purchase deleted'
  );
});
