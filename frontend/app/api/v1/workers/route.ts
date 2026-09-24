import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workersService } from '@/server/services/workers.service';
import {
  createWorkerSchema,
  type CreateWorkerInput,
} from '@/server/validators/workers.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await workersService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateWorkerInput>(createWorkerSchema, await readJson(request));
  return jsonSuccess(await workersService.create(body, user.userId), 201, 'Worker created');
});
