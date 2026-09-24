import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { deletedService } from '@/server/services/deleted.service';
import {
  restoreDeletedSchema,
  type RestoreDeletedInput,
} from '@/server/validators/deleted.validator';

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<RestoreDeletedInput>(
    restoreDeletedSchema,
    await readJson(request)
  );
  return jsonSuccess(
    await deletedService.restore(body, user.userId, user.role),
    200,
    'Record restored'
  );
});
