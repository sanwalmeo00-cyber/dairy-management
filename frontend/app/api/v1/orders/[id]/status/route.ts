import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { ordersService } from '@/server/services/orders.service';
import {
  orderIdParamSchema,
  updateOrderStatusSchema,
  type UpdateOrderStatusInput,
} from '@/server/validators/orders.validator';

export const PATCH = apiRoute(async (request, { params }) => {
  requireAuth(request, [Role.ADMIN, Role.MANAGER, Role.STAFF]);
  const { id } = parseWithSchema<{ id: string }>(orderIdParamSchema, await params);
  const body = parseWithSchema<UpdateOrderStatusInput>(
    updateOrderStatusSchema,
    await readJson(request)
  );
  return jsonSuccess(await ordersService.updateStatus(id, body), 200, 'Order status updated');
});
