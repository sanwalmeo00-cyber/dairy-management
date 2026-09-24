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

function serialize(
  row: Prisma.GoatPurchaseGetPayload<{ include: typeof ownerInclude }>
) {
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
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.goatPurchase.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Goat purchase not found');
    return serialize(row);
  }

  async create(input: CreateGoatPurchaseInput, ownerId: string) {
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
        ownerId,
      },
      include: ownerInclude,
    });
    return serialize(row);
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
    return serialize(row);
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
    return serialize(row);
  }
}

export const goatPurchasesService = new GoatPurchasesService();
