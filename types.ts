
export type FoodType = 'veg' | 'non-veg';
export type TableStatus = 'vacant' | 'occupied' | 'billed';
export type OrderStatus = 'pending' | 'billed' | 'paid';
export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Split' | '-';
export type ThemeType = 'Rock Bottom' | 'Midnight' | 'Eco-Green' | 'Modern Minimalist';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  foodType: FoodType;
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  section: string;
  currentOrderId?: string;
  orderValue?: number;
  sessionStartTime?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: number;
  cashAmount?: number;
  upiAmount?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface BusinessProfile {
  ownerName: string;
  ownerNumber: string;
  fssai: string;
  address: string;
}

export interface InvoiceLine {
  id: string;
  text: string;
  size: number;
  bold: boolean;
  align: 'left' | 'center' | 'right';
}

export interface AppSettings {
  theme: ThemeType;
  businessName?: string;
  logoUrl?: string;
  showLogoOnBill: boolean;
  showAddressOnBill: boolean;
  invoiceHeader: string;
  invoiceFooter: string;
  headerLines: InvoiceLine[];
  footerLines: InvoiceLine[];
  bodyFontSize: number;
  gstEnabled: boolean;
  gstPercentage: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Dairy & Milk'
  | 'Produce & Sabzi'
  | 'Gas & Cylinders'
  | 'Tea & Groceries'
  | 'Packaging & Cups'
  | 'Maintenance & Cleaning'
  | 'Utilities & Bills'
  | 'Staff & Wages'
  | 'Miscellaneous';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory | string;
  title: string;
  vendorName: string;
  vendorPhone?: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Due / Credit';
  paymentStatus: 'Paid' | 'Pending';
  quantity?: string;
  unitPrice?: number;
  notes?: string;
  receiptUrl?: string;
  createdAt: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  address?: string;
  gstin?: string;
  notes?: string;
  totalPurchases?: number;
  pendingBalance?: number;
  createdAt: string;
}

