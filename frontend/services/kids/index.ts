import { mockKids } from '@/data/mock/kids';
import type { Kid } from '@/types/farm';

export const kidsService = {
  async getAll(): Promise<Kid[]> {
    return [...mockKids];
  },
  async getById(id: string): Promise<Kid | undefined> {
    return mockKids.find((k) => k.id === id);
  },
};
