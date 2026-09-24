import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import {
  CreateWorkerPaymentInput,
  UpdateWorkerPaymentInput,
} from '../validators/workerPayments.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

function serialize(
  row: Prisma.WorkerPaymentGetPayload<{ include: typeof ownerInclude }>
) {
  return {
    id: row.id,
    workerId: row.workerId,
    date: row.date.toISOString().slice(0, 10),
    forMonth: row.forMonth,
    type: row.type,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertCanModify(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot modify another user’s record');
  }
}

export class WorkerPaymentsService {
  async findAll(filters?: { workerId?: string; forMonth?: string }) {
    const rows = await prisma.workerPayment.findMany({
      where: {
        deletedAt: null,
        ...(filters?.workerId && { workerId: filters.workerId }),
        ...(filters?.forMonth && { forMonth: filters.forMonth }),
      },
      include: ownerInclude,
      orderBy: { date: 'desc' },
    });
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.workerPayment.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Worker payment not found');
    return serialize(row);
  }

  async create(input: CreateWorkerPaymentInput, ownerId: string) {
    const worker = await prisma.worker.findFirst({
      where: { id: input.workerId, deletedAt: null },
    });
    if (!worker) throw new NotFoundError('Worker not found');

    const row = await prisma.workerPayment.create({
      data: {
        workerId: input.workerId,
        date: new Date(input.date),
        forMonth: input.forMonth,
        type: input.type,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async update(id: string, input: UpdateWorkerPaymentInput, userId: string, role: Role) {
    const existing = await prisma.workerPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Worker payment not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.workerId) {
      const worker = await prisma.worker.findFirst({
        where: { id: input.workerId, deletedAt: null },
      });
      if (!worker) throw new NotFoundError('Worker not found');
    }

    const row = await prisma.workerPayment.update({
      where: { id },
      data: {
        ...(input.workerId !== undefined && { workerId: input.workerId }),
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.forMonth !== undefined && { forMonth: input.forMonth }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.workerPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Worker payment not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.workerPayment.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    return serialize(row);
  }
}

export const workerPaymentsService = new WorkerPaymentsService();
