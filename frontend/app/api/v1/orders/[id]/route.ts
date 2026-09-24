import { apiRoute, jsonSuccess, parseWithSchema, requireAuth } from '@/server/api/http';
import { ordersService } from '@/server/services/orders.service';
import { orderIdParamSchema } from '@/server/validators/orders.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request);
  const { id } = parseWithSchema<{ id: string }>(orderIdParamSchema, await params);
  return jsonSuccess(await ordersService.findById(id));
});
