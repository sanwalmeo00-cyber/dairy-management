import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { productsService } from '@/server/services/products.service';
import {
  createProductSchema,
  type CreateProductInput,
} from '@/server/validators/products.validator';

export const GET = apiRoute(async () => {
  return jsonSuccess(await productsService.findAll());
});

export const POST = apiRoute(async (request) => {
  requireAuth(request, [Role.ADMIN, Role.MANAGER]);
  const body = parseWithSchema<CreateProductInput>(createProductSchema, await readJson(request));
  return jsonSuccess(await productsService.create(body), 201, 'Product created');
});
