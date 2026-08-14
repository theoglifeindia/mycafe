import React, { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff, AlertCircle, ShieldCheck, Utensils } from 'lucide-react';
import { AppSettings, BusinessProfile } from '../types.ts';
import { BillWiseLogo } from './BillWiseLogo.tsx';

interface LoginProps {
  onLogin: (user: string, pass: string) => boolean;
  settings: AppSettings;
  profile?: BusinessProfile;
}

const Login: React.FC<LoginProps> = ({ onLogin, settings, profile }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bName = settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Chai Hub';
  const logoUrl = settings.logoUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const success = onLogin(username.trim(), password.trim());
      setIsSubmitting(false);
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* BillWise POS Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl w-full flex flex-col items-center justify-center shadow-lg">
            <BillWiseLogo size="xl" variant="light" showTagline tagline="POINT OF SALE SYSTEM" />
          </div>

          <div className="pt-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Workspace</div>
            <h1 className="text-lg font-black text-amber-300 tracking-tight leading-snug">
              {bName}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Terminal Station Authentication
            </p>
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-start gap-3 text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-bold leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to POS Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Default Admin: <span className="font-bold text-blue-400">admin</span> / <span className="font-bold text-blue-400">admin</span>
          </div>
          <div className="text-[9px] font-black uppercase text-slate-600">v2.5 Pro</div>
        </div>

        {/* Bottom footer branding */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Powered by BiLLWiSE POS Platform • Client: {bName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
