import { Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from './errors';

/**
 * Resolve which user paid (money out) or received (money in) for a finance record.
 * Super Admin cannot be selected. Defaults to the actor (if actor is not Super Admin).
 */
export async function resolveFinanceOwnerId(
  actorUserId: string,
  requestedOwnerId?: string | null
): Promise<string> {
  const requested = requestedOwnerId?.trim() || actorUserId;

  const owner = await prisma.user.findFirst({
    where: { id: requested, deletedAt: null },
    select: { id: true, status: true, role: true },
  });
  if (!owner) throw new NotFoundError('Selected user not found');
  if (owner.status !== 'Active') {
    throw new ValidationError('Selected user is inactive');
  }
  if (owner.role === Role.SUPER_ADMIN) {
    // Fall back to first active non–super-admin partner, or reject if none
    if (requested === actorUserId) {
      const fallback = await prisma.user.findFirst({
        where: {
          deletedAt: null,
          status: 'Active',
          role: { not: Role.SUPER_ADMIN },
        },
        select: { id: true },
        orderBy: { name: 'asc' },
      });
      if (fallback) return fallback.id;
    }
    throw new ForbiddenError('Cannot attribute finance records to Super Admin');
  }
  return owner.id;
}
