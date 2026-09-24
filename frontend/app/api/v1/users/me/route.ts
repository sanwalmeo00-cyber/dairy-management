import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { usersService } from '@/server/services/users.service';
import { updateMeSchema, type UpdateMeInput } from '@/server/validators/users.validator';

export const GET = apiRoute(async (request) => {
  const user = requireAuth(request);
  const me = await usersService.findById(user.userId);
  return jsonSuccess(me);
});

export const PATCH = apiRoute(async (request) => {
  const user = requireAuth(request);
  const body = parseWithSchema<UpdateMeInput>(updateMeSchema, await readJson(request));
  const me = await usersService.updateMe(user.userId, body);
  return jsonSuccess(me, 200, 'Profile updated');
});
