import { apiRoute, jsonSuccess, parseWithSchema, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { inventoryService } from '@/server/services/inventory.service';
import { inventoryIdParamSchema } from '@/server/validators/inventory.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(inventoryIdParamSchema, await params);
  return jsonSuccess(await inventoryService.findTransactions(id));
});
