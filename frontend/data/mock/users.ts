import type { User } from '@/types/farm';

export const superAdmin: User = {
  id: 'admin-1',
  name: 'Super Admin',
  email: 'admin@gmail.com',
  role: 'SUPER_ADMIN',
  status: 'Active',
};

/** Local fallback list — only Super Admin is seeded; farm users are created in-app. */
export const mockUsers: User[] = [superAdmin];
