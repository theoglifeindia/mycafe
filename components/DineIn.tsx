
import React, { useState, useMemo } from 'react';
import { Table, MenuItem, Order, OrderItem, PaymentMethod, BusinessProfile, AppSettings } from '../types.ts';
import { db } from '../services/db.ts';
import { Plus, Minus, X, Check, ArrowLeft, Trash2, Search, Layers, CreditCard, Banknote, Smartphone, Tag, ReceiptText, Calculator, Printer, Clock, Maximize2, Minimize2, AlertTriangle, User, Phone, UserCheck } from 'lucide-react';

interface DineInProps {
  tables: Table[];
  menu: MenuItem[];
  orders: Order[];
  profile: BusinessProfile;
  settings: AppSettings;
  onOrderComplete: (order: Order, tableId: string) => void;
  onTableUpdate: (tableId: string, updates: Partial<Table>) => void;
  selectedTableId?: string | null;
  onSelectTable?: (tableId: string | null) => void;
}

type ButtonFeedback = 'idle' | 'success';

const DineIn: React.FC<DineInProps> = ({ 
  tables, 
  menu, 
  orders, 
  profile, 
  settings, 
  onOrderComplete, 
  onTableUpdate,
  selectedTableId: propSelectedTableId,
  onSelectTable
}) => {
  const [internalSelectedTableId, setInternalSelectedTableId] = useState<string | null>(null);
  const selectedTableId = propSelectedTableId !== undefined ? propSelectedTableId : internalSelectedTableId;
  const setSelectedTableId = (id: string | null) => {
    setInternalSelectedTableId(id);
    if (onSelectTable) onSelectTable(id);
  };
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [punchState, setPunchState] = useState<ButtonFeedback>('idle');
  const [printState, setPrintState] = useState<ButtonFeedback>('idle');
  const [settleState, setSettleState] = useState<ButtonFeedback>('idle');
  const [miscState, setMiscState] = useState<ButtonFeedback>('idle');

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isExitGuardOpen, setIsExitGuardOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [custNameInput, setCustNameInput] = useState('');
  const [custPhoneInput, setCustPhoneInput] = useState('');
  const [custError, setCustError] = useState('');
  const [custTarget, setCustTarget] = useState<'print' | 'settle' | null>(null);
  const [isBillReceiptModalOpen, setIsBillReceiptModalOpen] = useState(false);

  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI');
  const [cashSplit, setCashSplit] = useState<number>(0);
  const [upiSplit, setUpiSplit] = useState<number>(0);

  const selectedTable = useMemo(() => {
    return tables.find(t => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  const categories = useMemo(() => {
    const items = menu || [];
    const cats = Array.from(new Set(items.map(item => item?.category).filter(Boolean)));
    return ['All', ...cats];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const items = menu || [];
    return items.filter(item => {
      if (!item) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const tablesBySection = useMemo(() => {
    const sections: Record<string, Table[]> = {};
    tables.forEach(table => {
      const sec = table.section || 'General';
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(table);
    });
    return sections;
  }, [tables]);

  const calculateDurationMins = (startTime: number | undefined | null) => {
    if (!startTime) return 0;
    const diff = Date.now() - startTime;
    return Math.max(1, Math.floor(diff / 60000));
  };

  const handleTableClick = (table: Table) => {
    const existingStartTime = table.sessionStartTime || Date.now();
    setSessionStartTime(existingStartTime);
    setSelectedTableId(table.id);
    if (table.status !== 'vacant') {
      const existingOrder = orders.find(o => 
        (o.id === table.currentOrderId) || 
        (o.tableId === table.id && (o.status === 'pending' || o.status === 'billed'))
      );
      if (existingOrder) {
        setCart([...existingOrder.items]);
        setDiscount(existingOrder.discount || 0);
        setIsDirty(false);
        return;
      }
    }
    setCart([]); 
    setIsDirty(false);
    setDiscount(0);
  };

  const addToCart = (item: MenuItem | { id: string, name: string, price: number }) => {
    setIsDirty(true);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price || 0, qty: 1 }];
    });
  };

  const handleMiscCharge = () => {
    if (!selectedTableId) return;
    const MISC_ID = 'MISC';
    setIsDirty(true);
    setCart(prev => {
      const existing = prev.find(i => i.id === MISC_ID || i.name.trim().toUpperCase() === 'MISC');
      if (existing) {
        return prev;
      }
      return [...prev, { id: MISC_ID, name: 'MISC', price: 0, qty: 1 }];
    });
    setMiscState('success');
    setTimeout(() => setMiscState('idle'), 2000);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setIsDirty(true);
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        // Only reduce the quantity till 1, but should not delete the menu item itself.
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const updateCartItemPrice = (itemId: string, newPrice: number) => {
    setIsDirty(true);
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, price: newPrice } : i));
  };

  const removeFromCart = (itemId: string) => {
    setIsDirty(true);
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    const total = subtotal - (Number(discount) || 0);
    return { subtotal, total, discount: Number(discount) || 0 };
  };

  const handlePlaceOrder = async (status: 'pending' | 'billed' | 'paid', payment: PaymentMethod = '-') => {
    if (!selectedTableId || !selectedTable || cart.length === 0) return;
    const { subtotal, total } = calculateTotal();
    const orderId = selectedTable.currentOrderId || `#${Math.floor(Math.random() * 10000)}`;
    const custName = selectedTable.customerName || custNameInput.trim();
    const custPhone = selectedTable.customerPhone || custPhoneInput.trim();

    const order: Order = {
      id: orderId,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      items: [...cart],
      subtotal,
      tax: 0,
      discount: Number(discount) || 0,
      total,
      status: status,
      paymentMethod: payment,
      createdAt: Date.now(),
      cashAmount: payment === 'Split' ? cashSplit : (payment === 'Cash' ? total : 0),
      upiAmount: payment === 'Split' ? upiSplit : (payment === 'UPI' ? total : 0),
      customerName: custName,
      customerPhone: custPhone
    };
    onOrderComplete(order, selectedTable.id);
    
    const isSettled = status === 'paid';
    const tableStatus = isSettled ? 'vacant' : (status === 'billed' ? 'billed' : 'occupied');
    
    onTableUpdate(selectedTable.id, { 
      status: tableStatus, 
      orderValue: isSettled ? 0 : total,
      sessionStartTime: isSettled ? null as any : (selectedTable.sessionStartTime || sessionStartTime || Date.now()),
      currentOrderId: isSettled ? null as any : orderId,
      customerName: isSettled ? null as any : custName,
      customerPhone: isSettled ? null as any : custPhone
    });

    setIsDirty(false);
    if (status === 'pending') {
      setPunchState('success');
      setTimeout(() => setPunchState('idle'), 1500);
    }
    if (isSettled) {
      if (custName || custPhone) {
        try {
          db.saveOrUpdateCustomer(custName, custPhone, total);
        } catch (e) {
          console.error('Failed to update customer statistics:', e);
        }
      }
      setCart([]);
      setSelectedTableId(null);
      setSessionStartTime(null);
      setIsFullscreen(false);
    }
  };

  const handleClearOrder = () => {
    if (!selectedTableId) return;
    onTableUpdate(selectedTableId, {
      status: 'vacant',
      orderValue: 0,
      sessionStartTime: null as any,
      currentOrderId: null as any,
      customerName: null as any,
      customerPhone: null as any
    });
    setCart([]);
    setDiscount(0);
    setIsDirty(false);
    setIsClearModalOpen(false);
    setSelectedTableId(null);
    setSessionStartTime(null);
    setIsFullscreen(false);
  };

  const printBill = () => {
    if (!selectedTable || cart.length === 0) return;
    setPrintState('success');
    setIsDirty(false); 
    setTimeout(() => setPrintState('idle'), 2000);

    // Update order status and table status to 'billed'
    handlePlaceOrder('billed');

    // Display the in-app Bill Receipt preview modal only
    setIsBillReceiptModalOpen(true);
  };

  const handleSettle = () => {
    const { total } = calculateTotal();
    if (paymentMode === 'Split' && (cashSplit + upiSplit) < total) {
      alert(`The split amounts must total ₹${total.toFixed(2)}`);
      return;
    }
    setSettleState('success');
    handlePlaceOrder('paid', paymentMode);
    setTimeout(() => {
      setIsSettleModalOpen(false);
      setSettleState('idle');
    }, 1000);
  };

  const handlePrintClick = () => {
    if (!selectedTable) return;
    if (cart.length === 0) {
      alert('Cart is empty. Please select menu items to print bill.');
      return;
    }
    if (selectedTable.customerName || selectedTable.customerPhone) {
      printBill();
    } else {
      setCustNameInput('');
      setCustPhoneInput('');
      setCustError('');
      setCustTarget('print');
      setIsCustModalOpen(true);
    }
  };

  const handleSettleClick = () => {
    if (!selectedTable) return;
    if (cart.length === 0) {
      alert('Cart is empty. Please select menu items before settling table.');
      return;
    }
    if (selectedTable.customerName || selectedTable.customerPhone) {
      const { total } = calculateTotal();
      setUpiSplit(total);
      setCashSplit(0);
      setIsSettleModalOpen(true);
    } else {
      setCustNameInput('');
      setCustPhoneInput('');
      setCustError('');
      setCustTarget('settle');
      setIsCustModalOpen(true);
    }
  };

  const saveCustomerAndProceed = (skip: boolean = false) => {
    if (!skip) {
      const phone = custPhoneInput.trim();
      if (phone && !/^\d{10}$/.test(phone)) {
        setCustError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setCustError('');
    setIsCustModalOpen(false);

    let name = custNameInput.trim();
    let phone = custPhoneInput.trim();

    if (skip) {
      name = '';
      phone = '';
      setCustNameInput('');
      setCustPhoneInput('');
    } else if (name || phone) {
      const { total } = calculateTotal();
      if (selectedTable) {
        onTableUpdate(selectedTable.id, { customerName: name, customerPhone: phone });
      }
      try {
        db.saveOrUpdateCustomer(name, phone, total);
      } catch (e) {
        console.error('Failed to save customer:', e);
      }
    }

    if (custTarget === 'print') {
      printBill();
    } else if (custTarget === 'settle') {
      const { total } = calculateTotal();
      setUpiSplit(total);
      setCashSplit(0);
      setIsSettleModalOpen(true);
    }
    setCustTarget(null);
  };

  const handleExitAttempt = () => {
    setIsCustModalOpen(false);
    setIsBillReceiptModalOpen(false);
    setIsSettleModalOpen(false);
    setCustTarget(null);
    if (isDirty && cart.length > 0) {
      setIsExitGuardOpen(true);
    } else {
      setSelectedTableId(null);
      setSessionStartTime(null);
      setCart([]);
      setIsFullscreen(false);
    }
  };

  const formatPrice = (val: number | null | undefined) => {
    return (Number(val) || 0).toFixed(2);
  };

  const isDark = settings?.theme === 'Midnight';

  if (selectedTableId && selectedTable) {
    const totals = calculateTotal();
    const duration = calculateDurationMins(sessionStartTime);
    
    return (
      <div className={`flex overflow-hidden transition-all duration-300 animate-in fade-in ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
      } ${
        isFullscreen ? 'fixed inset-0 z-[500] h-screen w-screen' : 'h-[calc(100vh-180px)] w-full'
      }`}>
        <div className={`flex-1 p-6 overflow-y-auto scrollbar-hide flex flex-col min-w-0 border-r transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg shadow-sm ${
                isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-100 text-blue-600'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Select Items</h2>
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                  <Clock className="w-3 h-3 mr-1" />
                  Table {selectedTable.name} • Session {duration} Min
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 border rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-600'
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleExitAttempt}
                className={`px-4 py-2 border rounded-xl flex items-center text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Change Table
              </button>
            </div>
          </div>

          <div className={`mb-6 sticky top-0 py-2 z-20 backdrop-blur-sm border-b transition-all ${
            isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-100'
          }`}>
            <div className="flex flex-col gap-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search item in catalog..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div className="flex flex-wrap gap-2 py-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
            {filteredMenu.map(item => (
              <div key={item.id} className={`rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all group relative overflow-hidden border border-b-4 ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500' 
                  : 'bg-white border-gray-100 hover:border-blue-100'
              }`}>
                <div className="flex justify-between items-start mb-2">
                   <div className="flex-1 pr-2">
                    <h4 className={`text-sm font-bold leading-tight transition-colors ${
                      isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'
                    }`}>{item.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block tracking-widest">{item.category}</span>
                   </div>
                   <div className={`w-3.5 h-3.5 border-2 ${item.foodType === 'veg' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} rounded flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                   </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{formatPrice(item.price)}</div>
                  <button 
                    onClick={() => addToCart(item)}
                    className="p-2 bg-blue-600/15 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`w-[320px] flex flex-col border-l shadow-2xl relative z-30 h-full overflow-hidden flex-shrink-0 transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 transition-all ${
            isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              <ReceiptText className="w-5 h-5 text-blue-500" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm ${
                    isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {selectedTable.name}
                  </span>
                  <h3 className={`text-xs font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Current Order</h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-black text-blue-400 uppercase flex items-center">
                    <Clock className="w-2.5 h-2.5 mr-1" /> {duration} Min
                  </span>
                  {selectedTable.customerName && (
                    <span className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">
                      • {selectedTable.customerName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${
              selectedTable.status === 'vacant' ? 'bg-green-100 text-green-700' : 
              selectedTable.status === 'billed' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              {selectedTable.status}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Calculator className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Cart is Empty</p>
                <p className="text-[9px] text-gray-400 mt-1">Select items to begin</p>
              </div>
            ) : (
              cart.map(item => {
                const isEditable = item.name.toUpperCase().includes('MISC') || item.name.toUpperCase().includes('OTHER CHARGES');
                return (
                  <div key={item.id} className={`p-3 rounded-xl border shadow-sm flex items-center justify-between animate-in slide-in-from-right-2 duration-200 transition-all ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'
                  }`}>
                    <div className="flex-1 mr-2">
                      <h5 className={`text-[11px] font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.name}</h5>
                      {isEditable ? (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-[10px] font-black text-blue-400">₹</span>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateCartItemPrice(item.id, isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            className={`w-16 text-[10px] font-black rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 tabular-nums border ${
                              isDark ? 'bg-slate-900 border-slate-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="text-[10px] font-black text-blue-500 mt-0.5">₹{formatPrice(item.price)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center rounded-lg border p-0.5 ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <button onClick={() => updateCartQty(item.id, -1)} className={`p-1 rounded transition-all cursor-pointer ${
                          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white hover:shadow-sm text-gray-400'
                        }`}><Minus className="w-3 h-3" /></button>
                        <span className={`w-6 text-center text-[10px] font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className={`p-1 rounded transition-all cursor-pointer ${
                          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white hover:shadow-sm text-gray-400'
                        }`}><Plus className="w-3 h-3" /></button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={`border-t shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] flex-shrink-0 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>₹{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Tag className="w-3 h-3 mr-1.5" /> Discount
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">₹</span>
                    <input 
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        setDiscount(Math.max(0, parseFloat(e.target.value) || 0));
                        setIsDirty(true);
                      }}
                      className={`w-16 text-right text-[11px] font-black rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 border ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-rose-400 focus:ring-rose-500' 
                          : 'bg-red-50 border-red-100 text-red-600 focus:ring-red-200'
                      }`}
                    />
                  </div>
                </div>
                <div className={`pt-2 border-t border-dashed flex justify-between items-center ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                }`}>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>Payable</span>
                  <span className="text-xl font-black text-blue-500">₹{formatPrice(totals.total)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => handlePlaceOrder('pending')}
                  className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    punchState === 'success' ? 'bg-emerald-600 text-white' : 'bg-yellow-500 text-yellow-950 hover:bg-yellow-400'
                  }`}
                >
                  {punchState === 'success' ? <><Check className="w-4 h-4" /> Punched!</> : <><ReceiptText className="w-4 h-4" /> Punch Order</>}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handlePrintClick}
                    className={`py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      printState === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Bill
                  </button>
                  <button 
                    onClick={handleSettleClick}
                    className={`py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                      settleState === 'success' ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Settle
                  </button>
                </div>
                <div className={`flex items-center gap-2 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                   <button 
                    onClick={() => setIsClearModalOpen(true)}
                    className="flex-1 py-1.5 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    Clear Order
                  </button>
                  <div className={`w-px h-3 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                  <button 
                    onClick={handleMiscCharge}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                      miscState === 'success' ? 'text-emerald-500 bg-emerald-500/10' : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    Misc Charge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Settle Payment */}
        {isSettleModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-[600] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className={`p-6 border-b flex justify-between items-center ${
                isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Settle Payment</h3>
                <button onClick={() => setIsSettleModalOpen(false)} className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-400'
                }`}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-8">
                <div className={`text-center p-6 rounded-2xl border ${
                  isDark ? 'bg-blue-950/40 border-blue-900/50' : 'bg-blue-50 border-blue-100'
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>Payable Amount</p>
                  <p className={`text-4xl font-black tracking-tighter ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>₹{calculateTotal().total.toFixed(2)}</p>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'UPI', icon: Smartphone, label: 'UPI' },
                      { id: 'Cash', icon: Banknote, label: 'Cash' },
                      { id: 'Split', icon: Layers, label: 'Split Pay' },
                      { id: 'Card', icon: CreditCard, label: 'Card' }
                    ].map(method => (
                      <button 
                        key={method.id}
                        onClick={() => setPaymentMode(method.id as PaymentMethod)}
                        className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          paymentMode === method.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : isDark 
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600' 
                              : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                        }`}
                      >
                        <method.icon className={`w-5 h-5 mr-3 ${paymentMode === method.id ? 'text-white' : 'text-blue-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMode === 'Split' && (
                  <div className={`space-y-4 p-5 rounded-2xl border animate-in slide-in-from-top-2 ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Amount (₹)</label>
                      <input 
                        type="number" 
                        value={cashSplit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setCashSplit(val);
                          setUpiSplit(Math.max(0, calculateTotal().total - val));
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI Amount (₹)</label>
                      <input 
                        type="number" 
                        value={upiSplit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUpiSplit(val);
                          setCashSplit(Math.max(0, calculateTotal().total - val));
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleSettle}
                  disabled={settleState === 'success'}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                    settleState === 'success' 
                      ? 'bg-emerald-600 text-white' 
                      : isDark 
                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                        : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {settleState === 'success' ? <><Check className="w-5 h-5 mr-2" /> Done!</> : 'Finalize & Close Table'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Clear Order Confirmation */}
        {isClearModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-[600] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`rounded-3xl w-full max-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className="p-8 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  isDark ? 'bg-rose-950/60 text-rose-400' : 'bg-red-100 text-red-600'
                }`}>
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Clear Current Order?</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                  This will reset table <span className={isDark ? 'text-white' : 'text-gray-800'}>{selectedTable.name}</span> to vacant and permanently delete the current draft.
                </p>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setIsClearModalOpen(false)}
                    className={`flex-1 py-4 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleClearOrder}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Clear Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Exit Guard */}
        {isExitGuardOpen && (
          <div className="fixed inset-0 bg-black/70 z-[600] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`rounded-3xl w-full max-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className="p-8 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Unsaved Changes</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
                  You have items in the cart that haven't been punched. Switching tables will lose these changes.
                </p>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setIsExitGuardOpen(false)}
                    className={`flex-1 py-4 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Stay Here
                  </button>
                  <button 
                    onClick={() => {
                      setIsExitGuardOpen(false);
                      setIsCustModalOpen(false);
                      setIsBillReceiptModalOpen(false);
                      setIsSettleModalOpen(false);
                      setCustTarget(null);
                      setIsDirty(false);
                      setSelectedTableId(null);
                      setSessionStartTime(null);
                      setCart([]);
                      setIsFullscreen(false);
                    }}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Exit Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Information Prompt Modal */}
        {isCustModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-[650] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className={`p-6 border-b flex justify-between items-center ${
                isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <h3 className={`text-base font-black uppercase tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <UserCheck className="w-5 h-5 text-blue-500" /> Customer Details
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Table {selectedTable?.name || 'Selected'}
                  </p>
                </div>
                <button onClick={() => saveCustomerAndProceed(true)} className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-400'
                }`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {custError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{custError}</span>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={custNameInput}
                      onChange={e => {
                        setCustNameInput(e.target.value);
                        if (custError) setCustError('');
                      }}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={custPhoneInput}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCustPhoneInput(val);
                        if (custError) setCustError('');
                      }}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveCustomerAndProceed(true)}
                    className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCustomerAndProceed(false)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Save & Proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Receipt Preview Modal */}
        {isBillReceiptModalOpen && selectedTable && (
          <div className="fixed inset-0 bg-black/70 z-[700] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${
                isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Bill Generated</h3>
                </div>
                <button 
                  onClick={() => setIsBillReceiptModalOpen(false)} 
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="printable-bill-content-active" className="p-6 overflow-y-auto font-mono text-xs text-gray-800 space-y-3 bg-white">
                <div className="text-center space-y-1 border-b pb-3 border-dashed border-gray-300">
                  {settings.showLogoOnBill && settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain mx-auto mb-2" />
                  )}
                  <h4 className="font-bold text-sm text-black">{settings.businessName || profile.ownerName || 'POS System'}</h4>
                  {settings.showAddressOnBill && profile.address && (
                    <p className="text-[11px] text-gray-600 leading-tight">{profile.address}</p>
                  )}
                  {profile.fssai && (
                    <p className="text-[10px] text-gray-500">FSSAI: {profile.fssai}</p>
                  )}
                </div>

                <div className="text-[11px] space-y-0.5 border-b pb-2 border-dashed border-gray-300">
                  <div className="flex justify-between">
                    <span>Bill No: {selectedTable.currentOrderId || `#${Math.floor(Math.random() * 10000)}`}</span>
                    <span>Table: {selectedTable.name}</span>
                  </div>
                  <div>Date: {new Date().toLocaleString()}</div>
                  {(selectedTable.customerName || custNameInput) && (
                    <div className="font-semibold text-black">Customer: {selectedTable.customerName || custNameInput}</div>
                  )}
                  {(selectedTable.customerPhone || custPhoneInput) && (
                    <div className="text-gray-600">Mobile: {selectedTable.customerPhone || custPhoneInput}</div>
                  )}
                </div>

                <table className="w-full text-left text-[11px] border-b pb-2 border-dashed border-gray-300">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Amt (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-1 pr-1 font-sans font-medium">{item.name}</td>
                        <td className="py-1 text-center font-bold">{item.qty}</td>
                        <td className="py-1 text-right font-bold">{(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal().subtotal.toFixed(2)}</span>
                  </div>
                  {calculateTotal().discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₹{calculateTotal().discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-dashed border-gray-400">
                    <span>TOTAL PAYABLE:</span>
                    <span>₹{calculateTotal().total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[10px] text-gray-500">
                  <p className="font-bold">Thank you for dining with us!</p>
                  <p>Please visit again</p>
                </div>
              </div>

              <div className={`p-4 border-t flex gap-3 flex-shrink-0 ${
                isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <button
                  onClick={() => setIsBillReceiptModalOpen(false)}
                  className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const content = document.getElementById('printable-bill-content-active')?.innerHTML;
                    if (!content) return;
                    const printWin = window.open('', '_blank', 'width=380,height=600');
                    if (printWin) {
                      printWin.document.write(`<html><head><title>Print Bill</title><style>body{font-family:monospace;padding:15px;margin:0;}</style></head><body onload="window.print();window.close();">${content}</body></html>`);
                      printWin.document.close();
                    } else {
                      window.print();
                    }
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={`flex justify-between items-center p-8 rounded-3xl shadow-sm border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
      }`}>
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Dine In Floors</h2>
          <div className="flex items-center mt-4 space-x-8">
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2.5 shadow-sm shadow-green-500/30"></div> Vacant
            </div>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2.5 shadow-sm shadow-red-500/30"></div> Occupied
            </div>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2.5 shadow-sm shadow-yellow-500/30"></div> Billed
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-16 pb-20">
        {Object.entries(tablesBySection).map(([section, sectionTables]) => (
          <div key={section} className="space-y-8">
            <div className="flex items-center space-x-5">
              <div className={`p-2.5 rounded-xl shadow-sm ${
                isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{section}</h3>
              <div className={`h-px flex-1 bg-gradient-to-r ${
                isDark ? 'from-slate-800 to-transparent' : 'from-gray-200 to-transparent'
              }`}></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
              {(sectionTables as Table[]).map(table => {
                const duration = calculateDurationMins(table.sessionStartTime);
                const hasSession = table.status !== 'vacant' && table.sessionStartTime;
                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`p-6 h-40 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center space-y-1 shadow-sm relative group overflow-hidden cursor-pointer ${
                      table.status === 'vacant' 
                        ? isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-white border-green-50 hover:border-green-500' : 
                      table.status === 'occupied' 
                        ? isDark ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500' : 'bg-red-50 border-red-50 hover:border-red-500' : 
                        isDark ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-500' : 'bg-yellow-50 border-yellow-50 hover:border-yellow-500'
                    } hover:shadow-2xl hover:-translate-y-2 active:scale-95`}
                  >
                    <span className={`text-3xl font-black tracking-tighter ${
                      table.status === 'vacant' ? (isDark ? 'text-white' : 'text-gray-800') : 
                      table.status === 'occupied' ? (isDark ? 'text-rose-300' : 'text-red-700') : 
                      (isDark ? 'text-amber-300' : 'text-yellow-700')
                    }`}>{table.name}</span>
                    <span className={`text-[9px] uppercase font-black tracking-widest opacity-80 ${
                      table.status === 'vacant' ? (isDark ? 'text-emerald-400' : 'text-green-600') : 
                      table.status === 'occupied' ? (isDark ? 'text-rose-400' : 'text-red-600') : 
                      (isDark ? 'text-amber-400' : 'text-yellow-600')
                    }`}>{table.status}</span>
                    {table.orderValue !== undefined && table.orderValue !== null && table.orderValue > 0 && (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <div className={`px-3 py-1 rounded-2xl text-[10px] font-black ${
                          table.status === 'occupied' 
                            ? isDark ? 'bg-rose-900/40 text-rose-300' : 'bg-red-100 text-red-700' 
                            : isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          ₹{formatPrice(table.orderValue)}
                        </div>
                        {hasSession && (
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${
                            table.status === 'occupied' ? 'text-rose-400/80' : 'text-amber-400/80'
                          }`}>
                            {duration} Min
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`absolute top-0 right-0 w-10 h-10 rounded-bl-3xl transition-opacity opacity-20 group-hover:opacity-100 ${
                      table.status === 'vacant' ? 'bg-emerald-500' : 
                      table.status === 'occupied' ? 'bg-rose-500' : 
                      'bg-amber-500'
                    }`}></div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Customer Information Prompt Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[650] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div>
                <h3 className={`text-base font-black uppercase tracking-tight flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <UserCheck className="w-5 h-5 text-blue-500" /> Customer Details
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Table {selectedTable?.name || 'Selected'}
                </p>
              </div>
              <button onClick={() => saveCustomerAndProceed(true)} className={`p-2 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-400'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {custError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{custError}</span>
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={custNameInput}
                    onChange={e => {
                      setCustNameInput(e.target.value);
                      if (custError) setCustError('');
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Mobile Number (10 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={custPhoneInput}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustPhoneInput(val);
                      if (custError) setCustError('');
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveCustomerAndProceed(true)}
                  className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => saveCustomerAndProceed(false)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save & Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Preview Modal */}
      {isBillReceiptModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-500" />
                <h3 className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Bill Generated</h3>
              </div>
              <button 
                onClick={() => setIsBillReceiptModalOpen(false)} 
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-bill-content" className="p-6 overflow-y-auto font-mono text-xs text-gray-800 space-y-3 bg-white">
              <div className="text-center space-y-1 border-b pb-3 border-dashed border-gray-300">
                {settings.showLogoOnBill && settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain mx-auto mb-2" />
                )}
                <h4 className="font-bold text-sm text-black">{settings.businessName || profile.ownerName || 'POS System'}</h4>
                {settings.showAddressOnBill && profile.address && (
                  <p className="text-[11px] text-gray-600 leading-tight">{profile.address}</p>
                )}
                {profile.fssai && (
                  <p className="text-[10px] text-gray-500">FSSAI: {profile.fssai}</p>
                )}
              </div>

              <div className="text-[11px] space-y-0.5 border-b pb-2 border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span>Bill No: {selectedTable.currentOrderId || `#${Math.floor(Math.random() * 10000)}`}</span>
                  <span>Table: {selectedTable.name}</span>
                </div>
                <div>Date: {new Date().toLocaleString()}</div>
                {(selectedTable.customerName || custNameInput) && (
                  <div className="font-semibold text-black">Customer: {selectedTable.customerName || custNameInput}</div>
                )}
                {(selectedTable.customerPhone || custPhoneInput) && (
                  <div className="text-gray-600">Mobile: {selectedTable.customerPhone || custPhoneInput}</div>
                )}
              </div>

              <table className="w-full text-left text-[11px] border-b pb-2 border-dashed border-gray-300">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-1 pr-1 font-sans font-medium">{item.name}</td>
                      <td className="py-1 text-center font-bold">{item.qty}</td>
                      <td className="py-1 text-right font-bold">{(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{calculateTotal().subtotal.toFixed(2)}</span>
                </div>
                {calculateTotal().discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-₹{calculateTotal().discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-dashed border-gray-400">
                  <span>TOTAL PAYABLE:</span>
                  <span>₹{calculateTotal().total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[10px] text-gray-500">
                <p className="font-bold">Thank you for dining with us!</p>
                <p>Please visit again</p>
              </div>
            </div>

            <div className={`p-4 border-t flex gap-3 flex-shrink-0 ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <button
                onClick={() => setIsBillReceiptModalOpen(false)}
                className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const content = document.getElementById('printable-bill-content')?.innerHTML;
                  if (!content) return;
                  const printWin = window.open('', '_blank', 'width=380,height=600');
                  if (printWin) {
                    printWin.document.write(`<html><head><title>Print Bill</title><style>body{font-family:monospace;padding:15px;margin:0;}</style></head><body onload="window.print();window.close();">${content}</body></html>`);
                    printWin.document.close();
                  } else {
                    window.print();
                  }
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DineIn;
