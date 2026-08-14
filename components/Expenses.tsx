import React, { useState, useMemo } from 'react';
import { ExpenseItem, Vendor, Order, AppSettings, BusinessProfile, ExpenseCategory } from '../types.ts';
import { db } from '../services/db.ts';
import { EXPENSE_PRESETS } from '../constants.tsx';
import { generateProfitLossPdf } from '../services/reportPdfGenerator.ts';
import { BillWiseLogo } from './BillWiseLogo.tsx';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  FileText, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Truck, 
  Building2, 
  ShoppingBag, 
  Fuel, 
  Milk, 
  Coffee, 
  Package, 
  Sparkles, 
  X, 
  Save, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Coins, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface ExpensesProps {
  orders: Order[];
  expenses: ExpenseItem[];
  vendors: Vendor[];
  settings: AppSettings;
  profile: BusinessProfile;
}

const CATEGORIES: { name: ExpenseCategory; icon: any; color: string }[] = [
  { name: 'Dairy & Milk', icon: Milk, color: '#3b82f6' },
  { name: 'Produce & Sabzi', icon: ShoppingBag, color: '#10b981' },
  { name: 'Gas & Cylinders', icon: Fuel, color: '#f97316' },
  { name: 'Tea & Groceries', icon: Coffee, color: '#8b5cf6' },
  { name: 'Packaging & Cups', icon: Package, color: '#ec4899' },
  { name: 'Maintenance & Cleaning', icon: Sparkles, color: '#06b6d4' },
  { name: 'Utilities & Bills', icon: Building2, color: '#64748b' },
  { name: 'Staff & Wages', icon: Coins, color: '#eab308' },
  { name: 'Miscellaneous', icon: Receipt, color: '#94a3b8' },
];

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#64748b', '#94a3b8'];

