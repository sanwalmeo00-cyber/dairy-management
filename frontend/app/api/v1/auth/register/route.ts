import { apiRoute, jsonSuccess, parseWithSchema, readJson } from '@/server/api/http';
import { authService } from '@/server/services/auth.service';
import {
  registerSchema,
  type RegisterInput,
} from '@/server/validators/auth.validator';

export const POST = apiRoute(async (request) => {
  const body = parseWithSchema<RegisterInput>(registerSchema, await readJson(request));
  const result = await authService.register(body);
  return jsonSuccess(result, 201, 'Registered successfully');
});
