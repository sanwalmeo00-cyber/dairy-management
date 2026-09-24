import { api } from '@/lib/api';
import type { Worker, WorkerMonthSummary, WorkerPayment } from '@/types/farm';

export type WorkerInput = {
  name: string;
  phone: string;
  role: string;
  salary: number;
  joiningDate: string;
  status?: string;
  notes?: string | null;
};

export type WorkerPaymentInput = {
  workerId: string;
  date: string;
  forMonth: string;
  type: 'Salary' | 'Advance' | 'Bonus' | 'Other';
  amount: number;
  paymentMethod: string;
  notes?: string | null;
};

export const workersService = {
  async getAll(): Promise<Worker[]> {
    return api.get<Worker[]>('/workers');
  },
  async getById(id: string): Promise<Worker | undefined> {
    try {
      return await api.get<Worker>(`/workers/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(input: WorkerInput): Promise<Worker> {
    return api.post<Worker>('/workers', input);
  },
  async update(id: string, input: Partial<WorkerInput>): Promise<Worker> {
    return api.patch<Worker>(`/workers/${id}`, input);
  },
  async remove(id: string): Promise<Worker> {
    return api.delete<Worker>(`/workers/${id}`);
  },
  async getPayments(workerId: string, month?: string): Promise<WorkerPayment[]> {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    return api.get<WorkerPayment[]>(`/workers/${workerId}/payments${q}`);
  },
  async getMonthSummary(workerId: string, month: string): Promise<WorkerMonthSummary> {
    return api.get<WorkerMonthSummary>(
      `/workers/${workerId}/month-summary?month=${encodeURIComponent(month)}`
    );
  },
};

export const workerPaymentsService = {
  async create(input: WorkerPaymentInput): Promise<WorkerPayment> {
    return api.post<WorkerPayment>('/worker-payments', input);
  },
  async remove(id: string): Promise<WorkerPayment> {
    return api.delete<WorkerPayment>(`/worker-payments/${id}`);
  },
};
