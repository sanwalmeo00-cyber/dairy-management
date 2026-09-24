import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { usersService } from '@/server/services/users.service';
import {
  updateUserSchema,
  userIdParamSchema,
  type UpdateUserInput,
} from '@/server/validators/users.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [Role.SUPER_ADMIN]);
  const { id } = parseWithSchema<{ id: string }>(userIdParamSchema, await params);
  const user = await usersService.findById(id);
  return jsonSuccess(user);
});

export const PATCH = apiRoute(async (request, { params }) => {
  requireAuth(request, [Role.SUPER_ADMIN]);
  const { id } = parseWithSchema<{ id: string }>(userIdParamSchema, await params);
  const body = parseWithSchema<UpdateUserInput>(updateUserSchema, await readJson(request));
  const user = await usersService.update(id, body);
  return jsonSuccess(user, 200, 'User updated');
});
