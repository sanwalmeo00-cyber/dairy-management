import { Response } from 'express';
import { productsService } from '../services/products.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateProductInput, UpdateProductInput } from '../validators/products.validator';

export const getProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const products = await productsService.findAll();
  return sendSuccess(res, products);
});

export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await productsService.findById(req.params.id);
  return sendSuccess(res, product);
});

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await productsService.create(req.body as CreateProductInput);
  return sendSuccess(res, product, 201, 'Product created');
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await productsService.update(req.params.id, req.body as UpdateProductInput);
  return sendSuccess(res, product, 200, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await productsService.remove(req.params.id);
  return sendSuccess(res, product, 200, 'Product deactivated');
});
