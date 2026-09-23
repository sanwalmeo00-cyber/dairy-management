import { mockBreedings } from '@/data/mock/breeding';
import type { Breeding } from '@/types/farm';

export const breedingService = {
  async getAll(): Promise<Breeding[]> {
    return [...mockBreedings];
  },
  async getById(id: string): Promise<Breeding | undefined> {
    return mockBreedings.find((b) => b.id === id);
  },
};
