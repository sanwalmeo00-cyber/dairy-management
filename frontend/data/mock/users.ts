import type { User } from '@/types/farm';

export const superAdmin: User = {
  id: 'admin-1',
  name: 'Super Admin',
  email: 'superadmin@example.com',
  phone: '0300-0000000',
  role: 'SUPER_ADMIN',
  status: 'Active',
};

export const partnerA: User = {
  id: 'user-1',
  name: 'Partner A',
  email: 'partnera@example.com',
  phone: '0300-1112233',
  role: 'USER',
  createdBy: 'admin-1',
  status: 'Active',
};

export const partnerB: User = {
  id: 'user-2',
  name: 'Partner B',
  email: 'partnerb@example.com',
  phone: '0300-4455667',
  role: 'USER',
  createdBy: 'admin-1',
  status: 'Active',
};

/** Seed users — runtime list is managed in AuthContext. */
export const mockUsers: User[] = [superAdmin, partnerA, partnerB];
