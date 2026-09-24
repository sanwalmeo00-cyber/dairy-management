import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { inventoryService } from '@/server/services/inventory.service';
import {
  inventoryIdParamSchema,
  updateInventoryItemSchema,
  type UpdateInventoryItemInput,
} from '@/server/validators/inventory.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(inventoryIdParamSchema, await params);
  return jsonSuccess(await inventoryService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(inventoryIdParamSchema, await params);
  const body = parseWithSchema<UpdateInventoryItemInput>(
    updateInventoryItemSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await inventoryService.update(id, body, user.userId, user.role),
    200,
    'Inventory item updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(inventoryIdParamSchema, await params);
  return jsonSuccess(
    await inventoryService.remove(id, user.userId, user.role),
    200,
    'Inventory item deleted'
  );
});
