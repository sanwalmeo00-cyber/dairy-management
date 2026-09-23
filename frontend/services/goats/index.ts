import { mockGoats } from '@/data/mock/goats';
import type { Goat } from '@/types/farm';

export const goatsService = {
  async getAll(): Promise<Goat[]> {
    return [...mockGoats];
  },
  async getById(id: string): Promise<Goat | undefined> {
    return mockGoats.find((g) => g.id === id);
  },
};
