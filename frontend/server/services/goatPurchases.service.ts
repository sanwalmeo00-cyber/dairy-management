import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import {
  CreateGoatPurchaseInput,
  UpdateGoatPurchaseInput,
} from '../validators/goatPurchases.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type PurchaseRow = Prisma.GoatPurchaseGetPayload<{ include: typeof ownerInclude }>;

async function cashHandlerNames(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

function serialize(row: PurchaseRow, handlerNames: Map<string, string>) {
  const cashHandlerId = row.cashHandlerId ?? row.ownerId;
  const cashHandlerName =
    handlerNames.get(cashHandlerId) ?? row.owner.name;
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    goatId: row.goatId ?? undefined,
    tagNumber: row.tagNumber,
    seller: row.seller,
    purchasePrice: Number(row.purchasePrice),
    paymentStatus: row.paymentStatus,
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

export class GoatPurchasesService {
  async findAll() {
    const rows = await prisma.goatPurchase.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { date: 'desc' },
    });
    const names = await cashHandlerNames(rows.map((r) => r.cashHandlerId));
    return rows.map((row) => serialize(row, names));
  }

  async findById(id: string) {
    const row = await prisma.goatPurchase.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Goat purchase not found');
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }

  async create(input: CreateGoatPurchaseInput, addedById: string, cashHandlerId: string) {
    if (input.goatId) {
      const goat = await prisma.goat.findFirst({
        where: { id: input.goatId, deletedAt: null },
      });
      if (!goat) throw new NotFoundError('Goat not found');
    }

    const row = await prisma.goatPurchase.create({
      data: {
        date: new Date(input.date),
        tagNumber: input.tagNumber.trim(),
        goatId: input.goatId ?? undefined,
        seller: input.seller.trim(),
        purchasePrice: input.purchasePrice,
        paymentStatus: input.paymentStatus,
        notes: input.notes ?? undefined,
        ownerId: addedById,
      },
      include: ownerInclude,
    });
    await prisma.$executeRaw`UPDATE GoatPurchase SET cashHandlerId = ${cashHandlerId} WHERE id = ${row.id}`;
    const names = await cashHandlerNames([cashHandlerId]);
    return serialize({ ...row, cashHandlerId }, names);
  }

  async update(id: string, input: UpdateGoatPurchaseInput, userId: string, role: Role) {
    const existing = await prisma.goatPurchase.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Goat purchase not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.goatId) {
      const goat = await prisma.goat.findFirst({
        where: { id: input.goatId, deletedAt: null },
      });
      if (!goat) throw new NotFoundError('Goat not found');
    }

    const nextHandler = input.cashHandlerId ?? input.ownerId;
    const row = await prisma.goatPurchase.update({
      where: { id },
      data: {
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber.trim() }),
        ...(input.goatId !== undefined && { goatId: input.goatId }),
        ...(input.seller !== undefined && { seller: input.seller.trim() }),
        ...(input.purchasePrice !== undefined && { purchasePrice: input.purchasePrice }),
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    if (nextHandler) {
      await prisma.$executeRaw`UPDATE GoatPurchase SET cashHandlerId = ${nextHandler} WHERE id = ${id}`;
    }
    const names = await cashHandlerNames([nextHandler ?? row.cashHandlerId]);
    return serialize(
      { ...row, cashHandlerId: nextHandler ?? row.cashHandlerId },
      names
    );
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.goatPurchase.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Goat purchase not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.goatPurchase.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    const names = await cashHandlerNames([row.cashHandlerId]);
    return serialize(row, names);
  }
}

export const goatPurchasesService = new GoatPurchasesService();
