import type { Worker } from '@/types/farm';

export const mockWorkers: Worker[] = [
  {
    id: 'w-1',
    name: 'Imran Ali',
    phone: '0321-5557788',
    role: 'Farm Supervisor',
    salary: 35000,
    joiningDate: '2023-03-01',
    status: 'Active',
    notes: 'Handles daily herd checks.',
  },
  {
    id: 'w-2',
    name: 'Sajid Khan',
    phone: '0333-9988776',
    role: 'Caretaker',
    salary: 25000,
    joiningDate: '2024-01-15',
    status: 'Active',
  },
  {
    id: 'w-3',
    name: 'Farooq Ahmed',
    phone: '0301-2233445',
    role: 'Night Watchman',
    salary: 20000,
    joiningDate: '2022-08-10',
    status: 'Inactive',
    notes: 'Left for personal reasons.',
  },
];
