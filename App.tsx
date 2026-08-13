
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import DineIn from './components/DineIn.tsx';
import MenuMgmt from './components/MenuMgmt.tsx';
import Profile from './components/Profile.tsx';
import TableSetup from './components/TableSetup.tsx';
import Settings from './components/Settings.tsx';
import OrderHistory from './components/OrderHistory.tsx';
import Reports from './components/Reports.tsx';
import Help from './components/Help.tsx';
import Login from './components/Login.tsx';
import { db } from './services/db.ts';
import { MenuItem, Table, Order, BusinessProfile, AppSettings } from './types.ts';
import { INITIAL_SETTINGS } from './constants.tsx';
import { Clock, Calendar, Bell, User as UserIcon, CheckCircle2, AlertTriangle, PieChart as PieChartIcon, Loader2, Tag, Sparkles, LogOut } from 'lucide-react';

const OFFERS = [
  "🎉 Happy Hour Special: 20% OFF on all Coffee & Beverages from 4 PM to 7 PM!",
  "🔥 Weekend Event: Live Acoustic Music Session this Saturday at 8 PM!",
  "⭐ Combo Deal: Buy Any Sandwich + Smoothie & Get 15% OFF!",
  "📢 Chef's Special Gourmet Pasta now available on the Dine In menu!"
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pos_auth_user') === 'true';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [offerIndex, setOfferIndex] = useState(0);

  const handleLogin = useCallback((u: string, p: string) => {
    if (u === 'admin' && p === 'admin') {
      localStorage.setItem('pos_auth_user', 'true');
      setIsAuthenticated(true);
      window.history.pushState({ auth: true }, '', window.location.pathname);
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pos_auth_user');
    setIsAuthenticated(false);
    window.history.replaceState({ auth: false }, '', window.location.pathname);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (localStorage.getItem('pos_auth_user') !== 'true') {
        setIsAuthenticated(false);
        window.history.replaceState({ auth: false }, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOfferIndex((prev) => (prev + 1) % OFFERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Establishing connection taking longer than expected. Proceeding...");
        setLoading(false);
      }
    }, 5000);

    const initApp = async () => {
      try {
        const isConnected = await db.testConnection();
        setDbStatus(isConnected ? 'connected' : 'error');
        if (!isConnected) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setDbStatus('error');
        setLoading(false);
      }
    };

    initApp();

    const unsubTables = db.subscribeToTables((data) => {
      setTables(data);
      setLoading(false);
      setDbStatus('connected');
    });
    
    const unsubMenu = db.subscribeToMenu((data) => setMenu(data));
    const unsubOrders = db.subscribeToOrders((data) => setOrders(data));
    const unsubSettings = db.subscribeToSettings((data) => setSettings(data));

    db.getProfile().then(p => {
      if (p) setProfile(p);
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsubTables();
      unsubMenu();
      unsubOrders();
      unsubSettings();
      clearInterval(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    const bName = settings.businessName || settings.invoiceHeader || 'Rock Bottom';
    document.title = `${bName} POS`;
  }, [settings.businessName, settings.invoiceHeader]);

  const handleOrderComplete = useCallback(async (order: Order, tableId: string) => {
    try {
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === order.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = order;
          return updated;
        }
        return [order, ...prev];
      });
      await db.createOrder(order);
    } catch (err) {
      console.error("Order completion failed:", err);
    }
  }, []);

  const handleTableUpdate = useCallback(async (tableId: string, updates: Partial<Table>) => {
    try {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
      await db.updateTable(tableId, updates);
    } catch (err) {
      console.error("Table update failed:", err);
    }
  }, []);

  const handleTableDelete = useCallback(async (tableId: string) => {
    try {
      await db.deleteTable(tableId);
    } catch (err) {
      console.error("Table deletion failed:", err);
    }
  }, []);

  const handleTableSetupUpdate = useCallback(async (updatedTables: Table[]) => {
    try {
      await db.setTables(updatedTables);
    } catch (err) {
      console.error("Table setup failed:", err);
      alert("Database Error: Failed to update table configuration.");
    }
  }, []);

  const handleMenuUpdate = useCallback(async (updatedMenu: MenuItem[]) => {
    try {
      setMenu(updatedMenu);
      await db.updateMenu(updatedMenu);
    } catch (err) {
      console.error("Menu update failed:", err);
      alert("Database Error: Failed to update menu.");
    }
  }, []);

  const handleProfileSave = useCallback(async (updatedProfile: BusinessProfile) => {
    try {
      await db.updateProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Database Error: Failed to save profile.");
    }
  }, []);

  const handleSettingsSave = useCallback(async (updatedSettings: AppSettings) => {
    try {
      await db.updateSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      console.error("Settings update failed:", err);
      alert("Database Error: Failed to save settings.");
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{settings.businessName || 'Rock Bottom'} POS</h2>
            <p className="text-sm text-gray-400 font-bold animate-pulse mt-1">Establishing Secure Cloud Link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} settings={settings} profile={profile || undefined} />;
  }

  const getThemeClass = () => {
    switch (settings.theme) {
      case 'Midnight': return 'bg-slate-950 text-slate-100';
      case 'Eco-Green': return 'bg-emerald-50 text-gray-900';
      case 'Modern Minimalist': return 'bg-white text-gray-900';
      default: return 'bg-gray-50 text-gray-900';
    }
  };

  const isDark = settings.theme === 'Midnight';
  const bName = settings.businessName || settings.invoiceHeader || 'Cafe Rock Bottom';
  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
  const totalTablesCount = tables.length;

  const currentSelectedTable = tables.find(t => t.id === selectedTableId);
  const activeTableName = currentSelectedTable ? currentSelectedTable.name : undefined;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${getThemeClass()}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings} 
        profile={profile || undefined} 
        activeTableName={activeTableName}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 relative">
        <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          {/* 1. Cloud Live & System Status (Replaces duplicate business name) */}
          <div className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider ${
              dbStatus === 'connected'
                ? isDark ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200/80 text-emerald-700 shadow-xs'
                : isDark ? 'bg-rose-950/50 border-rose-800/60 text-rose-400' : 'bg-rose-50 border-rose-200/80 text-rose-700 shadow-xs'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  dbStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span>{dbStatus === 'connected' ? 'Cloud Live' : 'Offline Mode'}</span>
            </div>
            <div className="text-left hidden sm:block border-l border-gray-100 pl-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">POS Terminal</div>
              <div className="text-xs font-black text-blue-600">v2.5 Pro</div>
            </div>
          </div>

          {/* 2. Running Offers & Events Ticker Slider */}
          <div className={`flex-1 flex items-center p-3 rounded-2xl border overflow-hidden relative shadow-sm transition-all ${
            isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-200/60'
          }`}>
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 shadow-sm mr-3">
              <Tag className="w-3.5 h-3.5 animate-bounce" />
              <span>Offers & Events</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-6 flex items-center">
              <div key={offerIndex} className={`text-xs font-bold transition-all duration-500 animate-fadeIn whitespace-nowrap overflow-hidden text-ellipsis flex items-center ${
                isDark ? 'text-amber-300' : 'text-amber-950'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-2 flex-shrink-0 animate-pulse" />
                <span>{OFFERS[offerIndex]}</span>
              </div>
            </div>
          </div>

          {/* 3. Notification of Table Status & Live Time/Profile */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('dinein')}
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                isDark ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-gray-100 shadow-sm hover:border-blue-300'
              }`}
              title="Click to view Dine In Floor Plan"
            >
              <div className="relative">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                {occupiedTablesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping" />
                )}
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Tables</div>
                <div className="text-xs font-black">
                  <span className={occupiedTablesCount > 0 ? "text-amber-600" : "text-emerald-600"}>
                    {occupiedTablesCount} Occupied
                  </span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className={isDark ? "text-slate-400" : "text-gray-500"}>{totalTablesCount} Total</span>
                </div>
              </div>
            </button>

            {/* Time & User */}
            <div className={`p-3 rounded-2xl border flex items-center space-x-3 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-100 shadow-sm text-gray-800'
            }`}>
              <div className="text-right">
                <div className="text-[11px] font-black flex items-center justify-end tracking-tight tabular-nums leading-none">
                  <span className="min-w-[62px] inline-block">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <Clock className="w-3.5 h-3.5 ml-1.5 text-blue-500 opacity-80 flex-shrink-0" />
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest flex items-center justify-end mt-1 leading-none ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('profile')}
                title="User Profile"
                className={`p-2 rounded-xl border transition-all ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-blue-200 bg-blue-50' 
                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-4 h-4" />
              </button>

              <button 
                onClick={handleLogout}
                title="Sign Out / Logout"
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark ? 'bg-rose-950/40 border-rose-800 text-rose-400 hover:bg-rose-900/60' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1500px] mx-auto">
          {activeTab === 'dashboard' && <Dashboard orders={orders} settings={settings} />}
          {activeTab === 'dinein' && profile && (
            <DineIn 
              tables={tables} 
              menu={menu} 
              orders={orders}
              profile={profile}
              settings={settings}
              onOrderComplete={handleOrderComplete} 
              onTableUpdate={handleTableUpdate} 
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
            />
          )}
          {activeTab === 'menu' && <MenuMgmt menu={menu} onUpdate={handleMenuUpdate} />}
          {activeTab === 'tablesetup' && (
            <TableSetup 
              tables={tables} 
              onUpdate={handleTableSetupUpdate} 
              onDeleteTable={handleTableDelete} 
            />
          )}
          {activeTab === 'history' && profile && (
            <OrderHistory orders={orders} settings={settings} profile={profile} />
          )}
          {activeTab === 'reports' && profile && (
            <Reports orders={orders} settings={settings} profile={profile} />
          )}
          {activeTab === 'settings' && profile && (
            <Settings 
              settings={settings} 
              profile={profile}
              onSaveSettings={handleSettingsSave}
              onSaveProfile={handleProfileSave}
            />
          )}
          {activeTab === 'profile' && profile && <Profile profile={profile} onSave={handleProfileSave} />}
          {activeTab === 'help' && <Help settings={settings} profile={profile} />}
        </div>
      </main>
    </div>
  );
};

export default App;
