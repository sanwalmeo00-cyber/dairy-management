import { Role } from '@prisma/client';
import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { productsService } from '@/server/services/products.service';
import {
  productIdParamSchema,
  updateProductSchema,
  type UpdateProductInput,
} from '@/server/validators/products.validator';

export const GET = apiRoute(async (_request, { params }) => {
  const { id } = parseWithSchema<{ id: string }>(productIdParamSchema, await params);
  return jsonSuccess(await productsService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  requireAuth(request, [Role.ADMIN, Role.MANAGER]);
  const { id } = parseWithSchema<{ id: string }>(productIdParamSchema, await params);
  const body = parseWithSchema<UpdateProductInput>(updateProductSchema, await readJson(request));
  return jsonSuccess(await productsService.update(id, body), 200, 'Product updated');
});

export const DELETE = apiRoute(async (request, { params }) => {
  requireAuth(request, [Role.ADMIN, Role.MANAGER]);
  const { id } = parseWithSchema<{ id: string }>(productIdParamSchema, await params);
  return jsonSuccess(await productsService.remove(id), 200, 'Product deactivated');
});
