import { api } from '@/lib/api';
import type { User } from '@/types/farm';

export type CreateFarmUserInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

function mapUser(raw: {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status?: string;
  createdBy?: string | null;
}): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    phone: raw.phone ?? undefined,
    role: raw.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER',
    status: (raw.status as 'Active' | 'Inactive' | undefined) ?? 'Active',
    createdBy: raw.createdBy ?? undefined,
  };
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const rows = await api.get<
      Array<{
        id: string;
        email: string;
        name: string;
        phone?: string | null;
        role: string;
        status?: string;
        createdBy?: string | null;
      }>
    >('/users');
    return rows.map(mapUser);
  },

  async create(input: CreateFarmUserInput): Promise<User> {
    const row = await api.post<{
      id: string;
      email: string;
      name: string;
      phone?: string | null;
      role: string;
      status?: string;
      createdBy?: string | null;
    }>('/users', input);
    return mapUser(row);
  },

  async setStatus(userId: string, status: 'Active' | 'Inactive'): Promise<User> {
    const row = await api.patch<{
      id: string;
      email: string;
      name: string;
      phone?: string | null;
      role: string;
      status?: string;
      createdBy?: string | null;
    }>(`/users/${userId}/status`, { status });
    return mapUser(row);
  },
};
