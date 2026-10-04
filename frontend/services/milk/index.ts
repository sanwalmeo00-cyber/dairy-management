import { api } from '@/lib/api';
import type { MilkRecord } from '@/types/farm';

export type MilkInput = {
  date: string;
  quantityKg: number;
  session: 'Morning' | 'Evening' | 'Combined';
  goatId?: string | null;
  tagNumber?: string | null;
  notes?: string | null;
};

export const milkService = {
  async getAll(): Promise<MilkRecord[]> {
    return api.get<MilkRecord[]>('/milk');
  },

  async create(input: MilkInput): Promise<MilkRecord> {
    return api.post<MilkRecord>('/milk', input);
  },

  async update(id: string, input: Partial<MilkInput>): Promise<MilkRecord> {
    return api.patch<MilkRecord>(`/milk/${id}`, input);
  },

  async remove(id: string): Promise<MilkRecord> {
    return api.delete<MilkRecord>(`/milk/${id}`);
  },
};
