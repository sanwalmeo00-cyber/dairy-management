import type { ActivityItem, NotificationItem, FarmSettings } from '@/types/farm';

export const mockDashboardStats = {
  totalGoats: 128,
  activeGoats: 112,
  kids: 24,
  totalSales: 850000,
  totalExpenses: 320000,
  farmValue: 4200000,
};

export const mockSalesVsExpenses = [
  { month: 'Apr', sales: 95000, expenses: 42000 },
  { month: 'May', sales: 110000, expenses: 48000 },
  { month: 'Jun', sales: 80000, expenses: 51000 },
  { month: 'Jul', sales: 145000, expenses: 55000 },
  { month: 'Aug', sales: 120000, expenses: 60000 },
  { month: 'Sep', sales: 88000, expenses: 64000 },
];

export const mockPopulationTrend = [
  { month: 'Apr', adults: 98, kids: 18 },
  { month: 'May', adults: 102, kids: 20 },
  { month: 'Jun', adults: 105, kids: 21 },
  { month: 'Jul', adults: 108, kids: 22 },
  { month: 'Aug', adults: 110, kids: 23 },
  { month: 'Sep', adults: 112, kids: 24 },
];

export const mockGenderDistribution = [
  { name: 'Male', value: 54 },
  { name: 'Female', value: 74 },
];

export const mockStatusDistribution = [
  { name: 'Active', value: 112 },
  { name: 'Sold', value: 12 },
  { name: 'Deceased', value: 4 },
];

export const mockActivities: ActivityItem[] = [
  { id: 'a1', message: 'Sultan was added', timeAgo: '2 hours ago', type: 'goat' },
  { id: 'a2', message: 'Rani was sold', timeAgo: '5 hours ago', type: 'sale' },
  { id: 'a3', message: 'New expense recorded', timeAgo: 'Yesterday', type: 'expense' },
  { id: 'a4', message: 'Worker payment added', timeAgo: 'Yesterday', type: 'payment' },
  { id: 'a5', message: 'Breeding planned for Gulabo', timeAgo: '2 days ago', type: 'breeding' },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New goat added',
    message: 'Sultan (G001) was registered.',
    timeAgo: '5 minutes ago',
    read: false,
  },
  {
    id: 'n2',
    title: 'Low inventory',
    message: 'Antibiotic stock is below minimum.',
    timeAgo: '1 hour ago',
    read: false,
  },
  {
    id: 'n3',
    title: 'Worker payment recorded',
    message: 'Salary paid to Imran Ali.',
    timeAgo: 'Yesterday',
    read: true,
  },
];

export const mockFarmSettings: FarmSettings = {
  farmName: 'Green Meadow Goat Farm',
  farmLocation: 'Kasur, Punjab, Pakistan',
  currency: 'PKR / Rs.',
};

export const mockBreedDistribution = [
  { name: 'Beetal', value: 48 },
  { name: 'Teddy', value: 36 },
  { name: 'Kamori', value: 28 },
  { name: 'Other', value: 16 },
];
