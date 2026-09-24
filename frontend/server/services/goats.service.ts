import { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateGoatInput, UpdateGoatInput } from '../validators/goats.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function serializeGoat(
  goat: Prisma.GoatGetPayload<{ include: typeof ownerInclude }>
) {
  return {
    id: goat.id,
    tagNumber: goat.tagNumber,
    name: goat.name ?? undefined,
    breed: goat.breed,
    gender: goat.gender,
    dateOfBirth: goat.dateOfBirth.toISOString().slice(0, 10),
    purchaseDate: goat.purchaseDate?.toISOString().slice(0, 10),
    purchasePrice: goat.purchasePrice != null ? Number(goat.purchasePrice) : undefined,
    currentValue: Number(goat.currentValue),
    weight: Number(goat.weight),
    color: goat.color,
    healthStatus: goat.healthStatus,
    vaccinationStatus: goat.vaccinationStatus,
    status: goat.status,
    imageUrl: goat.imageUrl ?? undefined,
    notes: goat.notes ?? undefined,
    fatherId: goat.fatherId ?? undefined,
    motherId: goat.motherId ?? undefined,
    ownerId: goat.ownerId,
    ownerName: goat.owner.name,
    deletedAt: goat.deletedAt?.toISOString() ?? null,
    deletedBy: goat.deletedBy ?? null,
    createdAt: goat.createdAt.toISOString(),
    updatedAt: goat.updatedAt.toISOString(),
  };
}

function assertCanModify(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot modify another user’s record');
  }
}

export class GoatsService {
  async findAll() {
    const goats = await prisma.goat.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { tagNumber: 'asc' },
    });
    return goats.map(serializeGoat);
  }

  async findById(id: string) {
    const goat = await prisma.goat.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!goat) throw new NotFoundError('Goat not found');
    return serializeGoat(goat);
  }

  async create(input: CreateGoatInput, ownerId: string) {
    const existing = await prisma.goat.findUnique({ where: { tagNumber: input.tagNumber } });
    if (existing) throw new ConflictError('Tag number already exists');

    const goat = await prisma.goat.create({
      data: {
        tagNumber: input.tagNumber,
        name: input.name,
        breed: input.breed,
        gender: input.gender,
        dateOfBirth: new Date(input.dateOfBirth),
        purchaseDate: toDate(input.purchaseDate) ?? undefined,
        purchasePrice: input.purchasePrice ?? undefined,
        currentValue: input.currentValue,
        weight: input.weight,
        color: input.color,
        healthStatus: input.healthStatus,
        vaccinationStatus: input.vaccinationStatus,
        status: input.status,
        imageUrl: input.imageUrl ?? undefined,
        notes: input.notes ?? undefined,
        fatherId: input.fatherId ?? undefined,
        motherId: input.motherId ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });

    return serializeGoat(goat);
  }

  async update(id: string, input: UpdateGoatInput, userId: string, role: Role) {
    const existing = await prisma.goat.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Goat not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.tagNumber && input.tagNumber !== existing.tagNumber) {
      const clash = await prisma.goat.findUnique({ where: { tagNumber: input.tagNumber } });
      if (clash) throw new ConflictError('Tag number already exists');
    }

    const goat = await prisma.goat.update({
      where: { id },
      data: {
        ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.breed !== undefined && { breed: input.breed }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.dateOfBirth !== undefined && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.purchaseDate !== undefined && { purchaseDate: toDate(input.purchaseDate) }),
        ...(input.purchasePrice !== undefined && { purchasePrice: input.purchasePrice }),
        ...(input.currentValue !== undefined && { currentValue: input.currentValue }),
        ...(input.weight !== undefined && { weight: input.weight }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.healthStatus !== undefined && { healthStatus: input.healthStatus }),
        ...(input.vaccinationStatus !== undefined && { vaccinationStatus: input.vaccinationStatus }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.fatherId !== undefined && { fatherId: input.fatherId }),
        ...(input.motherId !== undefined && { motherId: input.motherId }),
      },
      include: ownerInclude,
    });

    return serializeGoat(goat);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.goat.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Goat not found');
    assertCanModify(existing.ownerId, userId, role);

    const goat = await prisma.goat.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });

    return serializeGoat(goat);
  }
}

export const goatsService = new GoatsService();
