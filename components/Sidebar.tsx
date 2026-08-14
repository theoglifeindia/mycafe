import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BookOpen, 
  Settings2, 
  History, 
  PieChart, 
  Store, 
  User, 
  HelpCircle, 
  Coins, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { AppSettings, BusinessProfile } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: AppSettings;
  profile?: BusinessProfile;
  activeTableName?: string;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dinein', label: 'Dine In', icon: UtensilsCrossed },
  { id: 'menu', label: 'Menu Items', icon: BookOpen },
  { id: 'tablesetup', label: 'Table Setup', icon: Store },
  { id: 'history', label: 'Order History', icon: History },
  { id: 'expenses', label: 'Expenses & P&L', icon: Coins },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  settings, 
  profile, 
  activeTableName,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const isDark = settings.theme === 'Midnight';
  const bName = settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Chai Hub';
  const logoUrl = settings.logoUrl;

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    // On mobile screens, automatically close the drawer after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl lg:shadow-none' 
            : 'bg-white border-gray-200 text-gray-900 shadow-2xl lg:shadow-none'
        }`}
      >
        {/* Top Header: Logo & Branding & Close Button for Mobile */}
        <div className={`p-4 flex flex-col items-center relative border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          
          {/* Mobile Close Button (Top-Right) */}
          <button
            onClick={onClose}
            className={`absolute top-3 right-3 p-2 rounded-xl lg:hidden transition-all ${
              isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex absolute -right-3.5 top-6 w-7 h-7 rounded-full border items-center justify-center shadow-md transition-transform hover:scale-110 z-50 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-white border-gray-300 text-gray-700 hover:text-blue-600'
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Logo container */}
          {!isCollapsed ? (
            <div className="w-full flex flex-col items-center space-y-2.5">
              <div className={`w-full h-24 ${
                isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-50 border-gray-200'
              } border rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-sm`}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain block mx-auto rounded-xl" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-tr from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                    {bName.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              <div className="w-full text-center space-y-0.5 px-1">
                <h1 className={`text-sm font-black leading-tight tracking-tight break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {bName}
                </h1>
                <p className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Powered by BiLLWiSE
                </p>
                {activeTableName && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Table: {activeTableName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Icon Header */
            <div className="flex flex-col items-center space-y-1 py-1">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                {bName.charAt(0) || 'B'}
              </div>
              <span className="text-[8px] font-black uppercase text-blue-500 tracking-tighter">POS</span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 mt-2 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'
                } text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md font-black scale-[1.02]' 
                    : isDark 
                      ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom User / Terminal Status */}
        <div className={`p-3 mt-auto border-t flex items-center ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          {!isCollapsed ? (
            <div className={`p-2 rounded-xl flex items-center space-x-2.5 w-full overflow-hidden ${
              isDark ? 'bg-slate-800/50' : 'bg-blue-50/70'
            }`}>
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-xs">
                AD
              </div>
              <div className="truncate text-left">
                <p className={`text-xs font-black truncate leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Admin</p>
                <p className="text-[9px] text-blue-500 font-black uppercase tracking-tighter">Terminal #01</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1" title="Admin - Terminal #01">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                AD
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
