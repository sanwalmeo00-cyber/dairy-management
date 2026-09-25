import { apiRoute, jsonSuccess, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { usersService } from '@/server/services/users.service';

/** Active farm users for cashbook “paid by / received by” selectors. */
export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await usersService.findFinanceOptions());
});
