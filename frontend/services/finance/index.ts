import { api } from '@/lib/api';
import type { Expense, GoatPurchase, Sale } from '@/types/farm';

export type GoatPurchaseInput = {
  date: string;
  tagNumber: string;
  goatId?: string | null;
  seller: string;
  purchasePrice: number;
  paymentStatus: string;
  notes?: string | null;
  /** @deprecated use cashHandlerId */
  ownerId?: string | null;
  cashHandlerId?: string | null;
};

export type SaleInput = {
  date: string;
  tagNumber: string;
  buyer: string;
  salePrice: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  /** @deprecated use cashHandlerId */
  ownerId?: string | null;
  cashHandlerId?: string | null;
};

export type ExpenseInput = {
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string | null;
  /** @deprecated use cashHandlerId */
  ownerId?: string | null;
  cashHandlerId?: string | null;
};

export type FinanceUserOption = { id: string; name: string };

export const goatPurchasesService = {
  async getAll(): Promise<GoatPurchase[]> {
    return api.get<GoatPurchase[]>('/goat-purchases');
  },
  async create(input: GoatPurchaseInput): Promise<GoatPurchase> {
    return api.post<GoatPurchase>('/goat-purchases', input);
  },
  async remove(id: string): Promise<GoatPurchase> {
    return api.delete<GoatPurchase>(`/goat-purchases/${id}`);
  },
};

export const salesService = {
  async getAll(): Promise<Sale[]> {
    return api.get<Sale[]>('/sales');
  },
  async create(input: SaleInput): Promise<Sale> {
    return api.post<Sale>('/sales', input);
  },
  async remove(id: string): Promise<Sale> {
    return api.delete<Sale>(`/sales/${id}`);
  },
};

export const expensesService = {
  async getAll(): Promise<Expense[]> {
    return api.get<Expense[]>('/expenses');
  },
  async create(input: ExpenseInput): Promise<Expense> {
    return api.post<Expense>('/expenses', input);
  },
  async remove(id: string): Promise<Expense> {
    return api.delete<Expense>(`/expenses/${id}`);
  },
};

export const financeUsersService = {
  async getOptions(): Promise<FinanceUserOption[]> {
    return api.get<FinanceUserOption[]>('/users/finance-options');
  },
};

/** Kept for leftover /purchases and /payments pages (removed from sidebar). */
export const purchasesService = {
  async getAll() {
    return [];
  },
};

export const paymentsService = {
  async getAll() {
    return [];
  },
};
