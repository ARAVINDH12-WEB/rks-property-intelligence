import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Calendar,
  Sun,
  Moon,
  Phone,
  User,
  Compass,
  FileCheck,
  Car,
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast, theme, toggleTheme } = useApp();

  // Customer Direct Entry Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Staff Login Form
  const [staffEmail, setStaffEmail] = useState('admin@rks.com');
  const [staffPassword, setStaffPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  // Direct Customer Login (1-Click)
  const handleCustomerDirectLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const guestUser = {
      id: 999,
      name: customerName.trim() || 'Guest Customer',
      email: 'customer@rks.com',
      phone: customerPhone.trim() || '+91 98400 00000',
      role: 'VIEWER',
    };

    localStorage.setItem('rks_active_role', 'VIEWER');
    localStorage.setItem('rks_auth_session', JSON.stringify(guestUser));
    showToast(`Welcome, ${guestUser.name}!`, 'Logged in as Customer (Viewer Access)', 'success');
    onLoginSuccess('VIEWER', guestUser);
  };

  // Staff Login (Username & Password)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStaffError('');

    try {
      const res = await api.login(staffEmail, staffPassword);
      localStorage.setItem('rks_auth_session', JSON.stringify(res.user));
      showToast(`Welcome back, ${res.user.name}`, `Logged in as ${res.user.role}`, 'success');
      onLoginSuccess(res.user.role as UserRole, res.user);
    } catch (err: any) {
      setStaffError(err.message || 'Invalid staff email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Staff Demo Click
  const handleQuickStaffLogin = (email: string, role: UserRole, name: string) => {
    const defaultPass = email.split('@')[0] + '123';
    setStaffEmail(email);
    setStaffPassword(defaultPass);

    const demoUser = {
      id: role === 'ADMIN' ? 1 : 2,
      name,
      email,
      role,
    };
    localStorage.setItem('rks_active_role', role);
    localStorage.setItem('rks_auth_session', JSON.stringify(demoUser));
    showToast(`Authenticated as ${name}`, `Role: ${role}`, 'success');
    onLoginSuccess(role, demoUser);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07090E] text-slate-900 dark:text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="border-b border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0D1017]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 font-extrabold text-black shadow-lg shadow-amber-500/20 font-mono tracking-tighter text-base">
            RKS
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>RKS PROPERTY INTELLIGENCE</span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                PROD v2.4
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Master Real Estate Inventory & Customer Booking Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:border-amber-500 transition-colors shadow-sm cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Dual-Login Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row items-center justify-center gap-10 z-10">
        {/* Left Side: Brand Narrative & Real-Time Stats */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Welcome to RKS Prime Properties</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Discover Premium Plots with{' '}
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-400 dark:via-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
              Transparent Pricing.
            </span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Explore 58 surveyed plots and premium gated layouts across Chennai and Tamil Nadu. 
            Customers can enter directly to browse properties, check transparent pricing, schedule free site visits, 
            or chat with our AI Concierge. Staff can sign in with credentials to manage inventory and pricing.
          </p>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/80 p-3.5 shadow-sm">
              <div className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">58</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Surveyed Plots</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/80 p-3.5 shadow-sm">
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹850</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Base Rate / Sq.Ft</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/80 p-3.5 shadow-sm">
              <div className="text-2xl font-mono font-extrabold text-cyan-600 dark:text-cyan-400">100%</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Clear Patta Titles</div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-zinc-300">
            <div className="flex items-center gap-2.5">
              <Car className="h-4 w-4 text-emerald-500" />
              <span>Complimentary cab pickup & drop for site inspections</span>
            </div>
            <div className="flex items-center gap-2.5">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span>100% DTCP / CMDA & RERA Approved Layouts</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-emerald-500" />
              <span>Interactive Leaflet Map & Multi-Unit Land Conversions</span>
            </div>
          </div>
        </div>

        {/* Right Side: Dual Login Choices */}
        <div className="flex-1 w-full max-w-md space-y-6">
          {/* Card 1: Customer Direct Login */}
          <div className="rounded-3xl border border-amber-500/40 bg-white dark:bg-[#0D1017] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer & Buyer Portal</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 font-medium">Browse properties & book visits directly</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">
              No password needed! Enter directly to view plot layouts, interactive maps, and transparent pricing.
            </p>

            <form onSubmit={handleCustomerDirectLogin} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile (+91)"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 px-4 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
              >
                <span>🚀 Enter Directly as Customer (1-Click Access)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Card 2: Staff & Executive Login (Username & Password) */}
          <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1017] p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff & Admin Login</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">For authorized team members who edit inventory</p>
                </div>
              </div>
            </div>

            {staffError && (
              <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300">
                {staffError}
              </div>
            )}

            {/* 1-Click Quick Demo Staff Sign-In */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>1-Click Quick Staff Credentials</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin('admin@rks.com', 'ADMIN', 'Rajesh Kumar S (Director)')}
                  className="flex flex-col items-start rounded-xl border border-amber-500/30 bg-amber-500/5 p-2 text-left hover:bg-amber-500/15 transition-all cursor-pointer"
                >
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Director (Admin)</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">admin@rks.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin('manager@rks.com', 'MANAGER', 'Priya Sharma (Portfolio Manager)')}
                  className="flex flex-col items-start rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-2 text-left hover:bg-cyan-500/15 transition-all cursor-pointer"
                >
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Portfolio Manager</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">manager@rks.com</span>
                </button>
              </div>
            </div>

            {/* Staff Credentials Form */}
            <form onSubmit={handleStaffLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Staff Email / Username
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="admin@rks.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[#12161F] pl-3.5 pr-10 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-zinc-800 border border-slate-800 dark:border-zinc-700 py-3 px-4 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 mt-1 cursor-pointer shadow-md"
              >
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{isLoading ? 'Authenticating Staff...' : 'Sign In as Staff'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#0D1017] px-6 py-3 text-center text-xs text-slate-500 dark:text-zinc-500 z-10">
        © 2026 RKS Property Intelligence. Enterprise Real Estate Inventory & Customer Booking System.
      </footer>
    </div>
  );
};
