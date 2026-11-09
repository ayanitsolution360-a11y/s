export type Language = 'en' | 'bn';
export type Currency = 'BDT' | 'USD';

export interface Product {
  id: string;
  name: string;
  bnName: string;
  barcode: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string; // 'pcs' | 'kg' | 'packet' | 'litre' | 'box'
  image?: string;
  brand?: string;
}

export interface Category {
  id: string;
  name: string;
  bnName: string;
  icon: string;
}

export interface Customer {
  id: string;
  name: string;
  bnName?: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  dueAmount: number;
  creditLimit: number;
  loyaltyPoints: number;
  notes?: string;
  memberSince?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or flat
  discountType: 'percentage' | 'flat';
  total: number;
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'due' | 'split';

export interface SplitPaymentDetail {
  method: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'due';
  amount: number;
  trxId?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  date: string; // ISO string
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail[];
  trxId?: string;
  status: 'paid' | 'partial' | 'due' | 'returned';
  cashier: string;
  note?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  pointsDiscountAmount?: number;
}

export interface Expense {
  id: string;
  title: string;
  bnTitle?: string;
  category: 'Rent' | 'Electricity' | 'Snacks & Tea' | 'Staff Salary' | 'Transport' | 'Supplier' | 'Maintenance' | 'Other';
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bkash' | 'bank';
  notes?: string;
}

export interface ParkedOrder {
  id: string;
  name: string;
  customerId: string;
  items: CartItem[];
  createdAt: string;
}

export interface DueTransaction {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  type: 'sale_due' | 'payment_collected';
  invoiceNo?: string;
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank';
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  storeBnName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  vatPercent: number;
  currency: Currency;
  currencySymbol: string;
  language: Language;
  receiptFooter: string;
  receiptWidth: '80mm' | '58mm';
  cashierName: string;
  loyaltyPointsEnabled: boolean;
  pointsEarnRate: number; // e.g. 100 BDT = 1 point
  pointValue: number; // e.g. 1 point = 1 BDT
  minPointsToRedeem: number; // minimum points to allow redemption
}

export interface CashRegister {
  openingBalance: number;
  openedAt: string;
  isOpen: boolean;
  expectedBalance: number;
}

export type DuplicateStrategy = 'update_stock' | 'replace_stock' | 'skip' | 'create_new';

export interface BulkImportProductItem extends Omit<Product, 'id'> {
  id?: string;
}

export interface BulkImportParams {
  products: BulkImportProductItem[];
  newCategories?: { id?: string; name: string; bnName?: string; icon?: string }[];
  duplicateStrategy: DuplicateStrategy;
}

export interface BulkImportResult {
  addedCount: number;
  updatedCount: number;
  newCategoriesCount: number;
  totalStockAdded: number;
}
