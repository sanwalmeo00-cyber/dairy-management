import { api } from '@/lib/api';
import type { User } from '@/types/farm';

type ApiUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status?: string;
  createdBy?: string | null;
};

function mapUser(raw: ApiUser): User {
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

export const settingsService = {
  async getMe(): Promise<User> {
    return mapUser(await api.get<ApiUser>('/users/me'));
  },
  async updateProfile(input: { name: string; phone?: string | null }): Promise<User> {
    return mapUser(await api.patch<ApiUser>('/users/me', input));
  },
  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return api.post<{ changed: boolean }>('/users/me/change-password', input);
  },
};
