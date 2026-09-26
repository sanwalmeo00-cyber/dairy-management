import { api } from '@/lib/api';
import type { Goat } from '@/types/farm';

export type GoatInput = {
  tagNumber: string;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currentValue: number;
  weight: number;
  color: string;
  healthStatus?: string;
  vaccinationStatus: string;
  status: string;
  imageUrl?: string | null;
  notes?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  name?: string;
  /** When changing status to Sold */
  salePrice?: number;
  saleBuyer?: string;
  salePaymentMethod?: string;
  salePaymentStatus?: string;
  saleDate?: string;
  saleCashHandlerId?: string | null;
  /** User who paid when animal was purchased */
  purchaseCashHandlerId?: string | null;
};

export const goatsService = {
  async getAll(): Promise<Goat[]> {
    return api.get<Goat[]>('/goats');
  },
  async getById(id: string): Promise<Goat | undefined> {
    try {
      return await api.get<Goat>(`/goats/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(input: GoatInput): Promise<Goat> {
    return api.post<Goat>('/goats', input);
  },
  async update(id: string, input: Partial<GoatInput>): Promise<Goat> {
    return api.patch<Goat>(`/goats/${id}`, input);
  },
  async remove(id: string): Promise<Goat> {
    return api.delete<Goat>(`/goats/${id}`);
  },
};
