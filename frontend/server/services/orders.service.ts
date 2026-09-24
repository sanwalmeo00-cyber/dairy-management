import { Prisma } from '@prisma/client';
import prisma from '../database/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateOrderInput, UpdateOrderStatusInput } from '../validators/orders.validator';

export class OrdersService {
  async findAll(userId?: string) {
    return prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }

  async create(userId: string, input: CreateOrderInput) {
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new ValidationError('One or more products are invalid or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let total = new Prisma.Decimal(0);

    const itemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for product ${product.name}`);
      }
      const unitPrice = product.price;
      total = total.add(unitPrice.mul(item.quantity));
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      };
    });

    return prisma.$transaction(async (tx) => {
      for (const item of itemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          userId,
          total,
          notes: input.notes,
          items: { create: itemsData },
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    await this.findById(id);
    return prisma.order.update({
      where: { id },
      data: { status: input.status },
      include: {
        items: { include: { product: true } },
      },
    });
  }
}

export const ordersService = new OrdersService();
