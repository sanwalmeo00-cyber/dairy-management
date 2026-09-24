import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { usersService } from '@/server/services/users.service';
import {
  setUserStatusSchema,
  userIdParamSchema,
  type SetUserStatusInput,
} from '@/server/validators/users.validator';

export const PATCH = apiRoute(async (request, { params }) => {
  const auth = requireAuth(request, [Role.SUPER_ADMIN]);
  const { id } = parseWithSchema<{ id: string }>(userIdParamSchema, await params);
  const body = parseWithSchema<SetUserStatusInput>(setUserStatusSchema, await readJson(request));
  const user = await usersService.setStatus(id, body, auth.userId);
  return jsonSuccess(user, 200, `User marked ${user.status}`);
});
