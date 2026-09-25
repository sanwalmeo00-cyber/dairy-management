import { Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from './errors';

/**
 * Resolve which user paid (money out) or received (money in) for a finance record.
 * Any farm user may attribute a record to an active partner; defaults to the actor.
 */
export async function resolveFinanceOwnerId(
  actorUserId: string,
  requestedOwnerId?: string | null
): Promise<string> {
  const ownerId = requestedOwnerId?.trim() || actorUserId;
  if (ownerId === actorUserId) return actorUserId;

  const owner = await prisma.user.findFirst({
    where: { id: ownerId, deletedAt: null },
    select: { id: true, status: true, role: true },
  });
  if (!owner) throw new NotFoundError('Selected user not found');
  if (owner.status !== 'Active') {
    throw new ValidationError('Selected user is inactive');
  }
  if (owner.role === Role.SUPER_ADMIN) {
    throw new ForbiddenError('Cannot attribute finance records to Super Admin');
  }
  return owner.id;
}
