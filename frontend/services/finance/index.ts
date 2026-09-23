import { mockGoatPurchases } from '@/data/mock/goatPurchases';
import { mockPurchases } from '@/data/mock/purchases';
import { mockSales } from '@/data/mock/sales';
import { mockExpenses } from '@/data/mock/expenses';
import { mockTransactions } from '@/data/mock/transactions';

export const goatPurchasesService = {
  async getAll() {
    return [...mockGoatPurchases];
  },
};

export const purchasesService = {
  async getAll() {
    return [...mockPurchases];
  },
};

export const salesService = {
  async getAll() {
    return [...mockSales];
  },
};

export const expensesService = {
  async getAll() {
    return [...mockExpenses];
  },
};

export const paymentsService = {
  async getAll() {
    return [...mockTransactions];
  },
};
