
import React, { useState, useEffect } from 'react';
import { AppSettings, BusinessProfile, ThemeType, InvoiceLine } from '../types.ts';
import { compressImageDataUrl } from '../services/imageCompressor.ts';
import { BillWiseLogo } from './BillWiseLogo.tsx';
import { 
  Settings as SettingsIcon, 
  Image as ImageIcon, 
  FileText, 
  Printer, 
  CheckCircle, 
  Store, 
  Tag, 
  X, 
  Moon, 
  Sun, 
  Leaf, 
  Monitor, 
  Plus, 
  Minus,
  Trash2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type,
  ShieldCheck,
  Cpu,
  Sparkles
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  profile: BusinessProfile;
  onSaveSettings: (settings: AppSettings) => void;
  onSaveProfile: (profile: BusinessProfile) => void;
}

interface LineEditorProps {
  line: InvoiceLine;
  type: 'header' | 'footer';
  onUpdate: (type: 'header' | 'footer', id: string, updates: Partial<InvoiceLine>) => void;
  onRemove: (type: 'header' | 'footer', id: string) => void;
  isDark?: boolean;
}

/**
 * LineEditor: Independent component for managing a single line of the invoice.
 * Wired to unique IDs to prevent cross-line interference.
 */
const LineEditor: React.FC<LineEditorProps> = ({ line, type, onUpdate, onRemove, isDark = false }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border group animate-in slide-in-from-top-2 duration-200 ${
    isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-gray-50 border-gray-100'
  }`}>
    <input 
      value={line.text}
      onChange={(e) => onUpdate(type, line.id, { text: e.target.value })}
      placeholder="Enter text..."
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none border ${
        isDark 
          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
      }`}
    />
    
    {/* Font Size Controls */}
    <div className={`flex items-center border rounded-lg p-1 space-x-1 ${
      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      <button 
        type="button"
        onClick={() => onUpdate(type, line.id, { size: Math.max(8, line.size - 1) })} 
        className={`p-1 rounded transition-colors ${
          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-[10px] font-black w-7 text-center tabular-nums">{line.size}</span>
      <button 
        type="button"
        onClick={() => onUpdate(type, line.id, { size: Math.min(32, line.size + 1) })} 
        className={`p-1 rounded transition-colors ${
          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>

    {/* Alignment Controls */}
    <div className={`flex items-center border rounded-lg p-1 space-x-1 ${
      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <button 
        type="button"
        onClick={() => onUpdate(type, line.id, { align: 'left' })}
        className={`p-1 rounded transition-all ${
          line.align === 'left' 
            ? 'bg-blue-600 text-white shadow-sm' 
            : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'
        }`}
      ><AlignLeft className="w-3.5 h-3.5" /></button>
      <button 
        type="button"
        onClick={() => onUpdate(type, line.id, { align: 'center' })}
        className={`p-1 rounded transition-all ${
          line.align === 'center' 
            ? 'bg-blue-600 text-white shadow-sm' 
            : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'
        }`}
      ><AlignCenter className="w-3.5 h-3.5" /></button>
      <button 
        type="button"
        onClick={() => onUpdate(type, line.id, { align: 'right' })}
        className={`p-1 rounded transition-all ${
          line.align === 'right' 
            ? 'bg-blue-600 text-white shadow-sm' 
            : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'
        }`}
      ><AlignRight className="w-3.5 h-3.5" /></button>
    </div>

    {/* Bold Toggle */}
    <button 
      type="button"
      onClick={() => onUpdate(type, line.id, { bold: !line.bold })}
      className={`p-2 rounded-lg border transition-all flex items-center justify-center w-8 h-8 ${
        line.bold 
          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
          : isDark 
            ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' 
            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-100'
      }`}
    >
      <span className="text-[10px] font-black">B</span>
    </button>

    {/* Delete Button */}
    <button 
      type="button"
      onClick={() => onRemove(type, line.id)}
      className="p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      title="Delete Line"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const Settings: React.FC<SettingsProps> = ({ settings, profile, onSaveSettings, onSaveProfile }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localProfile, setLocalProfile] = useState<BusinessProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Sync with incoming props if they change externally (like Firestore updates)
  useEffect(() => {
    setLocalSettings(settings);
    setLocalProfile(profile);
  }, [settings, profile]);

  const generateUniqueId = () => {
    // Enhanced entropy to prevent ID collisions
    return `line_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawDataUrl = reader.result as string;
      const compressed = await compressImageDataUrl(rawDataUrl, 300, 300, 0.7);
      setLocalSettings(prev => ({ ...prev, logoUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    try {
      let settingsToSave = { ...localSettings };
      if (settingsToSave.logoUrl && settingsToSave.logoUrl.startsWith('data:image')) {
        settingsToSave.logoUrl = await compressImageDataUrl(settingsToSave.logoUrl, 300, 300, 0.7);
      }
      await onSaveSettings(settingsToSave);
      await onSaveProfile(localProfile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Settings save failed:', err);
      alert('Failed to save settings. Please try uploading a smaller logo image.');
    }
  };

  const addLine = (type: 'header' | 'footer') => {
    const newLine: InvoiceLine = {
      id: generateUniqueId(),
      text: type === 'header' ? 'New Header Line' : 'New Footer Line',
      size: 12,
      bold: false,
      align: 'center'
    };
    
    setLocalSettings(prev => {
      const field = type === 'header' ? 'headerLines' : 'footerLines';
      const existing = prev[field] || [];
      return { 
        ...prev, 
        [field]: [...existing, newLine] 
      };
    });
  };

  const removeLine = (type: 'header' | 'footer', id: string) => {
    setLocalSettings(prev => {
      const field = type === 'header' ? 'headerLines' : 'footerLines';
      const existing = prev[field] || [];
      return { 
        ...prev, 
        [field]: existing.filter(l => l.id !== id) 
      };
    });
  };

  const updateLine = (type: 'header' | 'footer', id: string, updates: Partial<InvoiceLine>) => {
    setLocalSettings(prev => {
      const field = type === 'header' ? 'headerLines' : 'footerLines';
      const existing = prev[field] || [];
      return {
        ...prev,
        [field]: existing.map(l => l.id === id ? { ...l, ...updates } : l)
      };
    });
  };

  const themes: { id: ThemeType; label: string; icon: any; color: string }[] = [
    { id: 'Rock Bottom', label: 'Rock Bottom', icon: Sun, color: 'bg-blue-600' },
    { id: 'Midnight', label: 'Midnight', icon: Moon, color: 'bg-slate-900' },
    { id: 'Eco-Green', label: 'Eco-Green', icon: Leaf, color: 'bg-emerald-600' },
    { id: 'Modern Minimalist', label: 'Modern', icon: Monitor, color: 'bg-gray-400' },
  ];

  const isDark = localSettings.theme === 'Midnight';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Big BillWise POS Engine Platform Banner */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white shadow-xl'
      }`}>
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-blue-300 border border-white/10">
              <Cpu className="w-3.5 h-3.5" />
              <span>Enterprise POS Engine Configuration</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <BillWiseLogo size="xl" variant="light" />
              <div className="hidden sm:block h-10 w-px bg-white/15" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Licensed Operating System</div>
                <div className="text-sm font-black text-amber-300">
                  Client Business: {localSettings.businessName || localProfile.ownerName || 'Chai Hub'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
              You are configuring the <strong className="text-white">BillWise POS System</strong> for your restaurant outlet. Customize your store receipts, thermal invoice layouts, menu tax preferences, and operational theme below.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2.5 min-w-[200px]">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs w-full">
              <span className="text-slate-400 text-[10px] font-bold uppercase">POS Engine</span>
              <span className="font-black text-blue-400 text-xs">v2.5 Pro</span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs w-full">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Client Status</span>
              <span className="font-black text-emerald-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Station
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>System Configuration</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global POS Preferences</p>
            </div>
          </div>
          <button 
            onClick={handleSaveAll}
            className={`flex items-center px-8 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaved ? <><CheckCircle className="w-4 h-4 mr-2" /> Changes Saved!</> : <><CheckCircle className="w-4 h-4 mr-2" /> Save Changes</>}
          </button>
        </div>

        <div className="p-8 space-y-12">
          {/* Business Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-500">
                <Store className="w-4 h-4" />
                <h3 className="text-sm font-black uppercase tracking-widest">Store Identity</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Owner Name</label>
                  <input 
                    value={localProfile.ownerName}
                    onChange={e => setLocalProfile({...localProfile, ownerName: e.target.value})}
                    placeholder="Owner Name"
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm transition-all ${
                      isDark 
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Store Address</label>
                  <textarea 
                    rows={2}
                    value={localProfile.address}
                    onChange={e => setLocalProfile({...localProfile, address: e.target.value})}
                    placeholder="Store Address"
                    className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm resize-none transition-all ${
                      isDark 
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-gray-50 border-gray-100'
              }`}>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UI Theme</span>
                <div className="flex space-x-2">
                   {themes.map(t => (
                     <button 
                       key={t.id}
                       onClick={() => setLocalSettings(prev => ({ ...prev, theme: t.id }))}
                       className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                         localSettings.theme === t.id 
                           ? 'bg-blue-600 text-white shadow-md' 
                           : isDark 
                             ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white' 
                             : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'
                       }`}
                       title={t.label}
                     >
                       <t.icon className="w-4 h-4" />
                     </button>
                   ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center space-x-2 text-blue-500">
                <ImageIcon className="w-4 h-4" />
                <h3 className="text-sm font-black uppercase tracking-widest">Logo & Bill Branding</h3>
              </div>
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Business Name</label>
                  <input 
                    type="text"
                    value={localSettings.businessName ?? localSettings.invoiceHeader ?? 'Cafe Rock Bottom'}
                    onChange={e => {
                      const newName = e.target.value;
                      setLocalSettings(prev => {
                        const oldName = prev.businessName || prev.invoiceHeader || 'Cafe Rock Bottom';
                        const updatedHeaderLines = (prev.headerLines || []).map(line => {
                          if (line.id === 'h1' && (line.text.toUpperCase() === oldName.toUpperCase() || line.text === 'CAFE ROCK BOTTOM')) {
                            return { ...line, text: newName.toUpperCase() };
                          }
                          return line;
                        });
                        return {
                          ...prev,
                          businessName: newName,
                          invoiceHeader: newName,
                          headerLines: updatedHeaderLines
                        };
                      });
                    }}
                    placeholder="Enter Business Name"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none border ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div className="flex items-center space-x-4 pt-1">
                  <div className={`w-20 h-16 rounded-xl border overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0 ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    {localSettings.logoUrl ? <img src={localSettings.logoUrl} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                     <label className={`inline-block px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer transition-all shadow-sm ${
                       isDark 
                         ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                         : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                     }`}>
                      Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    <div className="flex items-center mt-2 space-x-4">
                      <button 
                        onClick={() => setLocalSettings(s => ({...s, showLogoOnBill: !s.showLogoOnBill}))}
                        className={`text-[9px] font-black uppercase tracking-tight transition-colors cursor-pointer ${
                          localSettings.showLogoOnBill 
                            ? 'text-blue-500 font-black' 
                            : isDark ? 'text-slate-500 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {localSettings.showLogoOnBill ? 'Logo Visible' : 'Logo Hidden'}
                      </button>
                      <button 
                        onClick={() => setLocalSettings(s => ({...s, showAddressOnBill: !s.showAddressOnBill}))}
                        className={`text-[9px] font-black uppercase tracking-tight transition-colors cursor-pointer ${
                          localSettings.showAddressOnBill 
                            ? 'text-blue-500 font-black' 
                            : isDark ? 'text-slate-500 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {localSettings.showAddressOnBill ? 'Addr Visible' : 'Addr Hidden'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Designer Section */}
          <div className={`space-y-8 pt-12 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-950/60 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Invoice Designer</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">80mm Thermal Printer Template</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-10">
                {/* Header Section Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-2 text-blue-500" /> Header Sections
                    </h3>
                    <button 
                      onClick={() => addLine('header')}
                      className={`p-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer ${
                        isDark 
                          ? 'bg-blue-950/60 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-800/60' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(localSettings.headerLines || []).map(line => (
                      <LineEditor 
                        key={line.id} 
                        line={line} 
                        type="header" 
                        onUpdate={updateLine}
                        onRemove={removeLine}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>

                {/* Global Font Size Control */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Type className="w-3.5 h-3.5 mr-2 text-blue-500" /> Global Typography
                  </h3>
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill Body Font Size</span>
                    <div className={`flex items-center border rounded-xl p-1.5 space-x-3 ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                    }`}>
                      <button 
                        onClick={() => setLocalSettings(s => ({...s, bodyFontSize: Math.max(8, s.bodyFontSize - 1)}))} 
                        className={`p-1.5 rounded transition-colors ${
                          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-sm font-black w-8 text-center tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{localSettings.bodyFontSize}px</span>
                      <button 
                        onClick={() => setLocalSettings(s => ({...s, bodyFontSize: Math.min(20, s.bodyFontSize + 1)}))} 
                        className={`p-1.5 rounded transition-colors ${
                          isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Section Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <Tag className="w-3.5 h-3.5 mr-2 text-blue-500" /> Footer Sections
                    </h3>
                    <button 
                      onClick={() => addLine('footer')}
                      className={`p-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer ${
                        isDark 
                          ? 'bg-blue-950/60 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-800/60' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(localSettings.footerLines || []).map(line => (
                      <LineEditor 
                        key={line.id} 
                        line={line} 
                        type="footer" 
                        onUpdate={updateLine}
                        onRemove={removeLine}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Thermal Printer Live Preview */}
              <div className="flex flex-col items-center">
                <div className="sticky top-24">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">80mm Live Preview</h3>
                  <div className="w-[300px] bg-white shadow-2xl rounded-sm border-t-8 border-gray-800 p-6 font-mono relative overflow-hidden flex flex-col items-center min-h-[400px]">
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-gray-50/5 to-transparent opacity-50"></div>
                    
                    {localSettings.showLogoOnBill && localSettings.logoUrl && (
                      <img src={localSettings.logoUrl} className="max-h-16 max-w-full object-contain mb-4 grayscale opacity-80" />
                    )}

                    {/* Rendered Header Lines */}
                    {(localSettings.headerLines || []).map(line => (
                      <div 
                        key={line.id} 
                        style={{ 
                          fontSize: `${line.size}px`, 
                          fontWeight: line.bold ? 'bold' : 'normal',
                          textAlign: line.align,
                          width: '100%'
                        }}
                        className="mb-1 leading-tight break-words"
                      >
                        {line.text}
                      </div>
                    ))}

                    {localSettings.showAddressOnBill && (
                      <div className="text-[10px] text-center mt-2 border-b border-dashed border-gray-300 pb-2 w-full">
                        {localProfile.address}
                      </div>
                    )}

                    {/* Dummy Body Content */}
                    <div className="w-full mt-4 space-y-1.5" style={{ fontSize: `${localSettings.bodyFontSize}px` }}>
                      <div className="flex justify-between border-b border-dashed border-gray-200 pb-1 font-bold">
                        <span>Items</span>
                        <span>Amt</span>
                      </div>
                      <div className="flex justify-between opacity-70">
                        <span>Veggie Wrap x 2</span>
                        <span>₹298.00</span>
                      </div>
                      <div className="flex justify-between opacity-70">
                        <span>Cheese Corn Maggi x 1</span>
                        <span>₹119.00</span>
                      </div>
                      <div className="border-t border-dashed border-gray-400 mt-2 pt-2 flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹417.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-b-2 border-double border-gray-800 pb-1 mt-1">
                        <span>TOTAL:</span>
                        <span>₹417.00</span>
                      </div>
                    </div>

                    {/* Rendered Footer Lines */}
                    <div className="mt-6 w-full space-y-1">
                      {(localSettings.footerLines || []).map(line => (
                        <div 
                          key={line.id} 
                          style={{ 
                            fontSize: `${line.size}px`, 
                            fontWeight: line.bold ? 'bold' : 'normal',
                            textAlign: line.align,
                            width: '100%'
                          }}
                          className="leading-tight"
                        >
                          {line.text}
                        </div>
                      ))}
                    </div>

                    {/* Aesthetic Receipt Tear-off Edge */}
                    <div className="absolute -bottom-1 left-0 right-0 flex justify-between">
                       {[...Array(15)].map((_, i) => (
                         <div key={i} className={`w-4 h-4 rotate-45 transform translate-y-2 ${
                           isDark ? 'bg-slate-900' : 'bg-gray-50'
                         }`}></div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
