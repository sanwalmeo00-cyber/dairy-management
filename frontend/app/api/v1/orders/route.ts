import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { ordersService } from '@/server/services/orders.service';
import {
  createOrderSchema,
  type CreateOrderInput,
} from '@/server/validators/orders.validator';

export const GET = apiRoute(async (request) => {
  const user = requireAuth(request);
  const isStaff =
    user.role === Role.ADMIN || user.role === Role.MANAGER || user.role === Role.STAFF;
  return jsonSuccess(await ordersService.findAll(isStaff ? undefined : user.userId));
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request);
  const body = parseWithSchema<CreateOrderInput>(createOrderSchema, await readJson(request));
  return jsonSuccess(await ordersService.create(user.userId, body), 201, 'Order created');
});
