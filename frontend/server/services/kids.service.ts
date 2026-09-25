import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateKidInput, UpdateKidInput } from '../validators/kids.validator';
import { healthFromGoatStatus, normalizeGoatStatus } from '@/lib/goatStatus';

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
    goatId: kid.goatId ?? undefined,
    weight: Number(kid.weight),
    healthStatus: kid.healthStatus,
    vaccinationStatus: kid.vaccinationStatus,
    status: normalizeGoatStatus(kid.status),
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
      orderBy: { dateOfBirth: 'desc' },
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

  /**
   * Register a birth: creates a Kids record and a matching Animal (Goat)
   * so the child appears in both Kids and Animals. Clears mother Pregnant status.
   */
  async create(input: CreateKidInput, ownerId: string) {
    const tagNumber = input.tagNumber.trim();

    const existingKid = await prisma.kid.findUnique({ where: { tagNumber } });
    if (existingKid && !existingKid.deletedAt) {
      throw new ConflictError('Tag number already exists in kids');
    }

    const existingGoat = await prisma.goat.findUnique({ where: { tagNumber } });
    if (existingGoat && !existingGoat.deletedAt) {
      throw new ConflictError('Tag number already exists in animals');
    }

    const mother = await prisma.goat.findFirst({
      where: { id: input.motherId, deletedAt: null },
    });
    if (!mother) throw new NotFoundError('Mother goat not found');
    if (mother.gender !== 'Female') {
      throw new ConflictError('Mother must be a female animal');
    }

    if (input.fatherId) {
      const father = await prisma.goat.findFirst({
        where: { id: input.fatherId, deletedAt: null },
      });
      if (!father) throw new NotFoundError('Father goat not found');
      if (father.gender !== 'Male') {
        throw new ConflictError('Father must be a male animal');
      }
    }

    const status = normalizeGoatStatus(input.status ?? 'Healthy');
    const healthStatus = input.healthStatus ?? healthFromGoatStatus(status);
    const vaccinationStatus = input.vaccinationStatus ?? 'Not Vaccinated';
    const clearMotherPregnancy = input.clearMotherPregnancy !== false;

    const kid = await prisma.$transaction(async (tx) => {
      const goat = await tx.goat.create({
        data: {
          tagNumber,
          name: input.name,
          breed: mother.breed,
          gender: input.gender,
          dateOfBirth: new Date(input.dateOfBirth),
          currentValue: 0,
          weight: input.weight,
          color: mother.color,
          healthStatus,
          vaccinationStatus,
          status,
          imageUrl: input.imageUrl || undefined,
          notes: input.notes ?? undefined,
          motherId: input.motherId,
          fatherId: input.fatherId ?? undefined,
          ownerId,
        },
      });

      const created = await tx.kid.create({
        data: {
          tagNumber,
          name: input.name,
          gender: input.gender,
          dateOfBirth: new Date(input.dateOfBirth),
          motherId: input.motherId,
          fatherId: input.fatherId ?? undefined,
          goatId: goat.id,
          weight: input.weight,
          healthStatus,
          vaccinationStatus,
          status,
          imageUrl: input.imageUrl || undefined,
          notes: input.notes ?? undefined,
          ownerId,
        },
        include: ownerInclude,
      });

      if (clearMotherPregnancy && normalizeGoatStatus(mother.status) === 'Pregnant') {
        await tx.goat.update({
          where: { id: mother.id },
          data: {
            status: 'Healthy',
            healthStatus: healthFromGoatStatus('Healthy', mother.healthStatus),
          },
        });
      }

      return created;
    });

    return serializeKid(kid);
  }

  async update(id: string, input: UpdateKidInput, userId: string, role: Role) {
    const existing = await prisma.kid.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Kid not found');
    assertCanModify(existing.ownerId, userId, role);

    if (input.tagNumber && input.tagNumber !== existing.tagNumber) {
      const clashKid = await prisma.kid.findUnique({ where: { tagNumber: input.tagNumber } });
      if (clashKid && clashKid.id !== existing.id) {
        throw new ConflictError('Tag number already exists in kids');
      }
      const clashGoat = await prisma.goat.findUnique({ where: { tagNumber: input.tagNumber } });
      if (clashGoat && clashGoat.id !== existing.goatId) {
        throw new ConflictError('Tag number already exists in animals');
      }
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

    const nextStatus =
      input.status !== undefined ? normalizeGoatStatus(input.status) : undefined;
    const healthStatus =
      input.healthStatus ??
      (nextStatus ? healthFromGoatStatus(nextStatus, existing.healthStatus) : undefined);

    const kid = await prisma.$transaction(async (tx) => {
      const updated = await tx.kid.update({
        where: { id },
        data: {
          ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber }),
          ...(input.name !== undefined && { name: input.name }),
          ...(input.gender !== undefined && { gender: input.gender }),
          ...(input.dateOfBirth !== undefined && {
            dateOfBirth: new Date(input.dateOfBirth),
          }),
          ...(input.motherId !== undefined && { motherId: input.motherId }),
          ...(input.fatherId !== undefined && { fatherId: input.fatherId }),
          ...(input.weight !== undefined && { weight: input.weight }),
          ...(healthStatus !== undefined && { healthStatus }),
          ...(input.vaccinationStatus !== undefined && {
            vaccinationStatus: input.vaccinationStatus,
          }),
          ...(nextStatus !== undefined && { status: nextStatus }),
          ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
        include: ownerInclude,
      });

      if (existing.goatId) {
        await tx.goat.updateMany({
          where: { id: existing.goatId, deletedAt: null },
          data: {
            ...(input.tagNumber !== undefined && { tagNumber: input.tagNumber }),
            ...(input.name !== undefined && { name: input.name }),
            ...(input.gender !== undefined && { gender: input.gender }),
            ...(input.dateOfBirth !== undefined && {
              dateOfBirth: new Date(input.dateOfBirth),
            }),
            ...(input.motherId !== undefined && { motherId: input.motherId }),
            ...(input.fatherId !== undefined && { fatherId: input.fatherId }),
            ...(input.weight !== undefined && { weight: input.weight }),
            ...(healthStatus !== undefined && { healthStatus }),
            ...(input.vaccinationStatus !== undefined && {
              vaccinationStatus: input.vaccinationStatus,
            }),
            ...(nextStatus !== undefined && { status: nextStatus }),
            ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
            ...(input.notes !== undefined && { notes: input.notes }),
          },
        });
      }

      return updated;
    });

    return serializeKid(kid);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.kid.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Kid not found');
    assertCanModify(existing.ownerId, userId, role);

    const now = new Date();
    const kid = await prisma.$transaction(async (tx) => {
      if (existing.goatId) {
        await tx.goat.updateMany({
          where: { id: existing.goatId, deletedAt: null },
          data: { deletedAt: now, deletedBy: userId },
        });
      }
      return tx.kid.update({
        where: { id },
        data: { deletedAt: now, deletedBy: userId },
        include: ownerInclude,
      });
    });

    return serializeKid(kid);
  }
}

export const kidsService = new KidsService();
