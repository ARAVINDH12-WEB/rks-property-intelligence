import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import { FormInput } from '../common/FormInput.js';
import { Helmet } from 'react-helmet-async';
import { BlueprintPattern } from '../common/BlueprintPattern.js';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  Building2,
  Smartphone,
  Copy,
  CheckCircle2
} from 'lucide-react';

interface AuthGatewayViewProps {
  onLoginSuccess: (role: UserRole, user?: any) => void;
}

type AuthStep = 'PASSWORD' | '2FA_SETUP' | '2FA_VERIFY';

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({ onLoginSuccess }) => {
  const { showToast } = useApp();
  const [step, setStep] = useState<AuthStep>('PASSWORD');
  
  // Credentials
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2FA Data
  const [userId, setUserId] = useState<number | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [useBackupMode, setUseBackupMode] = useState(false);
  
  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      
      if (res.requires_2fa_setup) {
        setUserId(res.userId);
        setQrCodeData(res.qrCode);
        setBackupCode(res.backupCode);
        setStep('2FA_SETUP');
      } else if (res.requires_2fa) {
        setUserId(res.userId);
        setStep('2FA_VERIFY');
      } else if (res.token) {
        finishLogin(res.token, res.user);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (!totpCode || (useBackupMode && totpCode.length !== 8) || (!useBackupMode && totpCode.length !== 6)) {
      setStaffError(`Please enter a valid ${useBackupMode ? '8-character backup' : '6-digit authenticator'} code.`);
      return;
    }

    setIsLoading(true);
    setStaffError(null);

    try {
      const res = await api.verify2FA(userId, totpCode.trim(), useBackupMode);
      if (res.token) {
        finishLogin(res.token, res.user);
      }
    } catch (err: any) {
      handleAuthError(err, 'Invalid 2FA code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishLogin = (token: string, user: any) => {
    sessionStorage.setItem('rks_active_role', user.role);
    sessionStorage.setItem('rks_auth_token', token);
    sessionStorage.setItem('rks_auth_session', JSON.stringify(user));
    localStorage.setItem('rks_active_role', user.role);
    localStorage.setItem('rks_auth_token', token);
    localStorage.setItem('rks_auth_session', JSON.stringify(user));

    showToast('Welcome back, ' + user.name, 'Logged in as ' + user.role, 'success');
    onLoginSuccess(user.role as UserRole, user);
  };

  const handleAuthError = (err: any, fallbackMsg?: string) => {
    const errorMsg = err?.message || '';
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many attempts')) {
      setStaffError('Too many attempts. Please wait 15 minutes.');
    } else if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('invalid')) {
      setStaffError(fallbackMsg || 'Incorrect credentials. Please double-check.');
    } else {
      setStaffError(errorMsg || fallbackMsg || 'Authentication failed. Please verify your credentials.');
    }
  };

  const copyBackupCode = () => {
    if (backupCode) {
      navigator.clipboard.writeText(backupCode);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#FAFAF9] dark:bg-zinc-900">
      <Helmet>
        <title>Admin Portal | RKS Prime Properties</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* LEFT PANEL - Premium Brand Presentation */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A1128] relative p-12 flex-col justify-between overflow-hidden">
        <BlueprintPattern opacity={0.15} color="teal" />
        
        {/* Top left logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Building2 className="h-6 w-6 text-brand-teal-light" />
          </div>
          <span className="text-xl font-bold font-heading text-white tracking-widest uppercase">RKS Prime</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-white text-5xl font-serif">RKS Command Center</h1>
          <p className="text-zinc-400 text-sm tracking-wide uppercase">Internal staff access only</p>
        </div>

        {/* Bottom security badges */}
        <div className="relative z-10 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-medium">JWT Secured</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Lock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-300 font-medium">TOTP 2FA</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-brand-teal-light" />
            <span className="text-xs text-zinc-300 font-medium">Rate Limited</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 relative">
        {/* Mobile Header (only shows on small screens) */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center shadow-lg">
            <Building2 className="h-5 w-5 text-brand-teal-light" />
          </div>
          <span className="text-lg font-bold text-brand-navy dark:text-white">RKS Prime</span>
        </div>

        <div className="w-full max-w-sm">
          {step === 'PASSWORD' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <p className="text-brand-teal font-semibold text-sm mb-2">Step 1 of 2</p>
                <h2 className="text-3xl font-bold text-brand-navy dark:text-white font-serif">Welcome Back</h2>
                <p className="text-slate-500 dark:text-zinc-400 mt-2">Enter your credentials to access the command center.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
                <FormInput
                  ref={emailInputRef}
                  label=""
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
                  icon={<Mail className="h-5 w-5" />}
                  required
                />

                <FormInput
                  label=""
                  type={showPassword ? 'text' : 'password'}
                  id="staff-password-modal"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={staffPassword}
                  onChange={(e) => {
                    setStaffPassword(e.target.value);
                    if (staffError) setStaffError(null);
                  }}
                  icon={<Lock className="h-5 w-5" />}
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
                  <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white py-3 text-base font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === '2FA_SETUP' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <p className="text-brand-teal font-semibold text-sm mb-2">Step 2 of 2</p>
                <h2 className="text-3xl font-bold text-brand-navy dark:text-white font-serif">Setup 2FA</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Scan this QR code with your authenticator app to secure your account.
                </p>
              </div>
              
              <div className="flex justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="2FA QR Code" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800 border-l-4 border-amber-500 rounded-r-lg p-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Save Recovery Code</h4>
                <div className="flex items-center justify-between mt-2 bg-white dark:bg-black/40 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{backupCode}</code>
                  <button onClick={copyBackupCode} className="text-slate-500 hover:text-slate-700 p-1" aria-label="Copy Backup Code">
                    {copiedBackup ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-5">
                <FormInput
                  label=""
                  type="text"
                  id="totp-setup-code"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/[^0-9]/g, ''));
                    setStaffError(null);
                  }}
                  icon={<Smartphone className="h-5 w-5" />}
                  required
                />
                
                {staffError && (
                  <div role="status" className="flex items-center gap-2 rounded-lg bg-rose-50 border-l-4 border-rose-500 p-3 text-sm font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white py-3 text-base font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Verify & Complete</span>}
                </button>
              </form>
            </div>
          )}

          {step === '2FA_VERIFY' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <p className="text-brand-teal font-semibold text-sm mb-2">Step 2 of 2</p>
                <h2 className="text-3xl font-bold text-brand-navy dark:text-white font-serif">Verification</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                  Enter the code from your authenticator app to continue.
                </p>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-6">
                <div className="text-center pb-4">
                  <Smartphone className="w-16 h-16 text-brand-teal mx-auto mb-4 opacity-80" />
                </div>
                
                <FormInput
                  label=""
                  type="text"
                  id="totp-verify-code"
                  placeholder={useBackupMode ? "Enter 8-character backup code" : "Enter 6-digit code"}
                  maxLength={useBackupMode ? 8 : 6}
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(useBackupMode ? e.target.value.toUpperCase() : e.target.value.replace(/[^0-9]/g, ''));
                    setStaffError(null);
                  }}
                  icon={<Smartphone className="h-5 w-5" />}
                  required
                />

                {staffError && (
                  <div role="status" className="flex items-center gap-2 rounded-lg bg-rose-50 border-l-4 border-rose-500 p-3 text-sm font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length === 0}
                  className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white py-3 text-base font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Verify</span>}
                </button>
              </form>

              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setUseBackupMode(!useBackupMode);
                    setTotpCode('');
                    setStaffError(null);
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-brand-teal hover:underline transition-colors"
                >
                  {useBackupMode ? "Use Authenticator App instead" : "Use a backup code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