export const Expenses: React.FC<ExpensesProps> = ({
  orders,
  expenses,
  vendors,
  settings,
  profile,
}) => {
  const isDark = settings.theme === 'Midnight';
  const bName = settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Chai Hub';

  // Sub-navigation tabs
  const [activeTab, setActiveTab] = useState<'expenses' | 'vendors' | 'analytics'>('expenses');

  // Date filters
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Search & Category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Form State for Expense
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Dairy & Milk',
    vendorName: '',
    vendorPhone: '',
    amount: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash' as ExpenseItem['paymentMethod'],
    paymentStatus: 'Paid' as ExpenseItem['paymentStatus'],
    notes: '',
  });

  // Form State for Vendor
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Dairy & Milk',
    phone: '',
    address: '',
    gstin: '',
    notes: '',
    pendingBalance: '',
  });

  // Compute Active Date Range
  const { startDateStr, endDateStr } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      return { startDateStr: todayStr, endDateStr: todayStr };
    }
    if (dateFilter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { startDateStr: yStr, endDateStr: yStr };
    }
    if (dateFilter === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      return { startDateStr: w.toISOString().split('T')[0], endDateStr: todayStr };
    }
    if (dateFilter === 'month') {
      const m = new Date(now);
      m.setDate(1);
      return { startDateStr: m.toISOString().split('T')[0], endDateStr: todayStr };
    }
    return { startDateStr: customStartDate, endDateStr: customEndDate };
  }, [dateFilter, customStartDate, customEndDate]);

  // Filtered Orders for the active date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= startDateStr && orderDate <= endDateStr;
    });
  }, [orders, startDateStr, endDateStr]);

  // Filtered Expenses for the active date range & search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const inDate = e.date >= startDateStr && e.date <= endDateStr;
      if (!inDate) return false;

      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
      if (statusFilter !== 'all' && e.paymentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenses, startDateStr, endDateStr, selectedCategory, statusFilter, searchQuery]);

  // Key Financial KPIs
  const grossSalesRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  const totalKitchenExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = grossSalesRevenue - totalKitchenExpenses;
  const profitMargin = grossSalesRevenue > 0 ? ((netProfit / grossSalesRevenue) * 100).toFixed(1) : '0.0';

  const pendingVendorDues = useMemo(() => {
    return expenses
      .filter(e => e.paymentStatus === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Category Breakdown for Chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Daily Comparison (Sales vs Expense)
  const dailyComparisonData = useMemo(() => {
    const daysMap: Record<string, { date: string; sales: number; expenses: number; profit: number }> = {};
    
    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt).toISOString().split('T')[0];
      if (!daysMap[d]) daysMap[d] = { date: d, sales: 0, expenses: 0, profit: 0 };
      daysMap[d].sales += o.total;
    });

    filteredExpenses.forEach(e => {
      const d = e.date;
      if (!daysMap[d]) daysMap[d] = { date: d, sales: 0, expenses: 0, profit: 0 };
      daysMap[d].expenses += e.amount;
    });

    return Object.values(daysMap)
      .map(item => ({
        ...item,
        profit: item.sales - item.expenses,
        formattedDate: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, filteredExpenses]);

  // Open Expense Modal for Add
  const handleOpenAddExpense = (preset?: typeof EXPENSE_PRESETS[0]) => {
    setEditingExpense(null);
    if (preset) {
      setExpenseForm({
        title: preset.title,
        category: preset.category,
        vendorName: preset.defaultVendor,
        vendorPhone: '',
        amount: preset.defaultAmount.toString(),
        quantity: preset.qty,
        unitPrice: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        notes: 'Quick preset logged',
      });
    } else {
      setExpenseForm({
        title: '',
        category: 'Dairy & Milk',
        vendorName: vendors[0]?.name || '',
        vendorPhone: vendors[0]?.phone || '',
        amount: '',
        quantity: '',
        unitPrice: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        notes: '',
      });
    }
    setIsExpenseModalOpen(true);
  };

  // Open Expense Modal for Edit
  const handleOpenEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      vendorName: expense.vendorName,
      vendorPhone: expense.vendorPhone || '',
      amount: expense.amount.toString(),
      quantity: expense.quantity || '',
      unitPrice: expense.unitPrice ? expense.unitPrice.toString() : '',
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      paymentStatus: expense.paymentStatus,
      notes: expense.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  // Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const payload: ExpenseItem = {
      id: editingExpense ? editingExpense.id : `EXP_${Date.now()}`,
      date: expenseForm.date,
      category: expenseForm.category,
      title: expenseForm.title.trim() || 'Kitchen Purchase',
      vendorName: expenseForm.vendorName.trim() || 'Local Supplier',
      vendorPhone: expenseForm.vendorPhone.trim() || undefined,
      amount: parsedAmount,
      paymentMethod: expenseForm.paymentMethod,
      paymentStatus: expenseForm.paymentStatus,
      quantity: expenseForm.quantity.trim() || undefined,
      unitPrice: expenseForm.unitPrice ? parseFloat(expenseForm.unitPrice) : undefined,
      notes: expenseForm.notes.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : Date.now(),
    };

    if (editingExpense) {
      await db.updateExpense(editingExpense.id, payload);
    } else {
      await db.addExpense(payload);
    }

    setIsExpenseModalOpen(false);
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await db.deleteExpense(id);
    }
  };

  // Toggle Expense Paid/Pending
  const handleTogglePaymentStatus = async (expense: ExpenseItem) => {
    const nextStatus = expense.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    await db.updateExpense(expense.id, { paymentStatus: nextStatus });
  };

  // Vendor Management Actions
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      category: 'Dairy & Milk',
      phone: '',
      address: '',
      gstin: '',
      notes: '',
      pendingBalance: '0',
    });
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      phone: vendor.phone,
      address: vendor.address || '',
      gstin: vendor.gstin || '',
      notes: vendor.notes || '',
      pendingBalance: (vendor.pendingBalance || 0).toString(),
    });
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      alert('Please enter vendor name.');
      return;
    }

    const payload: Vendor = {
      id: editingVendor ? editingVendor.id : `VEND_${Date.now()}`,
      name: vendorForm.name.trim(),
      category: vendorForm.category,
      phone: vendorForm.phone.trim() || '-',
      address: vendorForm.address.trim() || undefined,
      gstin: vendorForm.gstin.trim() || undefined,
      notes: vendorForm.notes.trim() || undefined,
      totalPurchases: editingVendor ? editingVendor.totalPurchases || 0 : 0,
      pendingBalance: parseFloat(vendorForm.pendingBalance) || 0,
      createdAt: editingVendor ? editingVendor.createdAt : new Date().toISOString().split('T')[0],
    };

    await db.saveVendor(payload);
    setIsVendorModalOpen(false);
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      await db.deleteVendor(id);
    }
  };

  // Export PDF Report
  const handleExportPdf = () => {
    setIsPdfGenerating(true);
    try {
      generateProfitLossPdf({
        expenses: filteredExpenses,
        orders: filteredOrders,
        settings,
        profile,
        startDate: startDateStr,
        endDate: endDateStr,
      });
    } catch (err) {
      console.error('Failed to export P&L PDF', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No expense records to export.');
      return;
    }

    const headers = ['Expense ID', 'Date', 'Title', 'Category', 'Vendor', 'Phone', 'Quantity', 'Amount (INR)', 'Payment Mode', 'Status', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.vendorName.replace(/"/g, '""')}"`,
      `"${e.vendorPhone || '-'}"`,
      `"${e.quantity || '-'}"`,
      e.amount,
      e.paymentMethod,
      e.paymentStatus,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bName}_Expenses_${startDateStr}_to_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header Banner */}
      <div className={`p-8 sm:p-10 rounded-3xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white shadow-2xl'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-blue-300 border border-white/10">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen Procurement & Daily Profit (P&L) Engine</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                <span>Vendor & Expense Tracker</span>
              </h1>
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                Client Store: {bName}
              </p>
            </div>

            <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
              Track daily kitchen purchases (dairy, gas cylinders, chai patti, produce), manage supplier payables, and calculate live <strong className="text-white">Net Daily Restaurant Profit</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenAddExpense()}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Record Expense</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isPdfGenerating}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 backdrop-blur-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Download Profit & Loss PDF Statement"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>{isPdfGenerating ? 'Generating...' : 'P&L PDF'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-2xl transition-all cursor-pointer"
              title="Export as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Date Range Filter & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Main Tab Controls */}
        <div className={`p-1.5 rounded-2xl border flex items-center space-x-1 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-200 shadow-xs'
        }`}>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Daily Expenses ({filteredExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'vendors'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Suppliers & Vendors ({vendors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>P&L Analytics</span>
          </button>
        </div>

        {/* Date Filter Pills */}
        <div className={`p-1.5 rounded-2xl border flex flex-wrap items-center gap-1 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-xs'
        }`}>
          {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateFilter(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                dateFilter === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode === 'week' ? 'Last 7 Days' : mode === 'month' ? 'This Month' : mode}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-slate-800 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-transparent border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-transparent border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Four Core Financial Performance Cards (Gross Sales, Total Expenses, Net Profit, Pending Dues) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Gross Sales */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Gross Restaurant Revenue</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ₹{grossSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
              From {filteredOrders.length} settled customer orders
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Kitchen & Store Expenses</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ₹{totalKitchenExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
              Across {filteredExpenses.length} purchase entries
            </p>
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
          netProfit >= 0
            ? isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-white' : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-sm'
            : isDark ? 'bg-rose-950/40 border-rose-800/60 text-white' : 'bg-rose-50/70 border-rose-200 text-rose-950 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              Net Operating Profit
            </span>
            <div className={`p-2.5 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {profitMargin}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
              Net restaurant earnings for period
            </p>
          </div>
        </div>

        {/* Pending Vendor Dues */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Unsettled Vendor Dues</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{pendingVendorDues.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
              Credit purchases awaiting payment
            </p>
          </div>
        </div>
      </div>

      {/* 4. TAB 1: DAILY EXPENSES VIEW */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Quick-Entry 1-Tap Presets Bar */}
          <div className={`p-5 rounded-3xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quick 1-Tap Expense Presets
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400">Click to autofill & record</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
              {EXPENSE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenAddExpense(preset)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-98 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-blue-500/50' 
                      : 'bg-gray-50/80 border-gray-200/80 hover:bg-blue-50/50 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-500 block">
                      {preset.category}
                    </span>
                    <div className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {preset.title}
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-500">₹{preset.defaultAmount}</span>
                    <span className="text-[10px] font-bold text-gray-400">{preset.qty}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search, Filter & Expenses Table */}
          <div className={`rounded-3xl border overflow-hidden transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            
            {/* Table Controls Header */}
            <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark ? 'border-slate-800' : 'border-gray-100'
            }`}>
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search item, vendor, milk, gas cylinder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="all">All Status (Paid & Due)</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Pending">Pending Dues Only</option>
                </select>
              </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                    isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-gray-50/70 border-gray-100 text-gray-400'
                  }`}>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Item / Purchase</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Vendor & Contact</th>
                    <th className="py-3.5 px-5">Payment Mode</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Amount</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs font-medium">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                        <p className="text-sm font-bold">No kitchen expenses found</p>
                        <p className="text-xs text-gray-400 mt-1">Record your first purchase or adjust the date filter above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => {
                      const catInfo = CATEGORIES.find(c => c.name === expense.category);
                      const IconComponent = catInfo ? catInfo.icon : Receipt;

                      return (
                        <tr 
                          key={expense.id}
                          className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                            isDark ? 'text-slate-200' : 'text-gray-700'
                          }`}
                        >
                          {/* Date */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="font-bold text-xs">
                              {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(expense.date).getFullYear()}
                            </div>
                          </td>

                          {/* Item Title & Quantity */}
                          <td className="py-4 px-5">
                            <div className="font-black text-sm text-gray-900 dark:text-white">
                              {expense.title}
                            </div>
                            {expense.quantity && (
                              <div className="text-[10px] text-blue-500 font-bold mt-0.5">
                                Qty: {expense.quantity}
                              </div>
                            )}
                            {expense.notes && (
                              <div className="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-xs">
                                Note: {expense.notes}
                              </div>
                            )}
                          </td>

                          {/* Category Badge */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <IconComponent className="w-3 h-3" />
                              {expense.category}
                            </span>
                          </td>

                          {/* Vendor */}
                          <td className="py-4 px-5">
                            <div className="font-bold text-xs text-gray-900 dark:text-white">
                              {expense.vendorName}
                            </div>
                            {expense.vendorPhone && (
                              <a
                                href={`tel:${expense.vendorPhone}`}
                                className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500 mt-0.5"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{expense.vendorPhone}</span>
                              </a>
                            )}
                          </td>

                          {/* Payment Method */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                              {expense.paymentMethod}
                            </span>
                          </td>

                          {/* Payment Status (1-Click Toggle) */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePaymentStatus(expense)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                expense.paymentStatus === 'Paid'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                              }`}
                              title="Click to toggle Paid / Pending"
                            >
                              {expense.paymentStatus === 'Paid' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Paid</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>Pending Due</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                              ₹{expense.amount.toFixed(2)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleOpenEditExpense(expense)}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: VENDORS & SUPPLIERS VIEW */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Restaurant Suppliers & Vendor Directory
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage dairy farmers, LPG gas delivery agents, produce mandis, and grocery wholesalers.
              </p>
            </div>

            <button
              onClick={handleOpenAddVendor}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {vendors.map((vendor) => {
              const vendorExpenses = expenses.filter(e => e.vendorName.toLowerCase() === vendor.name.toLowerCase());
              const totalSpent = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
              const pendingDues = vendorExpenses.filter(e => e.paymentStatus === 'Pending').reduce((sum, e) => sum + e.amount, 0);

              return (
                <div
                  key={vendor.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                          {vendor.category}
                        </span>
                        <h3 className="text-base font-black mt-2 text-gray-900 dark:text-white">
                          {vendor.name}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditVendor(vendor)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <a href={`tel:${vendor.phone}`} className="font-bold hover:text-blue-500">
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}
                      {vendor.notes && (
                        <p className="text-[11px] italic text-gray-400 pt-1 border-t border-gray-100 dark:border-slate-800">
                          "{vendor.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total Purchases</div>
                      <div className="font-black text-gray-900 dark:text-white">₹{totalSpent.toFixed(2)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Pending Due</div>
                      <div className={`font-black ${pendingDues > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        ₹{pendingDues.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB 3: P&L ANALYTICS & BREAKDOWN VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Expenses Breakdown Pie Chart */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Expense by Category</h3>
                </div>
                <span className="text-xs font-bold text-gray-400">Total ₹{totalKitchenExpenses.toFixed(2)}</span>
              </div>

              {categoryChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                  No expense data to display for this period
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => [`₹${val.toFixed(2)}`, 'Spent']}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
                {categoryChartData.map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between pr-2">
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 truncate">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{c.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend (Revenue vs Expenses) */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Revenue vs Expense Comparison</h3>
                </div>
                <span className="text-xs font-bold text-emerald-500">Live P&L</span>
              </div>

              {dailyComparisonData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                  No daily trend data available for this range
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        formatter={(val: number, name: string) => [
                          `₹${val.toFixed(2)}`,
                          name === 'sales' ? 'Gross Sales' : 'Kitchen Expenses'
                        ]}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold' 
                        }}
                      />
                      <Bar dataKey="sales" name="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-bold text-gray-600 dark:text-slate-300">Gross Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="font-bold text-gray-600 dark:text-slate-300">Kitchen Expenses</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">
                  {editingExpense ? 'Edit Kitchen Expense' : 'Record New Expense'}
                </h3>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Date of Purchase
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Item / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Milk 15L, Commercial Gas Cylinder 19kg, Fresh Ginger"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Vendor & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    list="vendor-suggestions"
                    placeholder="e.g. Nagpur Dairy Co."
                    value={expenseForm.vendorName}
                    onChange={(e) => {
                      const v = vendors.find(ven => ven.name.toLowerCase() === e.target.value.toLowerCase());
                      setExpenseForm({
                        ...expenseForm,
                        vendorName: e.target.value,
                        vendorPhone: v ? v.phone : expenseForm.vendorPhone
                      });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                  <datalist id="vendor-suggestions">
                    {vendors.map(v => (
                      <option key={v.id} value={v.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Quantity / Volume (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Litres, 1 Cylinder, 5 Kgs"
                    value={expenseForm.quantity}
                    onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Amount, Payment Method, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black border outline-none text-rose-500 ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Due / Credit">Due / Credit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={expenseForm.paymentStatus}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentStatus: e.target.value as any })}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending (Due)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Notes / Bill Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #9283, Received by kitchen chef"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Vendor */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">
                  {editingVendor ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
              </div>
              <button 
                onClick={() => setIsVendorModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Supplier / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nagpur Dairy Cooperative"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Address / Market Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sitabuldi Milk Market, Nagpur"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Delivery Notes / Schedule
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning 6:30 AM delivery of cow milk"
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
