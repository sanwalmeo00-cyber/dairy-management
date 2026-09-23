import { Router } from 'express';
import { Role } from '@prisma/client';
import * as productsController from '../controllers/products.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createProductSchema,
  productIdParamSchema,
  updateProductSchema,
} from '../validators/products.validator';

const router = Router();

router.get('/', productsController.getProducts);
router.get(
  '/:id',
  validate(productIdParamSchema, 'params'),
  productsController.getProductById
);

router.use(authenticate);

router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER),
  validate(createProductSchema),
  productsController.createProduct
);
router.patch(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  productsController.updateProduct
);
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  validate(productIdParamSchema, 'params'),
  productsController.deleteProduct
);

export default router;
