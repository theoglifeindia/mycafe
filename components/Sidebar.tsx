
import React from 'react';
import { LayoutDashboard, UtensilsCrossed, BookOpen, Settings2, History, PieChart, Store, User, HelpCircle } from 'lucide-react';
import { AppSettings, BusinessProfile } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: AppSettings;
  profile?: BusinessProfile;
  activeTableName?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dinein', label: 'Dine In', icon: UtensilsCrossed },
  { id: 'menu', label: 'Menu Items', icon: BookOpen },
  { id: 'tablesetup', label: 'Table Setup', icon: Store },
  { id: 'history', label: 'Order History', icon: History },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, settings, profile, activeTableName }) => {
  const isDark = settings.theme === 'Midnight';
  const bName = settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Cafe Rock Bottom';
  const logoUrl = settings.logoUrl;

  return (
    <div className={`w-64 h-screen border-r flex flex-col fixed left-0 top-0 transition-colors duration-300 z-50 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      {/* Top Header: Logo (fit 100% width) & Business Name below logo */}
      <div className="p-4 flex flex-col items-center text-center space-y-3">
        <div className={`w-full h-28 ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-50 border-gray-200'
        } border rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-sm`}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain block mx-auto rounded-xl" 
            />
          ) : (
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md my-1">
              {bName.charAt(0) || 'R'}
            </div>
          )}
        </div>
        <div className="w-full text-center space-y-0.5 px-1">
          <h1 className={`text-base font-black leading-tight tracking-tight break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {bName}
          </h1>
          <p className={`text-[10px] uppercase tracking-widest font-extrabold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            POS SYSTEM
          </p>
          {activeTableName && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Current Table: {activeTableName}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 mt-2 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
                : isDark 
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className={`p-3.5 mt-auto border-t flex items-center ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
        <div className={`p-2.5 rounded-xl flex items-center space-x-2.5 w-full overflow-hidden ${isDark ? 'bg-slate-800/50' : 'bg-blue-50'}`}>
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            AD
          </div>
          <div className="truncate">
            <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>Admin</p>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-tighter">Terminal #01</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
