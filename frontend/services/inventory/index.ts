import { api } from '@/lib/api';
import type { InventoryCategory, InventoryItem, InventoryTransaction } from '@/types/farm';

export type InventoryItemInput = {
  name: string;
  category: InventoryCategory;
  unit: string;
  currentStock?: number;
  minimumStock: number;
  cost: number;
  dailyUsage?: number | null;
  expiryDate?: string | null;
  supplier?: string | null;
  notes?: string | null;
};

export type StockInInput = {
  date: string;
  quantity: number;
  cost?: number | null;
  supplier?: string | null;
  reason?: string | null;
  notes?: string | null;
};

export type StockOutInput = {
  date: string;
  quantity: number;
  reason: string;
  notes?: string | null;
};

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    return api.get<InventoryItem[]>('/inventory');
  },
  async getById(id: string): Promise<InventoryItem | undefined> {
    try {
      return await api.get<InventoryItem>(`/inventory/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(input: InventoryItemInput): Promise<InventoryItem> {
    return api.post<InventoryItem>('/inventory', input);
  },
  async update(id: string, input: Partial<InventoryItemInput>): Promise<InventoryItem> {
    return api.patch<InventoryItem>(`/inventory/${id}`, input);
  },
  async remove(id: string): Promise<InventoryItem> {
    return api.delete<InventoryItem>(`/inventory/${id}`);
  },
  async getTransactions(itemId: string): Promise<InventoryTransaction[]> {
    return api.get<InventoryTransaction[]>(`/inventory/${itemId}/transactions`);
  },
  async stockIn(itemId: string, input: StockInInput) {
    return api.post<{ item: InventoryItem; transaction: InventoryTransaction }>(
      `/inventory/${itemId}/stock-in`,
      input
    );
  },
  async stockOut(itemId: string, input: StockOutInput) {
    return api.post<{ item: InventoryItem; transaction: InventoryTransaction }>(
      `/inventory/${itemId}/stock-out`,
      input
    );
  },
};
