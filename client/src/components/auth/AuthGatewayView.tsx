import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import { FormInput } from '../common/FormInput.js';
import { Helmet } from 'react-helmet-async';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  Building2
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast } = useApp();
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
      setEmailValidationError('Please enter a valid email address (e.g. admin@rksprime.com).');
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
    <div className="min-h-screen w-full flex items-center justify-center bg-rks-bg dark:bg-brand-charcoal px-4 relative overflow-hidden">
      <Helmet>
        <title>Admin Portal | RKS Prime Properties</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-teal/10 to-transparent"></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center shadow-premium border border-white/10">
            <Building2 className="h-8 w-8 text-brand-teal-light" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-brand-navy dark:text-white">RKS Prime Management</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Authorized personnel only</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-rks-cardDark rounded-3xl p-6 sm:p-8 shadow-premium border border-rks-border dark:border-rks-borderDark">
          
          <div className="flex items-center gap-3 border-b border-rks-border dark:border-zinc-800 pb-5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy dark:text-white">
                Admin Secure Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                256-bit encrypted connection
              </p>
            </div>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-5" noValidate>
            <FormInput
              ref={emailInputRef}
              label="Staff Email Address"
              type="email"
              id="staff-email-modal"
              autoComplete="username"
              placeholder="admin@rksprime.com"
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
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 hover:text-brand-teal transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            {staffError && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white py-3 text-sm font-bold shadow-premium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Access Dashboard</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
