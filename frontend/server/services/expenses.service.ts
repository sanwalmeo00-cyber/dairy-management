import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateExpenseInput, UpdateExpenseInput } from '../validators/expenses.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof ownerInclude }>;

async function cashHandlerNames(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

function serialize(row: ExpenseRow, handlerNames: Map<string, string>) {
  const cashHandlerId = row.cashHandlerId ?? row.ownerId;
  const cashHandlerName =
    handlerNames.get(cashHandlerId) ?? row.owner.name;
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    addedById: row.ownerId,
    addedByName: row.owner.name,
    cashHandlerId,
    cashHandlerName,
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

export class ExpensesService {
  async findAll() {
    const rows = await prisma.expense.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { date: 'desc' },
    });
    const names = await cashHandlerNames(rows.map((r) => r.cashHandlerId));
    return rows.map((row) => serialize(row, names));
  }

  async findById(id: string) {
    const row = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Expense not found');
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }

  async create(input: CreateExpenseInput, addedById: string, cashHandlerId: string) {
    const row = await prisma.expense.create({
      data: {
        date: new Date(input.date),
        description: input.description.trim(),
        category: input.category,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? undefined,
        ownerId: addedById,
      },
      include: ownerInclude,
    });
    await prisma.$executeRaw`UPDATE Expense SET cashHandlerId = ${cashHandlerId} WHERE id = ${row.id}`;
    const names = await cashHandlerNames([cashHandlerId]);
    return serialize({ ...row, cashHandlerId }, names);
  }

  async update(id: string, input: UpdateExpenseInput, userId: string, role: Role) {
    const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Expense not found');
    assertCanModify(existing.ownerId, userId, role);

    const nextHandler = input.cashHandlerId ?? input.ownerId;
    const row = await prisma.expense.update({
      where: { id },
      data: {
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    if (nextHandler) {
      await prisma.$executeRaw`UPDATE Expense SET cashHandlerId = ${nextHandler} WHERE id = ${id}`;
    }
    const names = await cashHandlerNames([nextHandler ?? row.cashHandlerId]);
    return serialize({ ...row, cashHandlerId: nextHandler ?? row.cashHandlerId }, names);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Expense not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }
}

export const expensesService = new ExpensesService();
