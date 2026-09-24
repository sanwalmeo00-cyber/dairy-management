import { apiRoute, jsonSuccess, parseWithSchema, readJson } from '@/server/api/http';
import { authService } from '@/server/services/auth.service';
import { loginSchema, type LoginInput } from '@/server/validators/auth.validator';

export const POST = apiRoute(async (request) => {
  const body = parseWithSchema<LoginInput>(loginSchema, await readJson(request));
  const result = await authService.login(body);
  return jsonSuccess(result, 200, 'Logged in successfully');
});
