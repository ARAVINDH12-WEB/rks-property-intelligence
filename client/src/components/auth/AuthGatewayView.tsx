import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import { LandingPageView } from '../landing/LandingPageView.js';
import { FormInput } from '../common/FormInput.js';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast } = useApp();

  // Staff Modal Visibility
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus modal on open, trap focus, handle Escape key
  useEffect(() => {
    if (isStaffModalOpen) {
      emailInputRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsStaffModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isStaffModalOpen]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleCustomerExplore = async () => {
    const user = {
      id: 999,
      name: 'Guest Customer',
      email: 'customer@rks.com',
      phone: '+91 98400 00000',
      role: 'VIEWER' as UserRole,
    };

    try {
      sessionStorage.setItem('rks_active_role', 'VIEWER');
      sessionStorage.setItem('rks_auth_session', JSON.stringify(user));
      localStorage.setItem('rks_active_role', 'VIEWER');
      localStorage.setItem('rks_auth_session', JSON.stringify(user));

      onLoginSuccess('VIEWER', user);
      api.customerLogin('Guest Customer', '').catch(() => {});
    } catch (err) {
      console.error('Customer login error:', err);
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
      if (
        errorMsg.includes('401') ||
        errorMsg.toLowerCase().includes('invalid email or password') ||
        errorMsg.toLowerCase().includes('unauthorized')
      ) {
        setStaffError('Incorrect email or password. Please double-check your credentials.');
      } else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many requests')) {
        setStaffError('Too many login attempts. Please wait a minute and try again.');
      } else {
        setStaffError(errorMsg || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Public Customer Landing Page ── */}
      <LandingPageView
        onExploreProperties={handleCustomerExplore}
        onOpenStaffLogin={() => setIsStaffModalOpen(true)}
      />

      {/* ── Accessible Staff & Management Login Modal ── */}
      {isStaffModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0F141E] p-6 sm:p-8 shadow-2xl space-y-5 animate-scaleUp text-slate-900 dark:text-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="staff-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Staff & Admin Portal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Enter your management credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                aria-label="Close modal"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleStaffLogin} className="space-y-4" noValidate>
              <FormInput
                ref={emailInputRef}
                label="Staff Email Address"
                type="email"
                id="staff-email-modal"
                autoComplete="username"
                placeholder="admin@rks.com"
                value={staffEmail}
                error={emailValidationError}
                onChange={(e) => {
                  setStaffEmail(e.target.value);
                  if (staffError) setStaffError(null);
                  if (emailValidationError) setEmailValidationError(null);
                }}
                icon={<Mail className="h-4 w-4" />}
                required
              />

              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="staff-password-modal"
                autoComplete="current-password"
                placeholder="Enter password"
                value={staffPassword}
                onChange={(e) => {
                  setStaffPassword(e.target.value);
                  if (staffError) setStaffError(null);
                }}
                icon={<Lock className="h-4 w-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />

              {/* Dynamic Error Live Region */}
              {staffError && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-fadeIn"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{staffError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-3 text-sm font-bold shadow-lg shadow-emerald-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
