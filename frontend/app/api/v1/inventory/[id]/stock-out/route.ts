import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { inventoryService } from '@/server/services/inventory.service';
import {
  inventoryIdParamSchema,
  stockOutSchema,
  type StockOutInput,
} from '@/server/validators/inventory.validator';

export const POST = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(inventoryIdParamSchema, await params);
  const body = parseWithSchema<StockOutInput>(stockOutSchema, await readJson(request));
  return jsonSuccess(
    await inventoryService.stockOut(id, body, user.userId, user.role),
    201,
    'Stock out recorded'
  );
});
