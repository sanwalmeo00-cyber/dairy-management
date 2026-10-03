import { apiRoute, getQuery, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { kidsService } from '@/server/services/kids.service';
import { createKidSchema, type CreateKidInput } from '@/server/validators/kids.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  const query = getQuery(request);
  const parentId = query.parentId?.trim() || undefined;
  return jsonSuccess(await kidsService.findAll(parentId ? { parentId } : undefined));
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateKidInput>(createKidSchema, await readJson(request));
  return jsonSuccess(await kidsService.create(body, user.userId), 201, 'Kid created');
});
