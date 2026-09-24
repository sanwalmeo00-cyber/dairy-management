import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateKidInput, UpdateKidInput } from '../validators/kids.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

function serializeKid(
  kid: Prisma.KidGetPayload<{ include: typeof ownerInclude }>
) {
  return {
    id: kid.id,
    tagNumber: kid.tagNumber,
    name: kid.name ?? undefined,
    gender: kid.gender,
    dateOfBirth: kid.dateOfBirth.toISOString().slice(0, 10),
    motherId: kid.motherId,
    fatherId: kid.fatherId ?? undefined,
    weight: Number(kid.weight),
    healthStatus: kid.healthStatus,
    vaccinationStatus: kid.vaccinationStatus,
    status: kid.status,
    imageUrl: kid.imageUrl ?? undefined,
    notes: kid.notes ?? undefined,
    breedingId: kid.breedingId ?? undefined,
    ownerId: kid.ownerId,
    ownerName: kid.owner.name,
    deletedAt: kid.deletedAt?.toISOString() ?? null,
    deletedBy: kid.deletedBy ?? null,
    createdAt: kid.createdAt.toISOString(),
    updatedAt: kid.updatedAt.toISOString(),
  };
}

function assertCanModify(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot modify another user’s record');
  }
}

export class KidsService {
  async findAll() {
    const kids = await prisma.kid.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { tagNumber: 'asc' },
    });
    return kids.map(serializeKid);
  }

  async findById(id: string) {
    const kid = await prisma.kid.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!kid) throw new NotFoundError('Kid not found');
    return serializeKid(kid);
  }

  async create(input: CreateKidInput, ownerId: string) {
    const existing = await prisma.kid.findUnique({ where: { tagNumber: input.tagNumber } });
    if (existing) throw new ConflictError('Tag number already exists');

    const mother = await prisma.goat.findFirst({
      where: { id: input.motherId, deletedAt: null },
    });
    if (!mother) throw new NotFoundError('Mother goat not found');

    if (input.fatherId) {
      const father = await prisma.goat.findFirst({
        where: { id: input.fatherId, deletedAt: null },
      });
      if (!father) throw new NotFoundError('Father goat not found');
    }

    if (input.breedingId) {
      const breeding = await prisma.breeding.findFirst({
        where: { id: input.breedingId, deletedAt: null },
      });
      if (!breeding) throw new NotFoundError('Breeding record not found');
    }

    const kid = await prisma.kid.create({
      data: {
        tagNumber: input.tagNumber,
        name: input.name,
        gender: input.gender,
        dateOfBirth: new Date(input.dateOfBirth),
        motherId: input.motherId,
        fatherId: input.fatherId ?? undefined,
        weight: input.weight,
        healthStatus: input.healthStatus,
        vaccinationStatus: input.vaccinationStatus,
        status: input.status,
        imageUrl: input.imageUrl || undefined,
        notes: input.notes ?? undefined,
        breedingId: input.breedingId ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });

    return serializeKid(kid);
  }

  async update(id: string, input: UpdateKidInput, userId: string, role: Role) {
    const existing = await prisma.kid.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Kid not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.tagNumber && input.tagNumber !== existing.tagNumber) {
      const clash = await prisma.kid.findUnique({ where: { tagNumber: input.tagNumber } });
      if (clash) throw new ConflictError('Tag number already exists');
    }

    if (input.motherId) {
      const mother = await prisma.goat.findFirst({
        where: { id: input.motherId, deletedAt: null },
      });
      if (!mother) throw new NotFoundError('Mother goat not found');
    }

    if (input.fatherId) {
      const father = await prisma.goat.findFirst({
        where: { id: input.fatherId, deletedAt: null },
      });
      if (!father) throw new NotFoundError('Father goat not found');
    }

    const kid = await prisma.kid.update({
      where: { id },
      data: {
        ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.dateOfBirth !== undefined && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.motherId !== undefined && { motherId: input.motherId }),
        ...(input.fatherId !== undefined && { fatherId: input.fatherId }),
        ...(input.weight !== undefined && { weight: input.weight }),
        ...(input.healthStatus !== undefined && { healthStatus: input.healthStatus }),
        ...(input.vaccinationStatus !== undefined && {
          vaccinationStatus: input.vaccinationStatus,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.breedingId !== undefined && { breedingId: input.breedingId }),
      },
      include: ownerInclude,
    });

    return serializeKid(kid);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.kid.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Kid not found');
    assertCanModify(existing.ownerId, userId, role);

    const kid = await prisma.kid.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });

    return serializeKid(kid);
  }
}

export const kidsService = new KidsService();
