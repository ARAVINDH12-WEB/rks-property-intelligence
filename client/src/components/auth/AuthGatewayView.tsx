import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import {
  Eye, EyeOff, Sparkles, Sun, Moon, Lock, Mail,
  Car, FileCheck, MapPin, CheckCircle2, Shield,
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast, theme, toggleTheme } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [staffEmail, setStaffEmail] = useState('admin@rks.com');
  const [staffPassword, setStaffPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const handleCustomerLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const user = {
      id: 999,
      name: customerName.trim() || 'Guest Customer',
      email: 'customer@rks.com',
      phone: customerPhone.trim() || '+91 98400 00000',
      role: 'VIEWER',
    };
    sessionStorage.setItem('rks_active_role', 'VIEWER');
    sessionStorage.setItem('rks_auth_session', JSON.stringify(user));
    localStorage.setItem('rks_active_role', 'VIEWER');
    localStorage.setItem('rks_auth_session', JSON.stringify(user));
    showToast('Welcome, ' + user.name + '!', 'Browsing as Customer', 'success');
    onLoginSuccess('VIEWER', user);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStaffError('');
    try {
      const res = await api.login(staffEmail, staffPassword);
      sessionStorage.setItem('rks_active_role', res.user.role);
      sessionStorage.setItem('rks_auth_token', res.token);
      sessionStorage.setItem('rks_auth_session', JSON.stringify(res.user));
      localStorage.setItem('rks_active_role', res.user.role);
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_auth_session', JSON.stringify(res.user));
      showToast('Welcome back, ' + res.user.name, 'Logged in as ' + res.user.role, 'success');
      onLoginSuccess(res.user.role as UserRole, res.user);
    } catch (err: any) {
      setStaffError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, role: UserRole, name: string) => {
    const pw = email.split('@')[0] + '123';
    setStaffEmail(email);
    setStaffPassword(pw);
    const user = { id: role === 'ADMIN' ? 1 : 2, name, email, role };
    sessionStorage.setItem('rks_active_role', role);
    sessionStorage.setItem('rks_auth_session', JSON.stringify(user));
    localStorage.setItem('rks_active_role', role);
    localStorage.setItem('rks_auth_session', JSON.stringify(user));
    showToast('Authenticated as ' + name, 'Role: ' + role, 'success');
    onLoginSuccess(role, user);
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans flex flex-col" style={{ background: theme === 'dark' ? '#07090E' : '#F0F4FF' }}>
      {/* Vibrant Background Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, #8b5cf6, #6366f1)' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, #10b981, #06b6d4)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #f59e0b, #ef4444)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md px-6 py-4 flex items-center justify-between" style={{ background: theme === 'dark' ? 'rgba(13,16,23,0.85)' : 'rgba(255,255,255,0.85)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl font-extrabold text-white text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            RKS
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              RKS PROPERTY INTELLIGENCE
              <span className="rounded-md px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300 border border-violet-400/30 bg-violet-500/10">v2.4</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Master Real Estate Inventory & Customer Booking Platform</p>
          </div>
        </div>
        <button onClick={toggleTheme} className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:border-violet-400 transition-colors shadow-sm">
          {theme === 'dark' ? <><Sun className="h-4 w-4 text-amber-400" /> Light Mode</> : <><Moon className="h-4 w-4 text-slate-700" /> Dark Mode</>}
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left: Brand Info */}
        <div className="flex-1 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold border-violet-400/40 bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to RKS Prime Properties
          </div>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Discover Premium Plots with{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              Transparent Pricing.
            </span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Explore 58 surveyed plots across Chennai & Tamil Nadu. Browse as a guest, chat with our AI Concierge, or book a free site visit with cab pickup.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '58', label: 'Surveyed Plots', color: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-700/50', bg: 'bg-violet-50 dark:bg-violet-900/10' },
              { value: '₹850', label: 'Base Rate/Sq.Ft', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700/50', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
              { value: '100%', label: 'Clear Titles', color: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-700/50', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
            ].map(({ value, label, color, border, bg }) => (
              <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 shadow-sm text-center`}>
                <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300">
            {[
              { icon: Car, text: 'Complimentary cab pickup & drop for site visits' },
              { icon: FileCheck, text: '100% DTCP / CMDA & RERA Approved Layouts' },
              { icon: MapPin, text: 'Prime locations — Chennai, Bangalore, Hyderabad' },
              { icon: CheckCircle2, text: 'Immediate Patta transfer & bank loan ready' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Cards */}
        <div className="w-full max-w-md space-y-5">
          {/* Customer Card */}
          <div className="rounded-3xl p-1 shadow-2xl" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4, #3b82f6)' }}>
            <div className="rounded-[20px] p-7 backdrop-blur-xl" style={{ background: theme === 'dark' ? 'rgba(7,9,14,0.92)' : 'rgba(255,255,255,0.96)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white text-xl shadow-lg shadow-emerald-500/30" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  🏡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Browse as Customer</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">No account needed — enter instantly</p>
                </div>
              </div>

              <form onSubmit={handleCustomerLogin} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 transition-all"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 transition-all"
                />
                <button type="submit" className="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.99]" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  🚀 Explore Properties →
                </button>
              </form>

              <p className="mt-3 text-center text-xs text-slate-400 dark:text-zinc-500">Browse listings, chat with AI, book free site visits</p>
            </div>
          </div>

          {/* Staff Card */}
          <div className="rounded-3xl p-1 shadow-2xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #ec4899)' }}>
            <div className="rounded-[20px] p-7 backdrop-blur-xl" style={{ background: theme === 'dark' ? 'rgba(7,9,14,0.92)' : 'rgba(255,255,255,0.96)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white text-xl shadow-lg shadow-violet-500/30" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Staff & Admin Login</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Manage inventory, imports & pricing</p>
                </div>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Staff Email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 pl-10 pr-12 py-3 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {staffError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {staffError}
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  {isLoading ? '🔐 Authenticating...' : '🔐 Sign In to Dashboard →'}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-center">Quick Demo Access</p>
                <div className="flex gap-2">
                  <button onClick={() => handleQuickLogin('admin@rks.com', 'ADMIN', 'Admin User')}
                    className="flex-1 rounded-xl py-2 text-xs font-bold text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700/60 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
                    Admin
                  </button>
                  <button onClick={() => handleQuickLogin('manager@rks.com', 'MANAGER', 'Manager User')}
                    className="flex-1 rounded-xl py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                    Manager
                  </button>
                  <button onClick={() => handleQuickLogin('employee@rks.com', 'EMPLOYEE', 'Staff User')}
                    className="flex-1 rounded-xl py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700/60 bg-slate-50 dark:bg-zinc-900/20 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-400 dark:text-zinc-600 border-t border-slate-200/50 dark:border-zinc-800/50">
        © 2025 RKS Property Intelligence · Powered by AI · PostgreSQL · Vercel
      </footer>
    </div>
  );
};
