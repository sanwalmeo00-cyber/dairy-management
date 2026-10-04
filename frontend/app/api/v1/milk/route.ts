import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { milkService } from '@/server/services/milk.service';
import {
  createMilkSchema,
  type CreateMilkInput,
} from '@/server/validators/milk.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await milkService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateMilkInput>(createMilkSchema, await readJson(request));
  return jsonSuccess(await milkService.create(body, user.userId), 201, 'Milk record saved');
});
