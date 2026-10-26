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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthPage: React.FC = () => {
  const { login, signup, demoLogin, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      const res = await signup(email, password, name, role);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in.');
      }
    }
  };

  const handleQuickFill = (targetRole: 'freelancer' | 'client') => {
    setError(null);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Lockup */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B1329] text-sky-400 mb-4 shadow-sm border border-slate-800">
          <FolderLock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          ClientVault
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Secure, isolated client file portal powered by Supabase & Next.js
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !isSignUp
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
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
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isSignUp
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
                    className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
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
                  className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
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
                  className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
                />
              </div>
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
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#0B1329] hover:bg-[#162447] focus:outline-none transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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
            <Lock className="w-3.5 h-3.5 text-sky-600" /> Edge Middleware
          </span>
          <span>·</span>
          <span>Supabase Storage</span>
        </div>
      </div>
    </div>
  );
};
