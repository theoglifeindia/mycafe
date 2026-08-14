
import React, { useState, useMemo } from 'react';
import { Order, AppSettings, BusinessProfile, Customer } from '../types.ts';
import { db } from '../services/db.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { 
  PieChart, TrendingUp, Download, Calendar, ArrowRight, 
  Wallet, Banknote, Tag, Receipt, ShoppingBag, ArrowUpRight,
  Filter, Search, Clock, Smartphone, Users, User
} from 'lucide-react';

interface ReportsProps {
  orders: Order[];
  settings: AppSettings;
  profile: BusinessProfile;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

const Reports: React.FC<ReportsProps> = ({ orders = [], settings, profile }) => {
  const [mainTab, setMainTab] = useState<'sales' | 'customers'>('sales');
  const [customerSearch, setCustomerSearch] = useState('');
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle predefined range selection
  const setRange = (type: 'weekly' | 'monthly') => {
    setReportType(type);
    const end = new Date();
    const start = new Date();
    if (type === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else {
      start.setMonth(end.getMonth() - 1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const filteredOrders = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    
    return orders.filter(o => 
      o.status === 'paid' && 
      o.createdAt >= start && 
      o.createdAt <= end
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const upiSales = filteredOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.total, 0);
    const cashSales = filteredOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.total, 0);
    
    return { totalRevenue, totalOrders, avgOrderValue, totalDiscounts, upiSales, cashSales };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dayMap[date] = (dayMap[date] || 0) + o.total;
    });
    
    return Object.entries(dayMap).map(([date, amount]) => ({ date, amount })).reverse();
  }, [filteredOrders]);

  const pieData = [
    { name: 'UPI', value: metrics.upiSales },
    { name: 'Cash', value: metrics.cashSales },
    { name: 'Others', value: metrics.totalRevenue - (metrics.upiSales + metrics.cashSales) }
  ].filter(d => d.value > 0);

