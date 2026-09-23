import type { Sale } from '@/types/farm';

export const mockSales: Sale[] = [
  {
    id: 'sale-1',
    date: '2025-12-10',
    goatId: 'goat-5',
    buyer: 'Malik Livestock',
    salePrice: 145000,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: 'Full payment received.',
    ownerId: 'user-1',
    ownerName: 'Partner A',
  },
  {
    id: 'sale-2',
    date: '2026-07-22',
    goatId: 'goat-2',
    buyer: 'Local Breeder — Kasur',
    salePrice: 88000,
    paymentStatus: 'Partial',
    paymentMethod: 'JazzCash',
    notes: 'Advance received; balance next week.',
    ownerId: 'user-2',
    ownerName: 'Partner B',
  },
];
