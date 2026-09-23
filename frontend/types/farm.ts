export type Role = 'SUPER_ADMIN' | 'USER';

export type SoftDeleteEntity =
  | 'goat'
  | 'breeding'
  | 'kid'
  | 'goat-purchase'
  | 'purchase'
  | 'sale'
  | 'expense'
  | 'worker'
  | 'inventory';

export type GoatGender = 'Male' | 'Female';
export type GoatStatus = 'Active' | 'Sold' | 'Deceased';
export type HealthStatus = 'Healthy' | 'Sick' | 'Under Treatment' | 'Recovering';
export type VaccinationStatus = 'Up to Date' | 'Due' | 'Overdue' | 'Not Vaccinated';

export type BreedingStatus = 'Planned' | 'Completed' | 'Pregnant' | 'Failed';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Other';

export type PurchaseCategory =
  | 'Feed'
  | 'Medicine'
  | 'Equipment'
  | 'Transportation'
  | 'Supplies'
  | 'Other';

export type ExpenseCategory =
  | 'Feed'
  | 'Medicine'
  | 'Veterinary'
  | 'Worker Salary'
  | 'Transport'
  | 'Equipment'
  | 'Maintenance'
  | 'Utilities'
  | 'Other';

export type WorkerStatus = 'Active' | 'Inactive';
export type WorkerPaymentType = 'Salary' | 'Advance' | 'Bonus' | 'Other';

export type InventoryCategory =
  | 'Goat Feed'
  | 'Medicine'
  | 'Vaccines'
  | 'Equipment'
  | 'Other Supplies';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type TransactionType = 'Income' | 'Expense';

export interface SoftDeletable {
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByName?: string | null;
}

export interface OwnedRecord extends SoftDeletable {
  ownerId: string;
  ownerName: string;
}

export interface DeletedRecord {
  id: string;
  entity: SoftDeleteEntity;
  recordId: string;
  label: string;
  ownerId: string;
  ownerName: string;
  deletedAt: string;
  deletedBy: string;
  deletedByName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdBy?: string | null;
  status?: 'Active' | 'Inactive';
}

export interface Goat extends OwnedRecord {
  id: string;
  tagNumber: string;
  name: string;
  breed: string;
  gender: GoatGender;
  dateOfBirth: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue: number;
  weight: number;
  color: string;
  healthStatus: HealthStatus;
  vaccinationStatus: VaccinationStatus;
  status: GoatStatus;
  imageUrl?: string;
  notes?: string;
  fatherId?: string;
  motherId?: string;
}

export interface Breeding extends OwnedRecord {
  id: string;
  femaleGoatId: string;
  maleGoatId: string;
  breedingDate: string;
  expectedDueDate: string;
  actualBirthDate?: string;
  status: BreedingStatus;
  notes?: string;
  kidIds: string[];
}

export interface Kid extends OwnedRecord {
  id: string;
  tagNumber: string;
  name: string;
  gender: GoatGender;
  dateOfBirth: string;
  motherId: string;
  fatherId: string;
  weight: number;
  healthStatus: HealthStatus;
  vaccinationStatus: VaccinationStatus;
  status: GoatStatus;
  notes?: string;
  breedingId?: string;
}

export interface GoatPurchase extends OwnedRecord {
  id: string;
  date: string;
  goatId: string;
  seller: string;
  purchasePrice: number;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface Purchase extends OwnedRecord {
  id: string;
  date: string;
  description: string;
  category: PurchaseCategory;
  vendor: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Sale extends OwnedRecord {
  id: string;
  date: string;
  goatId: string;
  buyer: string;
  salePrice: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Expense extends OwnedRecord {
  id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: string;
  salary: number;
  joiningDate: string;
  status: WorkerStatus;
  notes?: string;
}

export interface WorkerPayment extends OwnedRecord {
  id: string;
  workerId: string;
  date: string;
  type: WorkerPaymentType;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Transaction extends OwnedRecord {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  amount: number;
  status: PaymentStatus;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  currentStock: number;
  unit: string;
  minimumStock: number;
  cost: number;
  supplier?: string;
  notes?: string;
  status: StockStatus;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  date: string;
  quantity: number;
  direction: 'in' | 'out';
  reason?: string;
  supplier?: string;
  cost?: number;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  timeAgo: string;
  type: 'goat' | 'sale' | 'expense' | 'payment' | 'breeding' | 'inventory';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
}

export interface FarmSettings {
  farmName: string;
  farmLocation: string;
  currency: string;
}
