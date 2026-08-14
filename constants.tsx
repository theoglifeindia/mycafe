
import { MenuItem, Table, BusinessProfile, AppSettings } from './types.ts';

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Veggie Wrap', category: 'San', price: 149, foodType: 'veg' },
  { id: '2', name: 'Mexican Elote (Cheese Corn Balls)', category: 'STARTERS', price: 199, foodType: 'veg' },
  { id: '3', name: 'Arancini balls', category: 'STARTERS', price: 249, foodType: 'veg' },
  { id: '4', name: 'One Pan Garlic mushroom', category: 'STARTERS', price: 199, foodType: 'veg' },
  { id: '5', name: 'One Pan Garlic chicken', category: 'STARTERS', price: 299, foodType: 'non-veg' },
  { id: '6', name: 'Honey Chili potato', category: 'STARTERS', price: 309, foodType: 'veg' },
  { id: '7', name: 'Melting paneer', category: 'STARTERS', price: 249, foodType: 'veg' },
  { id: '8', name: 'Malaysian mango chicken', category: 'STARTERS', price: 339, foodType: 'non-veg' },
  { id: '9', name: 'Potato Wedges', category: 'STARTERS', price: 129, foodType: 'veg' },
  { id: '10', name: 'Cajun Potato Veggies', category: 'STARTERS', price: 149, foodType: 'veg' },
  { id: '11', name: 'Paneer Popcorn', category: 'STARTERS', price: 269, foodType: 'veg' },
  { id: '12', name: 'Chicken Popcorn', category: 'STARTERS', price: 220, foodType: 'non-veg' },
  { id: '13', name: 'Lemon Garlic chicken', category: 'STARTERS', price: 310, foodType: 'non-veg' },
  { id: '14', name: 'Chicken Florentine', category: 'STARTERS', price: 349, foodType: 'non-veg' },
  { id: '15', name: 'Chicken Demi-Glace', category: 'STARTERS', price: 310, foodType: 'non-veg' },
  { id: '16', name: 'Paneer Chimichurri', category: 'STARTERS', price: 249, foodType: 'veg' },
  { id: '17', name: 'Chicken Chimichurri', category: 'STARTERS', price: 269, foodType: 'non-veg' },
  { id: '18', name: 'Chicken Nuggets', category: 'STARTERS', price: 149, foodType: 'non-veg' },
  { id: '19', name: 'Punjabi Tadka Maggi', category: 'MAGGI', price: 139, foodType: 'veg' },
  { id: '20', name: 'Veggie-Soupy Maggi', category: 'MAGGI', price: 119, foodType: 'veg' },
  { id: '21', name: 'Cheese Corn Maggi', category: 'MAGGI', price: 119, foodType: 'veg' },
  { id: '22', name: 'Chicken Maggi', category: 'MAGGI', price: 149, foodType: 'non-veg' },
  { id: '23', name: 'Double Masala Maggi', category: 'MAGGI', price: 99, foodType: 'veg' },
  { id: '24', name: 'Schezwan Maggi', category: 'MAGGI', price: 110, foodType: 'veg' },
  { id: '25', name: 'Paneer Schezwan Maggi', category: 'MAGGI', price: 129, foodType: 'veg' },
];

export const INITIAL_TABLES: Table[] = [
  { id: 't1', name: 'T1', status: 'vacant', section: 'Main Floor' },
  { id: 't2', name: 'T2', status: 'vacant', section: 'Main Floor' },
  { id: 't3', name: 'T3', status: 'vacant', section: 'Main Floor' },
  { id: 't4', name: 'T4', status: 'vacant', section: 'Main Floor' },
  { id: 't5', name: 'T5', status: 'vacant', section: 'Terrace' },
  { id: 't6', name: 'T6', status: 'vacant', section: 'Terrace' },
  { id: 't7', name: 'T7', status: 'vacant', section: 'Terrace' },
  { id: 't8', name: 'T8', status: 'vacant', section: 'Terrace' },
  { id: 'c1', name: 'C1', status: 'vacant', section: 'Lounge' },
  { id: 'c2', name: 'C2', status: 'vacant', section: 'Lounge' },
];

export const INITIAL_PROFILE: BusinessProfile = {
  ownerName: 'Chai Hub',
  ownerNumber: '+91 98765 43210',
  fssai: '12345678901234',
  address: '41, Mangalmurti Sq, Jaitala Road, Nagpur-440022'
};

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'Midnight',
  businessName: 'Chai Hub',
  showLogoOnBill: true,
  showAddressOnBill: true,
  invoiceHeader: 'Chai Hub',
  invoiceFooter: 'Visit Again! Follow us @chaihub',
  headerLines: [
    { id: 'h1', text: 'CHAI HUB', size: 16, bold: true, align: 'center' },
    { id: 'h2', text: 'Fresh Brews & Delicious Bites', size: 12, bold: false, align: 'center' }
  ],
  footerLines: [
    { id: 'f1', text: 'Thank You For Visiting Chai Hub!', size: 12, bold: true, align: 'center' },
    { id: 'f2', text: 'Follow us @chaihub', size: 10, bold: false, align: 'center' }
  ],
  bodyFontSize: 12,
  gstEnabled: false,
  gstPercentage: 5
};

