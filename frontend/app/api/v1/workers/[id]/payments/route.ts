import { apiRoute, getQuery, jsonSuccess, parseWithSchema, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workerPaymentsService } from '@/server/services/workerPayments.service';
import { workersService } from '@/server/services/workers.service';
import { workerIdParamSchema } from '@/server/validators/workers.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerIdParamSchema, await params);
  await workersService.findById(id);
  const query = getQuery(request);
  const rows = await workerPaymentsService.findAll({
    workerId: id,
    forMonth: query.month,
  });
  return jsonSuccess(rows);
});
