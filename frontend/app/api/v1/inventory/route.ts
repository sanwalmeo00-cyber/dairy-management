import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { inventoryService } from '@/server/services/inventory.service';
import {
  createInventoryItemSchema,
  type CreateInventoryItemInput,
} from '@/server/validators/inventory.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await inventoryService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateInventoryItemInput>(
    createInventoryItemSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await inventoryService.create(body, user.userId),
    201,
    'Inventory item created'
  );
});
