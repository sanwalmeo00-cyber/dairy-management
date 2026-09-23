import { mockWorkers } from '@/data/mock/workers';
import { mockWorkerPayments } from '@/data/mock/workerPayments';
import { mockInventory, mockInventoryTransactions } from '@/data/mock/inventory';
import {
  mockDashboardStats,
  mockSalesVsExpenses,
  mockPopulationTrend,
  mockGenderDistribution,
  mockStatusDistribution,
  mockActivities,
  mockNotifications,
  mockFarmSettings,
  mockBreedDistribution,
} from '@/data/mock/dashboard';

export const workersService = {
  async getAll() {
    return [...mockWorkers];
  },
  async getById(id: string) {
    return mockWorkers.find((w) => w.id === id);
  },
  async getPayments(workerId?: string) {
    if (!workerId) return [...mockWorkerPayments];
    return mockWorkerPayments.filter((p) => p.workerId === workerId);
  },
};

export const inventoryService = {
  async getAll() {
    return [...mockInventory];
  },
  async getById(id: string) {
    return mockInventory.find((i) => i.id === id);
  },
  async getTransactions(itemId?: string) {
    if (!itemId) return [...mockInventoryTransactions];
    return mockInventoryTransactions.filter((t) => t.itemId === itemId);
  },
};

export const dashboardService = {
  async getStats() {
    return mockDashboardStats;
  },
  async getCharts() {
    return {
      salesVsExpenses: mockSalesVsExpenses,
      population: mockPopulationTrend,
      gender: mockGenderDistribution,
      status: mockStatusDistribution,
      breeds: mockBreedDistribution,
    };
  },
  async getActivities() {
    return mockActivities;
  },
  async getNotifications() {
    return mockNotifications;
  },
  async getSettings() {
    return mockFarmSettings;
  },
};
