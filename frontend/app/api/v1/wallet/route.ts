import { apiRoute, jsonSuccess, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { getWalletBalance } from '@/server/utils/wallet';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  const balance = await getWalletBalance();
  return jsonSuccess({ balance });
});
