import { apiRoute, getQuery, jsonSuccess, parseWithSchema, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { deletedService } from '@/server/services/deleted.service';
import {
  listDeletedQuerySchema,
  type DeletedEntity,
} from '@/server/validators/deleted.validator';

export const GET = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const query = parseWithSchema<{ entity?: DeletedEntity }>(
    listDeletedQuerySchema,
    getQuery(request)
  );
  return jsonSuccess(await deletedService.findAll(user.userId, user.role, query.entity));
});
