import type { Role, User } from '@/types/farm';

export function isOwner(recordOwnerId: string, currentUserId: string): boolean {
  return recordOwnerId === currentUserId;
}

export function isSuperAdmin(user: Pick<User, 'role'>): boolean {
  return user.role === 'SUPER_ADMIN';
}

/** Super Admin can modify any record. Users only their own. */
export function canModify(
  recordOwnerId: string,
  currentUser: Pick<User, 'id' | 'role'>
): boolean {
  if (isSuperAdmin(currentUser)) return true;
  return isOwner(recordOwnerId, currentUser.id);
}

export function canManageUsers(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}
