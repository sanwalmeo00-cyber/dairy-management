import { api } from '@/lib/api';
import type { Kid } from '@/types/farm';

export type KidInput = {
  tagNumber: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  motherId: string;
  fatherId?: string | null;
  weight: number;
  healthStatus?: string;
  vaccinationStatus?: string;
  status?: string;
  notes?: string | null;
  name?: string;
  imageUrl?: string | null;
  clearMotherPregnancy?: boolean;
};

export const kidsService = {
  async getAll(): Promise<Kid[]> {
    return api.get<Kid[]>('/kids');
  },
  async getById(id: string): Promise<Kid | undefined> {
    try {
      return await api.get<Kid>(`/kids/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(input: KidInput): Promise<Kid> {
    return api.post<Kid>('/kids', input);
  },
  async update(id: string, input: Partial<KidInput>): Promise<Kid> {
    return api.patch<Kid>(`/kids/${id}`, input);
  },
  async remove(id: string): Promise<Kid> {
    return api.delete<Kid>(`/kids/${id}`);
  },
};
