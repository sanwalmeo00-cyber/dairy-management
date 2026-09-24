import { apiRoute, getQuery, jsonSuccess, parseWithSchema, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { workersService } from '@/server/services/workers.service';
import { workerIdParamSchema } from '@/server/validators/workers.validator';
import { monthSummaryQuerySchema } from '@/server/validators/workerPayments.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(workerIdParamSchema, await params);
  const query = parseWithSchema<{ month: string }>(monthSummaryQuerySchema, getQuery(request));
  return jsonSuccess(await workersService.monthSummary(id, query.month));
});
