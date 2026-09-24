import prisma from '../database/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
import { CreateProductInput, UpdateProductInput } from '../validators/products.validator';

export class ProductsService {
  async findAll() {
    return prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async create(input: CreateProductInput) {
    const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (existing) {
      throw new ConflictError('SKU already exists');
    }

    return prisma.product.create({ data: input });
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findById(id);

    if (input.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: input.sku, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('SKU already exists');
      }
    }

    return prisma.product.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const productsService = new ProductsService();
