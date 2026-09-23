import type { GoatPurchase } from '@/types/farm';

export const mockGoatPurchases: GoatPurchase[] = [
  {
    id: 'gp-1',
    date: '2023-06-01',
    goatId: 'goat-1',
    seller: 'Lahore Livestock Market',
    purchasePrice: 85000,
    paymentStatus: 'Paid',
    ownerId: 'user-1',
    ownerName: 'Partner A',
  },
  {
    id: 'gp-2',
    date: '2023-08-15',
    goatId: 'goat-2',
    seller: 'Faisalabad Farm Traders',
    purchasePrice: 65000,
    paymentStatus: 'Paid',
    ownerId: 'user-2',
    ownerName: 'Partner B',
  },
  {
    id: 'gp-3',
    date: '2023-01-05',
    goatId: 'goat-4',
    seller: 'Sindh Goat Breeders',
    purchasePrice: 95000,
    paymentStatus: 'Partial',
    notes: 'Remaining Rs. 15,000 pending.',
    ownerId: 'user-2',
    ownerName: 'Partner B',
  },
];
