import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateMilkInput, UpdateMilkInput } from '../validators/milk.validator';
import { invalidateAppCaches } from '../utils/invalidate';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
  goat: { select: { id: true, tagNumber: true } },
} as const;

function serialize(row: Prisma.MilkRecordGetPayload<{ include: typeof ownerInclude }>) {
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    quantityKg: Number(row.quantityKg),
    session: row.session,
    goatId: row.goatId ?? undefined,
    tagNumber: row.tagNumber ?? row.goat?.tagNumber ?? undefined,
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

export class MilkService {
  async findAll() {
    const rows = await prisma.milkRecord.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.milkRecord.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Milk record not found');
    return serialize(row);
  }

  async create(input: CreateMilkInput, ownerId: string) {
    let tagNumber = input.tagNumber?.trim() || null;
    let goatId = input.goatId || null;

    if (goatId) {
      const goat = await prisma.goat.findFirst({
        where: { id: goatId, deletedAt: null },
        select: { id: true, tagNumber: true },
      });
      if (!goat) throw new NotFoundError('Animal not found');
      tagNumber = tagNumber || goat.tagNumber;
    }

    const row = await prisma.milkRecord.create({
      data: {
        date: new Date(input.date),
        quantityKg: input.quantityKg,
        session: input.session,
        goatId,
        tagNumber,
        notes: input.notes?.trim() || null,
        ownerId,
      },
      include: ownerInclude,
    });

    invalidateAppCaches();
    return serialize(row);
  }

  async update(id: string, input: UpdateMilkInput, userId: string, role: Role) {
    const existing = await prisma.milkRecord.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Milk record not found');
    assertCanModify(existing.ownerId, userId, role);

    let goatId = input.goatId === undefined ? undefined : input.goatId || null;
    let tagNumber =
      input.tagNumber === undefined ? undefined : input.tagNumber?.trim() || null;

    if (goatId) {
      const goat = await prisma.goat.findFirst({
        where: { id: goatId, deletedAt: null },
        select: { id: true, tagNumber: true },
      });
      if (!goat) throw new NotFoundError('Animal not found');
      if (tagNumber == null) tagNumber = goat.tagNumber;
    }

    const row = await prisma.milkRecord.update({
      where: { id },
      data: {
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.quantityKg !== undefined && { quantityKg: input.quantityKg }),
        ...(input.session !== undefined && { session: input.session }),
        ...(goatId !== undefined && { goatId }),
        ...(tagNumber !== undefined && { tagNumber }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      },
      include: ownerInclude,
    });

    invalidateAppCaches();
    return serialize(row);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.milkRecord.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!existing) throw new NotFoundError('Milk record not found');
    assertCanModify(existing.ownerId, userId, role);

    await prisma.milkRecord.delete({ where: { id } });
    invalidateAppCaches();
    return serialize(existing);
  }
}

export const milkService = new MilkService();
