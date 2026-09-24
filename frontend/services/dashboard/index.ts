import { api } from '@/lib/api';
import type { ActivityItem } from '@/types/farm';

export type DashboardStats = {
  totalGoats: number;
  activeGoats: number;
  kids: number;
  totalSales: number;
  totalExpenses: number;
  farmValue: number;
  lowStockItems: number;
};

export type DashboardCharts = {
  salesVsExpenses: { month: string; sales: number; expenses: number }[];
  population: { month: string; adults: number; kids: number }[];
  gender: { name: string; value: number }[];
  status: { name: string; value: number }[];
  breeds: { name: string; value: number }[];
};

export type DashboardData = {
  stats: DashboardStats;
  charts: DashboardCharts;
  activities: ActivityItem[];
  cachedAt: string;
  fromCache: boolean;
};

const CLIENT_TTL_MS = 60_000;
let clientCache: { data: DashboardData; expiresAt: number } | null = null;

export { workersService } from '@/services/workers';
export { inventoryService } from '@/services/inventory';

export const dashboardService = {
  async getAll(options?: { refresh?: boolean }): Promise<DashboardData> {
    if (!options?.refresh && clientCache && Date.now() < clientCache.expiresAt) {
      return { ...clientCache.data, fromCache: true };
    }

    const q = options?.refresh ? '?refresh=1' : '';
    const data = await api.get<DashboardData>(`/dashboard${q}`);
    clientCache = { data, expiresAt: Date.now() + CLIENT_TTL_MS };
    return data;
  },

  clearCache() {
    clientCache = null;
  },
};