export const INITIAL_VENDORS = [
  {
    id: 'VEND_1',
    name: 'Nagpur Dairy Cooperative',
    category: 'Dairy & Milk',
    phone: '+91 98221 11223',
    address: 'Sitabuldi Milk Hub, Nagpur',
    notes: 'Daily supply of fresh cow milk & full-cream milk at 6:30 AM',
    totalPurchases: 12500,
    pendingBalance: 1200,
    createdAt: '2026-08-01'
  },
  {
    id: 'VEND_2',
    name: 'Bharat Commercial Gas Agency',
    category: 'Gas & Cylinders',
    phone: '+91 94231 44556',
    address: 'Jaitala Road, Nagpur',
    notes: '19kg Blue Commercial LPG cylinders delivery',
    totalPurchases: 7800,
    pendingBalance: 0,
    createdAt: '2026-08-01'
  },
  {
    id: 'VEND_3',
    name: 'Kalamna Wholesale Sabzi Mandi',
    category: 'Produce & Sabzi',
    phone: '+91 97654 77889',
    address: 'Kalamna Market, Nagpur',
    notes: 'Fresh ginger (Adrak), lemons, mint leaves (Pudina), onions',
    totalPurchases: 4350,
    pendingBalance: 450,
    createdAt: '2026-08-01'
  },
  {
    id: 'VEND_4',
    name: 'Giri Brothers Kirana & Spices',
    category: 'Tea & Groceries',
    phone: '+91 98901 22334',
    address: 'Itwari Wholesale Bazaar, Nagpur',
    notes: 'Wagh Bakri Chai Patti, Cardamom, Cloves, Sugar 50kg bags',
    totalPurchases: 18200,
    pendingBalance: 0,
    createdAt: '2026-08-01'
  },
  {
    id: 'VEND_5',
    name: 'EcoPack Disposables & Cups',
    category: 'Packaging & Cups',
    phone: '+91 93710 99881',
    address: 'MIDC Hingna, Nagpur',
    notes: 'Biodegradable paper tea cups 100ml/150ml, parcel containers, tissue rolls',
    totalPurchases: 3200,
    pendingBalance: 0,
    createdAt: '2026-08-01'
  }
];

export const EXPENSE_PRESETS = [
  { title: 'Fresh Cow Milk (15 Litres)', category: 'Dairy & Milk', defaultVendor: 'Nagpur Dairy Cooperative', defaultAmount: 900, qty: '15 Litres' },
  { title: 'Commercial LPG Cylinder 19kg', category: 'Gas & Cylinders', defaultVendor: 'Bharat Commercial Gas Agency', defaultAmount: 1850, qty: '1 Cylinder' },
  { title: 'Daily Market Veggies (Adrak, Lemon, Pudina)', category: 'Produce & Sabzi', defaultVendor: 'Kalamna Wholesale Sabzi Mandi', defaultAmount: 380, qty: 'Daily Batch' },
  { title: 'Sugar 25kg Bag', category: 'Tea & Groceries', defaultVendor: 'Giri Brothers Kirana & Spices', defaultAmount: 1050, qty: '25 Kgs' },
  { title: 'Tea Leaves / Chai Patti (5 Kgs)', category: 'Tea & Groceries', defaultVendor: 'Giri Brothers Kirana & Spices', defaultAmount: 1650, qty: '5 Kgs' },
  { title: 'Paper Tea Cups 100ml (1000 Pcs)', category: 'Packaging & Cups', defaultVendor: 'EcoPack Disposables & Cups', defaultAmount: 650, qty: '1000 Cups' },
  { title: 'Kitchen Cleaning & Sanitizer Supplies', category: 'Maintenance & Cleaning', defaultVendor: 'Local Store', defaultAmount: 250, qty: '1 Set' },
  { title: 'Daily Kitchen Staff Wage Advance', category: 'Staff & Wages', defaultVendor: 'Kitchen Team', defaultAmount: 500, qty: 'Daily Helper' }
];

export const INITIAL_EXPENSES = [
  {
    id: 'EXP_101',
    date: new Date().toISOString().split('T')[0],
    category: 'Dairy & Milk',
    title: 'Daily Fresh Cow Milk (15L)',
    vendorName: 'Nagpur Dairy Cooperative',
    vendorPhone: '+91 98221 11223',
    amount: 900,
    paymentMethod: 'UPI' as const,
    paymentStatus: 'Paid' as const,
    quantity: '15 Litres',
    unitPrice: 60,
    notes: 'Morning fresh delivery',
    createdAt: Date.now() - 1000 * 60 * 60 * 5
  },
  {
    id: 'EXP_102',
    date: new Date().toISOString().split('T')[0],
    category: 'Produce & Sabzi',
    title: 'Ginger, Lemons & Fresh Mint (Pudina)',
    vendorName: 'Kalamna Wholesale Sabzi Mandi',
    vendorPhone: '+91 97654 77889',
    amount: 350,
    paymentMethod: 'Cash' as const,
    paymentStatus: 'Paid' as const,
    quantity: '3 Kgs Ginger + 1 Kg Lemon + Mint',
    notes: 'Morning mandi purchase for Masala Chai',
    createdAt: Date.now() - 1000 * 60 * 60 * 4
  },
  {
    id: 'EXP_103',
    date: new Date().toISOString().split('T')[0],
    category: 'Gas & Cylinders',
    title: 'Commercial LPG Cylinder (19kg Refill)',
    vendorName: 'Bharat Commercial Gas Agency',
    vendorPhone: '+91 94231 44556',
    amount: 1850,
    paymentMethod: 'UPI' as const,
    paymentStatus: 'Paid' as const,
    quantity: '1 Cylinder',
    unitPrice: 1850,
    notes: 'Kitchen main stove replacement cylinder',
    createdAt: Date.now() - 1000 * 60 * 60 * 2
  }
];

