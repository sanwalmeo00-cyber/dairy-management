import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import {
  CreateWorkerPaymentInput,
  UpdateWorkerPaymentInput,
} from '../validators/workerPayments.validator';
import {
  normalizeMoneyAccount,
  paymentMethodFromAccount,
} from '@/lib/moneyAccount';
import { setRecordAccount } from '../utils/account';
import { assertWalletCanSpend } from '../utils/wallet';
import { invalidateAppCaches } from '../utils/invalidate';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

/** Marker in Expense.notes so we can find/soft-delete the linked cashbook row. */
export const WORKER_PAYMENT_EXPENSE_PREFIX = 'Auto from worker payment:';

function expenseNoteFor(paymentId: string, userNotes?: string | null) {
  const marker = `${WORKER_PAYMENT_EXPENSE_PREFIX}${paymentId}`;
  const extra = userNotes?.trim();
  return extra ? `${marker}\n${extra}` : marker;
}

function expenseDescription(workerName: string, forMonth: string) {
  return `Worker payment · ${workerName} (${forMonth})`;
}

function resolvePayMethod(input: { account?: string | null; paymentMethod?: string | null }) {
  const account = normalizeMoneyAccount(input.account);
  const paymentMethod =
    input.paymentMethod?.trim() || paymentMethodFromAccount(account);
  return { account, paymentMethod };
}

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

    const { account, paymentMethod } = resolvePayMethod(input);

    await assertWalletCanSpend(input.amount, 'paying this worker');

    const row = await prisma.$transaction(async (tx) => {
      const payment = await tx.workerPayment.create({
        data: {
          workerId: input.workerId,
          date: new Date(input.date),
          forMonth: input.forMonth,
          type: input.type,
          amount: input.amount,
          paymentMethod,
          notes: input.notes ?? undefined,
          ownerId,
        },
        include: ownerInclude,
      });

      const expense = await tx.expense.create({
        data: {
          date: new Date(input.date),
          description: expenseDescription(worker.name, input.forMonth),
          category: 'Worker Salary',
          amount: input.amount,
          paymentMethod,
          notes: expenseNoteFor(payment.id, input.notes),
          ownerId,
        },
      });
      await setRecordAccount(tx, 'Expense', expense.id, account);

      return payment;
    });

    invalidateAppCaches();
    return serialize(row);
  }

  async update(id: string, input: UpdateWorkerPaymentInput, userId: string, role: Role) {
    const existing = await prisma.workerPayment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Worker payment not found');
    assertCanModify(existing.ownerId, userId, role);

    let workerName: string | undefined;
    const workerId = input.workerId ?? existing.workerId;
    if (input.workerId || input.type || input.forMonth) {
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, deletedAt: null },
      });
      if (!worker) throw new NotFoundError('Worker not found');
      workerName = worker.name;
    }

    const payPatch =
      input.account !== undefined || input.paymentMethod !== undefined
        ? resolvePayMethod({
            account: input.account,
            paymentMethod: input.paymentMethod ?? existing.paymentMethod,
          })
        : null;

    const row = await prisma.$transaction(async (tx) => {
      const payment = await tx.workerPayment.update({
        where: { id },
        data: {
          ...(input.workerId !== undefined && { workerId: input.workerId }),
          ...(input.date !== undefined && { date: new Date(input.date) }),
          ...(input.forMonth !== undefined && { forMonth: input.forMonth }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.amount !== undefined && { amount: input.amount }),
          ...(payPatch && { paymentMethod: payPatch.paymentMethod }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
        include: ownerInclude,
      });

      const marker = `${WORKER_PAYMENT_EXPENSE_PREFIX}${id}`;
      const linked = await tx.expense.findFirst({
        where: { deletedAt: null, notes: { startsWith: marker } },
      });
      if (linked) {
        const forMonth = input.forMonth ?? payment.forMonth;
        const name =
          workerName ??
          (
            await tx.worker.findFirst({
              where: { id: payment.workerId },
              select: { name: true },
            })
          )?.name ??
          'Worker';
        await tx.expense.update({
          where: { id: linked.id },
          data: {
            ...(input.date !== undefined && { date: new Date(input.date) }),
            description: expenseDescription(name, forMonth),
            ...(input.amount !== undefined && { amount: input.amount }),
            ...(payPatch && { paymentMethod: payPatch.paymentMethod }),
            notes: expenseNoteFor(id, input.notes !== undefined ? input.notes : payment.notes),
          },
        });
        if (payPatch) {
          await setRecordAccount(tx, 'Expense', linked.id, payPatch.account);
        }
      }

      return payment;
    });

    return serialize(row);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.workerPayment.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!existing) throw new NotFoundError('Worker payment not found');
    assertCanModify(existing.ownerId, userId, role);

    await prisma.$transaction(async (tx) => {
      const marker = `${WORKER_PAYMENT_EXPENSE_PREFIX}${id}`;
      await tx.expense.deleteMany({
        where: { notes: { startsWith: marker } },
      });
      await tx.workerPayment.delete({ where: { id } });
    });

    invalidateAppCaches();
    return serialize(existing);
  }
}

export const workerPaymentsService = new WorkerPaymentsService();
