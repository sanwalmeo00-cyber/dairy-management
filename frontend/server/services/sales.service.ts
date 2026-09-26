import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateSaleInput, UpdateSaleInput } from '../validators/sales.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type SaleRow = Prisma.SaleGetPayload<{ include: typeof ownerInclude }>;

async function cashHandlerNames(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

function serialize(row: SaleRow, handlerNames: Map<string, string>) {
  const cashHandlerId = row.cashHandlerId ?? row.ownerId;
  const cashHandlerName =
    handlerNames.get(cashHandlerId) ?? row.owner.name;
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    tagNumber: row.tagNumber,
    goatId: row.goatId ?? undefined,
    buyer: row.buyer,
    salePrice: Number(row.salePrice),
    paymentStatus: row.paymentStatus,
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

export class SalesService {
  async findAll() {
    const rows = await prisma.sale.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { date: 'desc' },
    });
    const names = await cashHandlerNames(rows.map((r) => r.cashHandlerId));
    return rows.map((row) => serialize(row, names));
  }

  async findById(id: string) {
    const row = await prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Sale not found');
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }

  async create(
    input: CreateSaleInput,
    addedById: string,
    cashHandlerId: string,
    goatId?: string | null
  ) {
    const row = await prisma.sale.create({
      data: {
        date: new Date(input.date),
        tagNumber: input.tagNumber.trim(),
        goatId: goatId ?? undefined,
        buyer: input.buyer.trim(),
        salePrice: input.salePrice,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? undefined,
        ownerId: addedById,
      },
      include: ownerInclude,
    });
    await prisma.$executeRaw`UPDATE Sale SET cashHandlerId = ${cashHandlerId} WHERE id = ${row.id}`;
    const names = await cashHandlerNames([cashHandlerId]);
    return serialize({ ...row, cashHandlerId }, names);
  }

  async update(id: string, input: UpdateSaleInput, userId: string, role: Role) {
    const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Sale not found');
    assertCanModify(existing.ownerId, userId, role);

    const nextHandler = input.cashHandlerId ?? input.ownerId;
    const row = await prisma.sale.update({
      where: { id },
      data: {
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber.trim() }),
        ...(input.buyer !== undefined && { buyer: input.buyer.trim() }),
        ...(input.salePrice !== undefined && { salePrice: input.salePrice }),
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    if (nextHandler) {
      await prisma.$executeRaw`UPDATE Sale SET cashHandlerId = ${nextHandler} WHERE id = ${id}`;
    }
    const names = await cashHandlerNames([nextHandler ?? row.cashHandlerId]);
    return serialize({ ...row, cashHandlerId: nextHandler ?? row.cashHandlerId }, names);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Sale not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }
}

export const salesService = new SalesService();
