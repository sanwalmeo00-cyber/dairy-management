import type { Expense } from '@/types/farm';

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    date: '2026-09-01',
    description: 'Monthly feed purchase',
    category: 'Feed',
    amount: 45000,
    paymentMethod: 'Bank Transfer',
    ownerId: 'user-1',
    ownerName: 'Partner A',
  },
  {
    id: 'exp-2',
    date: '2026-09-05',
    description: 'Veterinary checkup — Noori',
    category: 'Veterinary',
    amount: 8500,
    paymentMethod: 'Cash',
    ownerId: 'user-2',
    ownerName: 'Partner B',
  },
  {
    id: 'exp-3',
    date: '2026-09-10',
    description: 'Worker salaries — August',
    category: 'Worker Salary',
    amount: 60000,
    paymentMethod: 'Bank Transfer',
    ownerId: 'user-1',
    ownerName: 'Partner A',
  },
  {
    id: 'exp-4',
    date: '2026-08-28',
    description: 'Barn roof repair',
    category: 'Maintenance',
    amount: 22000,
    paymentMethod: 'Cash',
    ownerId: 'user-2',
    ownerName: 'Partner B',
  },
];
