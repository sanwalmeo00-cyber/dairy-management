import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { usersService } from '@/server/services/users.service';
import {
  createUserSchema,
  type CreateUserInput,
} from '@/server/validators/users.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [Role.SUPER_ADMIN]);
  const users = await usersService.findAll();
  return jsonSuccess(users);
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [Role.SUPER_ADMIN]);
  const body = parseWithSchema<CreateUserInput>(createUserSchema, await readJson(request));
  const created = await usersService.createBySuperAdmin(body, user.userId);
  return jsonSuccess(created, 201, 'User created');
});
