import { api } from '@/lib/api';
import type { Breeding } from '@/types/farm';

export type BreedingInput = {
  femaleGoatId: string;
  maleGoatId?: string | null;
  breedingDate: string;
  expectedDueDate: string;
  actualBirthDate?: string | null;
  status: string;
  notes?: string | null;
};

export const breedingService = {
  async getAll(): Promise<Breeding[]> {
    return api.get<Breeding[]>('/breeding');
  },
  async getById(id: string): Promise<Breeding | undefined> {
    try {
      return await api.get<Breeding>(`/breeding/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(input: BreedingInput): Promise<Breeding> {
    return api.post<Breeding>('/breeding', input);
  },
  async update(id: string, input: Partial<BreedingInput>): Promise<Breeding> {
    return api.patch<Breeding>(`/breeding/${id}`, input);
  },
  async remove(id: string): Promise<Breeding> {
    return api.delete<Breeding>(`/breeding/${id}`);
  },
};
