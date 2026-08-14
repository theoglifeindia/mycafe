import React, { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff, AlertCircle, ShieldCheck, Utensils } from 'lucide-react';
import { AppSettings, BusinessProfile } from '../types.ts';

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

  const bName = settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Cafe POS System';
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
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-full max-w-[240px] h-28 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-xl mb-1">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain block mx-auto rounded-xl" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                <Utensils className="w-7 h-7 text-white" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-snug">
              {bName}
            </h1>
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-400 mt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Terminal Authentication
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
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-blue-600/30 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to POS</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            POS Terminal Security &bull; Protected Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
