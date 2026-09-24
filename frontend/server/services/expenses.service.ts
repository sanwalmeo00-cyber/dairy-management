import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateExpenseInput, UpdateExpenseInput } from '../validators/expenses.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

function serialize(row: Prisma.ExpenseGetPayload<{ include: typeof ownerInclude }>) {
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
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Expense not found');
    return serialize(row);
  }

  async create(input: CreateExpenseInput, ownerId: string) {
    const row = await prisma.expense.create({
      data: {
        date: new Date(input.date),
        description: input.description.trim(),
        category: input.category,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async update(id: string, input: UpdateExpenseInput, userId: string, role: Role) {
    const existing = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Expense not found');
    assertCanModify(existing.ownerId, userId, role);

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
    return serialize(row);
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
    return serialize(row);
  }
}

export const expensesService = new ExpensesService();
