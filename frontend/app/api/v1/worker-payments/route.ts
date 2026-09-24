import { apiRoute, getQuery, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workerPaymentsService } from '@/server/services/workerPayments.service';
import {
  createWorkerPaymentSchema,
  type CreateWorkerPaymentInput,
} from '@/server/validators/workerPayments.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  const query = getQuery(request);
  return jsonSuccess(
    await workerPaymentsService.findAll({
      workerId: query.workerId,
      forMonth: query.month,
    })
  );
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateWorkerPaymentInput>(
    createWorkerPaymentSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await workerPaymentsService.create(body, user.userId),
    201,
    'Worker payment recorded'
  );
});
