import React, { useState } from 'react';
import {
  FolderLock,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthPage: React.FC = () => {
  const { login, signup, signInWithGoogle, demoLogin, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(res.error || 'Google authentication failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your full name to create an account.');
        return;
      }
      const res = await signup(email.trim().toLowerCase(), password, name.trim(), role);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      } else {
        setSuccessMessage('Account created successfully! Welcome to ClientVault.');
      }
    } else {
      const res = await login(email.trim().toLowerCase(), password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials or login failed.');
      }
    }
  };

  const handleQuickFill = (targetRole: 'freelancer' | 'client') => {
    setError(null);
    setSuccessMessage(null);
    if (targetRole === 'freelancer') {
      setEmail('elena.designer@studioflow.design');
      setPassword('secureVault2026!');
      setName('Elena Rostova');
      setRole('freelancer');
    } else {
      setEmail('marcus@acmecorp.com');
      setPassword('clientVaultPass99');
      setName('Marcus Vance');
      setRole('client');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Lockup */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B1329] text-sky-400 mb-4 shadow-sm border border-slate-800">
          <FolderLock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          ClientVault
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Industrial-grade client file portal with Row Level Security & Google OAuth
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isSignUp
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isSignUp
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Prominent "Continue with Google" Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* "OR" Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B1329] focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="designer@studioflow.design"
                  className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B1329] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B1329] focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters</p>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`p-2.5 text-xs rounded-lg border text-left transition-colors ${
                      role === 'freelancer'
                        ? 'border-sky-500 bg-sky-50/50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">Freelancer / Designer</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Full vault management
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-2.5 text-xs rounded-lg border text-left transition-colors ${
                      role === 'client'
                        ? 'border-sky-500 bg-sky-50/50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">Client Partner</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Project-scoped access
                    </span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#0B1329] hover:bg-slate-800 focus:outline-none transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Vault Account' : 'Sign In to Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleQuickFill('freelancer');
                  demoLogin('freelancer');
                }}
                className="p-2 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5 font-medium text-slate-800 text-[11px]">
                  <KeyRound className="w-3 h-3 text-sky-600" />
                  <span>Elena (Freelancer)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Admin & Project Owner</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleQuickFill('client');
                  demoLogin('client');
                }}
                className="p-2 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5 font-medium text-slate-800 text-[11px]">
                  <KeyRound className="w-3 h-3 text-emerald-600" />
                  <span>Marcus (Client)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Acme Corporation</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PostgreSQL RLS
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-sky-600" /> Google OAuth
          </span>
          <span>·</span>
          <span>Supabase Storage</span>
        </div>
      </div>
    </div>
  );
};
