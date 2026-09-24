import { apiRoute, jsonSuccess } from '@/server/api/http';

export const GET = apiRoute(async () => {
  return jsonSuccess({ status: 'ok' });
});
