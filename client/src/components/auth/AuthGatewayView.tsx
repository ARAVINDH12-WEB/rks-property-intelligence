import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import {
  Eye, EyeOff, Sparkles, Sun, Moon, Lock, Mail,
  Car, FileCheck, MapPin, CheckCircle2, Shield, Loader2, ArrowRight, User
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast, theme, toggleTheme } = useApp();

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);

  // Staff / Admin State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  // Clear errors when typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffEmail(e.target.value);
    if (staffError) setStaffError(null);
    if (emailValidationError) setEmailValidationError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffPassword(e.target.value);
    if (staffError) setStaffError(null);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleCustomerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCustomerSubmitting(true);

    const name = customerName.trim() || 'Guest Customer';
    const phone = customerPhone.trim() || '';
    const user = {
      id: 999,
      name,
      email: 'customer@rks.com',
      phone: phone || '+91 98400 00000',
      role: 'VIEWER' as UserRole,
    };

    try {
      sessionStorage.setItem('rks_active_role', 'VIEWER');
      sessionStorage.setItem('rks_auth_session', JSON.stringify(user));
      localStorage.setItem('rks_active_role', 'VIEWER');
      localStorage.setItem('rks_auth_session', JSON.stringify(user));
      
      showToast('Welcome, ' + user.name + '!', 'Browsing as Customer', 'success');
      onLoginSuccess('VIEWER', user);

      // Persist customer record asynchronously in backend
      api.customerLogin(name, phone).catch(() => {
        // Non-blocking
      });
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setEmailValidationError(null);

    const trimmedEmail = staffEmail.trim();
    if (!trimmedEmail) {
      setEmailValidationError('Email address is required.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailValidationError('Please enter a valid email address (e.g. user@rks.com).');
      return;
    }

    if (!staffPassword) {
      setStaffError('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.login(trimmedEmail, staffPassword);
      sessionStorage.setItem('rks_active_role', res.user.role);
      sessionStorage.setItem('rks_auth_token', res.token);
      sessionStorage.setItem('rks_auth_session', JSON.stringify(res.user));
      localStorage.setItem('rks_active_role', res.user.role);
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_auth_session', JSON.stringify(res.user));

      showToast('Welcome back, ' + res.user.name, 'Logged in as ' + res.user.role, 'success');
      onLoginSuccess(res.user.role as UserRole, res.user);
    } catch (err: any) {
      const errorMsg = err?.message || '';
      if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('invalid email or password') || errorMsg.toLowerCase().includes('unauthorized')) {
        setStaffError('Incorrect email or password. Please double-check your credentials.');
      } else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many requests')) {
        setStaffError('Too many login attempts. Please wait a minute and try again.');
      } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed to fetch') || errorMsg.includes('500') || errorMsg.includes('503')) {
        setStaffError('Unable to connect to server. Please check your connection and try again.');
      } else {
        setStaffError(errorMsg || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden font-sans flex flex-col justify-between"
      style={{ background: theme === 'dark' ? '#07090E' : '#F4F7FB' }}
    >
      {/* Background Decorative Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6, #3b82f6)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #10b981, #06b6d4)' }}
        />
      </div>

      {/* Header */}
      <header
        className="relative z-10 border-b border-slate-200/60 dark:border-white/10 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{ background: theme === 'dark' ? 'rgba(13,16,23,0.85)' : 'rgba(255,255,255,0.85)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-white text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            RKS
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              RKS PROPERTY INTELLIGENCE
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Master Real Estate Inventory & Customer Booking Platform</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-200 hover:border-emerald-500 transition-colors shadow-sm"
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
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Side: Brand Value Proposition */}
        <div className="flex-1 space-y-5 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Direct Developer Inventory
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Discover Verified Plots with{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              Transparent Pricing.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Browse our complete real estate catalog across Chennai & Tamil Nadu. Explore surveyed plots, compare rates, talk with our AI Property Concierge, or schedule a free site tour with doorstep pickup.
          </p>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-2">
            {[
              { value: '58+', label: 'Verified Plots', color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', bg: 'bg-emerald-50/70 dark:bg-emerald-950/20' },
              { value: '₹850', label: 'Base Rate / Sq.Ft', color: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/50', bg: 'bg-teal-50/70 dark:bg-teal-950/20' },
              { value: '100%', label: 'RERA & DTCP Clear', color: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/50', bg: 'bg-cyan-50/70 dark:bg-cyan-950/20' },
            ].map(({ value, label, color, border, bg }) => (
              <div key={label} className={`rounded-2xl border ${border} ${bg} p-3 sm:p-4 text-center shadow-sm`}>
                <div className={`text-xl sm:text-2xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700 dark:text-zinc-300 text-left">
            {[
              { icon: Car, text: 'Free cab pickup & drop for site visits' },
              { icon: FileCheck, text: '100% Legal verification & title deeds' },
              { icon: MapPin, text: 'Strategic growth corridors in TN' },
              { icon: CheckCircle2, text: 'Instant booking & bank loan support' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Primary Customer Card + Secondary Admin Card */}
        <div className="w-full max-w-md space-y-4">
          {/* PRIMARY CARD: Customer Portal (Larger, Brighter, Primary Weight) */}
          <div
            className="rounded-3xl p-1 shadow-2xl transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)' }}
          >
            <div
              className="rounded-[22px] p-6 sm:p-7 backdrop-blur-xl"
              style={{ background: theme === 'dark' ? 'rgba(10, 14, 22, 0.95)' : 'rgba(255, 255, 255, 0.98)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white text-xl shadow-lg shadow-emerald-500/20"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    🏡
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Browse as Customer
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Instant Access
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Explore properties, pricing & book site visits</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="customer-name-input" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Your Name <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      id="customer-name-input"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Anand Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-phone-input" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Mobile Number <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">(Optional for visit updates)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-zinc-500">
                      +91
                    </span>
                    <input
                      id="customer-phone-input"
                      type="tel"
                      autoComplete="tel"
                      placeholder="98400 12345"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCustomerSubmitting}
                  className="w-full mt-2 rounded-xl py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition-all hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
                >
                  {isCustomerSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Entering Portal...</span>
                    </>
                  ) : (
                    <>
                      <span>Explore Properties</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* SECONDARY CARD: Staff & Admin Login (Neutral Border, Subdued, Secondary Weight) */}
          <div
            className="rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg p-5 transition-all"
            style={{ background: theme === 'dark' ? 'rgba(15, 18, 25, 0.9)' : 'rgba(255, 255, 255, 0.92)' }}
          >
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Staff & Management Sign In</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Authorized personnel only</p>
              </div>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-3" noValidate>
              <div>
                <label htmlFor="staff-email-input" className="sr-only">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="staff-email-input"
                    type="email"
                    autoComplete="username"
                    placeholder="Email address"
                    value={staffEmail}
                    onChange={handleEmailChange}
                    aria-invalid={!!emailValidationError}
                    aria-describedby={emailValidationError ? 'staff-email-error' : undefined}
                    className={`w-full rounded-xl border ${
                      emailValidationError
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-zinc-700'
                    } bg-slate-50 dark:bg-zinc-800/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-500 transition-all`}
                  />
                </div>
                {emailValidationError && (
                  <p id="staff-email-error" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {emailValidationError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="staff-password-input" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="staff-password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={staffPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 pl-10 pr-11 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Error State (conditionally rendered only after failed attempt) */}
              {staffError && (
                <div
                  role="alert"
                  className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
                >
                  {staffError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-zinc-100 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 text-[11px] text-slate-500 dark:text-zinc-500 border-t border-slate-200/50 dark:border-zinc-800/50">
        © {new Date().getFullYear()} RKS Property Intelligence · Master Inventory & Real Estate ERP
      </footer>
    </div>
  );
};
