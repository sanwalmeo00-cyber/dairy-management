import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workersService } from '@/server/services/workers.service';
import {
  updateWorkerSchema,
  workerIdParamSchema,
  type UpdateWorkerInput,
} from '@/server/validators/workers.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerIdParamSchema, await params);
  return jsonSuccess(await workersService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerIdParamSchema, await params);
  const body = parseWithSchema<UpdateWorkerInput>(updateWorkerSchema, await readJson(request));
  return jsonSuccess(
    await workersService.update(id, body, user.userId, user.role),
    200,
    'Worker updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerIdParamSchema, await params);
  return jsonSuccess(
    await workersService.remove(id, user.userId, user.role),
    200,
    'Worker deleted'
  );
});
