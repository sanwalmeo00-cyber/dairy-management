import { Response } from 'express';
import { Role } from '@prisma/client';
import { ordersService } from '../services/orders.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { CreateOrderInput, UpdateOrderStatusInput } from '../validators/orders.validator';

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isStaff =
    req.user?.role === Role.ADMIN ||
    req.user?.role === Role.MANAGER ||
    req.user?.role === Role.STAFF;

  const orders = await ordersService.findAll(isStaff ? undefined : req.user!.userId);
  return sendSuccess(res, orders);
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await ordersService.findById(req.params.id);
  return sendSuccess(res, order);
});

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await ordersService.create(req.user!.userId, req.body as CreateOrderInput);
  return sendSuccess(res, order, 201, 'Order created');
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await ordersService.updateStatus(
    req.params.id,
    req.body as UpdateOrderStatusInput
  );
  return sendSuccess(res, order, 200, 'Order status updated');
});