  const exportCSV = () => {
    const headers = ['Order ID', 'Table', 'Date', 'Items Count', 'Payment', 'Subtotal', 'Discount', 'Total'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.tableName,
      new Date(o.createdAt).toLocaleString(),
      o.items.length,
      o.paymentMethod,
      o.subtotal,
      o.discount,
      o.total
    ]);
    
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const bName = (settings?.businessName || settings?.invoiceHeader || 'RockBottom').replace(/[^a-zA-Z0-9]/g, '');
    a.download = `${bName}_Report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const customers = useMemo(() => {
    try {
      return db.getCustomers();
    } catch {
      return [];
    }
  }, [mainTab]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) || 
      (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  const exportCustomersCSV = () => {
    const headers = ['Customer Name', 'Phone Number', 'Total Visits', 'Total Spent (INR)', 'Last Visit'];
    const rows = filteredCustomers.map(c => [
      `"${c.name || 'N/A'}"`,
      `"${c.phone || 'N/A'}"`,
      c.totalVisits || 1,
      (c.totalSpent || 0).toFixed(2),
      c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Customer_Master_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isDark = settings.theme === 'Midnight';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Section / Module Tabs */}
      <div className={`flex p-1.5 rounded-2xl w-fit border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-200'
      }`}>
        <button
          onClick={() => setMainTab('sales')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'sales' 
              ? isDark ? 'bg-blue-600 shadow-sm text-white' : 'bg-white shadow-sm text-blue-600' 
              : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> Sales Analytics
        </button>
        <button
          onClick={() => setMainTab('customers')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'customers' 
              ? isDark ? 'bg-blue-600 shadow-sm text-white' : 'bg-white shadow-sm text-blue-600' 
              : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" /> Customer Master ({customers.length})
        </button>
      </div>

      {mainTab === 'customers' ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div>
              <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <Users className="w-5 h-5 text-blue-500" /> Customer List Report
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Directory of all customers captured during billing & settlements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className={`pl-9 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>
              <button
                onClick={exportCustomersCSV}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className={`rounded-3xl shadow-sm border overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No customers recorded yet.</p>
                <p className="text-xs mt-1 text-gray-400">
                  Customer records will automatically populate when printing bills or settling orders in Dine In.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${
                      isDark ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                      <th className="p-4 pl-6">Customer Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4 text-center">Visits</th>
                      <th className="p-4 text-right">Total Spent</th>
                      <th className="p-4 pr-6 text-right">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs font-bold ${
                    isDark ? 'divide-slate-800 text-slate-100' : 'divide-gray-50 text-gray-800'
                  }`}>
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-gray-50/80 transition-colors'}>
                        <td className="p-4 pl-6 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <span className={isDark ? 'text-white' : 'text-gray-900'}>{c.name || 'N/A'}</span>
                        </td>
                        <td className={`p-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{c.phone || 'N/A'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {c.totalVisits || 1}
                          </span>
                        </td>
                        <td className="p-4 text-right text-emerald-500 font-black">
                          ₹{(c.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className={`p-4 pr-6 text-right text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
      <div className={`p-6 rounded-3xl shadow-sm border flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        <div>
          <h2 className={`text-2xl font-black tracking-tight flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <PieChart className="w-6 h-6 mr-3 text-blue-500" />
            Sales Intelligence
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Analyzing performance from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex p-1.5 rounded-2xl border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <button 
              onClick={() => setRange('weekly')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                reportType === 'weekly' 
                  ? isDark ? 'bg-blue-600 shadow-sm text-white' : 'bg-white shadow-sm text-blue-600' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setRange('monthly')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                reportType === 'monthly' 
                  ? isDark ? 'bg-blue-600 shadow-sm text-white' : 'bg-white shadow-sm text-blue-600' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setReportType('custom')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                reportType === 'custom' 
                  ? isDark ? 'bg-blue-600 shadow-sm text-white' : 'bg-white shadow-sm text-blue-600' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400'
              }`}
            >
              Custom
            </button>
          </div>

          <div className={`flex items-center space-x-3 border rounded-2xl p-1.5 shadow-sm ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center space-x-2 px-3">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setReportType('custom'); }}
                className={`text-[10px] font-bold outline-none ${isDark ? 'bg-transparent text-white' : 'text-gray-600'}`}
              />
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <div className="flex items-center space-x-2 px-3">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setReportType('custom'); }}
                className={`text-[10px] font-bold outline-none ${isDark ? 'bg-transparent text-white' : 'text-gray-600'}`}
              />
            </div>
          </div>

          <button 
            onClick={exportCSV}
            className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 cursor-pointer"
            title="Export Report"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Gross Revenue', value: `₹${metrics.totalRevenue.toFixed(2)}`, icon: Wallet, color: isDark ? 'text-blue-400' : 'text-blue-600', bg: isDark ? 'bg-blue-950/60' : 'bg-blue-50' },
          { label: 'Total Orders', value: metrics.totalOrders, icon: ShoppingBag, color: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-950/60' : 'bg-emerald-50' },
          { label: 'Avg Order Value', value: `₹${metrics.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: isDark ? 'text-indigo-400' : 'text-indigo-600', bg: isDark ? 'bg-indigo-950/60' : 'bg-indigo-50' },
          { label: 'Total Discounts', value: `₹${metrics.totalDiscounts.toFixed(2)}`, icon: Tag, color: isDark ? 'text-rose-400' : 'text-red-600', bg: isDark ? 'bg-rose-950/60' : 'bg-red-50' },
        ].map((m, idx) => (
          <div key={idx} className={`p-6 rounded-3xl shadow-sm border flex items-center space-x-5 group hover:shadow-xl transition-all duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className={`p-4 ${m.bg} ${m.color} rounded-2xl transition-transform group-hover:scale-110`}>
              <m.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className={`lg:col-span-2 p-8 rounded-3xl shadow-sm border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>Revenue Growth</h3>
            </div>
            <div className={`flex items-center text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
              isDark ? 'text-emerald-400 bg-emerald-950/60' : 'text-emerald-500 bg-emerald-50'
            }`}>
              <ArrowUpRight className="w-3 h-3 mr-1" /> Trending Up
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#94a3b8' }}
                />
                <YAxis 
                  fontSize={10} 
                  fontWeight={700} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: isDark ? '1px solid #334155' : 'none', 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '12px' 
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={`p-8 rounded-3xl shadow-sm border flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center space-x-3 mb-10">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>Payment Split</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie 
                    data={pieData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={8} 
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-8">
              {pieData.map((entry, index) => (
                <div key={entry.name} className={`flex justify-between items-center px-4 py-3 rounded-2xl border ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{entry.name}</span>
                  </div>
                  <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{entry.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit List */}
      <div className={`rounded-3xl shadow-sm border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
      }`}>
        <div className={`p-8 border-b flex justify-between items-center ${
          isDark ? 'border-slate-800' : 'border-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>Report Transactions</h3>
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {filteredOrders.length} Completed Records
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`text-[9px] font-black uppercase tracking-widest ${
              isDark ? 'bg-slate-850 text-slate-400' : 'bg-gray-50/50 text-gray-400'
            }`}>
              <tr>
                <th className="px-8 py-5">BILL NO</th>
                <th className="px-8 py-5">TABLE</th>
                <th className="px-8 py-5">DATE & TIME</th>
                <th className="px-8 py-5">METHOD</th>
                <th className="px-8 py-5">TOTAL</th>
                <th className="px-8 py-5 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-50'}`}>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center opacity-30">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">No data available for selected range</p>
                  </td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-gray-50/50 transition-colors'}>
                  <td className={`px-8 py-5 font-black text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.id}</td>
                  <td className={`px-8 py-5 font-bold text-xs uppercase tracking-tight ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{order.tableName}</td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      <Clock className="w-3 h-3 mr-1.5 opacity-60" />
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      {order.paymentMethod === 'Cash' ? <Banknote className="w-3 h-3 mr-2 text-emerald-500" /> : <Smartphone className="w-3 h-3 mr-2 text-blue-500" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-black text-blue-500 text-xs">₹{order.total.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50' : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Reports;
