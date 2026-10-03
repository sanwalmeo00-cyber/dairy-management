import { api } from '@/lib/api';
import type { Expense, GoatPurchase, Sale } from '@/types/farm';
import type { MoneyAccount } from '@/lib/moneyAccount';

export type GoatPurchaseInput = {
  date: string;
  tagNumber: string;
  goatId?: string | null;
  seller?: string | null;
  purchasePrice: number;
  paymentStatus?: string;
  account?: MoneyAccount;
  notes?: string | null;
};

export type SaleInput = {
  date: string;
  /** Optional — only for animal sales; cashbook money-in omits this */
  tagNumber?: string | null;
  buyer: string;
  salePrice: number;
  paymentStatus: string;
  account?: MoneyAccount;
  paymentMethod?: string;
  notes?: string | null;
};

export type ExpenseInput = {
  date: string;
  description: string;
  category: string;
  amount: number;
  account?: MoneyAccount;
  paymentMethod?: string;
  notes?: string | null;
};

export const goatPurchasesService = {
  async getAll(): Promise<GoatPurchase[]> {
    return api.get<GoatPurchase[]>('/goat-purchases');
  },
  async create(input: GoatPurchaseInput): Promise<GoatPurchase> {
    return api.post<GoatPurchase>('/goat-purchases', input);
  },
  async update(id: string, input: Partial<GoatPurchaseInput>): Promise<GoatPurchase> {
    return api.patch<GoatPurchase>(`/goat-purchases/${id}`, input);
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
  async update(id: string, input: Partial<SaleInput>): Promise<Sale> {
    return api.patch<Sale>(`/sales/${id}`, input);
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
  async update(id: string, input: Partial<ExpenseInput>): Promise<Expense> {
    return api.patch<Expense>(`/expenses/${id}`, input);
  },
  async remove(id: string): Promise<Expense> {
    return api.delete<Expense>(`/expenses/${id}`);
  },
};

export type FinanceUserOption = { id: string; name: string };

/** Active users excluding Super Admin — for Money from / Given to selectors */
export const financeUsersService = {
  async getOptions(): Promise<FinanceUserOption[]> {
    return api.get<FinanceUserOption[]>('/users/finance-options');
  },
};

export const walletService = {
  async getBalance(): Promise<number> {
    const data = await api.get<{ balance: number }>('/wallet');
    return data.balance;
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
