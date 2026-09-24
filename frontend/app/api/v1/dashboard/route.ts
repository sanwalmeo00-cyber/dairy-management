import { apiRoute, getQuery, jsonSuccess, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { dashboardService } from '@/server/services/dashboard.service';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  const query = getQuery(request);
  const refresh = query.refresh === '1' || query.refresh === 'true';
  return jsonSuccess(await dashboardService.getOverview({ refresh }));
});
