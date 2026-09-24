import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateBreedingInput, UpdateBreedingInput } from '../validators/breeding.validator';

const include = {
  owner: { select: { id: true, name: true } },
  kids: { where: { deletedAt: null }, select: { id: true } },
} as const;

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function serializeBreeding(
  record: Prisma.BreedingGetPayload<{ include: typeof include }>
) {
  return {
    id: record.id,
    femaleGoatId: record.femaleGoatId,
    maleGoatId: record.maleGoatId ?? undefined,
    breedingDate: record.breedingDate.toISOString().slice(0, 10),
    expectedDueDate: record.expectedDueDate.toISOString().slice(0, 10),
    actualBirthDate: record.actualBirthDate?.toISOString().slice(0, 10),
    status: record.status,
    notes: record.notes ?? undefined,
    kidIds: record.kids.map((k) => k.id),
    ownerId: record.ownerId,
    ownerName: record.owner.name,
    deletedAt: record.deletedAt?.toISOString() ?? null,
    deletedBy: record.deletedBy ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function assertCanModify(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot modify another user’s record');
  }
}

export class BreedingService {
  async findAll() {
    const rows = await prisma.breeding.findMany({
      where: { deletedAt: null },
      include,
      orderBy: { breedingDate: 'desc' },
    });
    return rows.map(serializeBreeding);
  }

  async findById(id: string) {
    const record = await prisma.breeding.findFirst({
      where: { id, deletedAt: null },
      include,
    });
    if (!record) throw new NotFoundError('Breeding record not found');
    return serializeBreeding(record);
  }

  async create(input: CreateBreedingInput, ownerId: string) {
    const female = await prisma.goat.findFirst({
      where: { id: input.femaleGoatId, deletedAt: null },
    });
    if (!female) throw new NotFoundError('Female goat not found');

    if (input.maleGoatId) {
      const male = await prisma.goat.findFirst({
        where: { id: input.maleGoatId, deletedAt: null },
      });
      if (!male) throw new NotFoundError('Male goat not found');
    }

    const record = await prisma.breeding.create({
      data: {
        femaleGoatId: input.femaleGoatId,
        maleGoatId: input.maleGoatId ?? undefined,
        breedingDate: new Date(input.breedingDate),
        expectedDueDate: new Date(input.expectedDueDate),
        actualBirthDate: toDate(input.actualBirthDate) ?? undefined,
        status: input.status,
        notes: input.notes ?? undefined,
        ownerId,
      },
      include,
    });

    return serializeBreeding(record);
  }

  async update(id: string, input: UpdateBreedingInput, userId: string, role: Role) {
    const existing = await prisma.breeding.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Breeding record not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.femaleGoatId) {
      const female = await prisma.goat.findFirst({
        where: { id: input.femaleGoatId, deletedAt: null },
      });
      if (!female) throw new NotFoundError('Female goat not found');
    }

    if (input.maleGoatId) {
      const male = await prisma.goat.findFirst({
        where: { id: input.maleGoatId, deletedAt: null },
      });
      if (!male) throw new NotFoundError('Male goat not found');
    }

    const record = await prisma.breeding.update({
      where: { id },
      data: {
        ...(input.femaleGoatId !== undefined && { femaleGoatId: input.femaleGoatId }),
        ...(input.maleGoatId !== undefined && { maleGoatId: input.maleGoatId }),
        ...(input.breedingDate !== undefined && { breedingDate: new Date(input.breedingDate) }),
        ...(input.expectedDueDate !== undefined && {
          expectedDueDate: new Date(input.expectedDueDate),
        }),
        ...(input.actualBirthDate !== undefined && {
          actualBirthDate: toDate(input.actualBirthDate),
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include,
    });

    return serializeBreeding(record);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.breeding.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Breeding record not found');
    assertCanModify(existing.ownerId, userId, role);

    const record = await prisma.breeding.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include,
    });

    return serializeBreeding(record);
  }
}

export const breedingService = new BreedingService();
