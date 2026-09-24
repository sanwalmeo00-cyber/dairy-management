import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { usersService } from '@/server/services/users.service';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/server/validators/users.validator';

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request);
  const body = parseWithSchema<ChangePasswordInput>(
    changePasswordSchema,
    await readJson(request)
  );
  const result = await usersService.changePassword(user.userId, body);
  return jsonSuccess(result, 200, 'Password updated');
});
