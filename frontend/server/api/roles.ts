import { Role } from '@prisma/client';

/** Roles used by most farm domain routes. */
export const FARM_ROLES = [Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER] as const;
