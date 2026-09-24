import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workerPaymentsService } from '@/server/services/workerPayments.service';
import {
  updateWorkerPaymentSchema,
  workerPaymentIdParamSchema,
  type UpdateWorkerPaymentInput,
} from '@/server/validators/workerPayments.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerPaymentIdParamSchema, await params);
  return jsonSuccess(await workerPaymentsService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerPaymentIdParamSchema, await params);
  const body = parseWithSchema<UpdateWorkerPaymentInput>(
    updateWorkerPaymentSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await workerPaymentsService.update(id, body, user.userId, user.role),
    200,
    'Worker payment updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerPaymentIdParamSchema, await params);
  return jsonSuccess(
    await workerPaymentsService.remove(id, user.userId, user.role),
    200,
    'Worker payment deleted'
  );
});
