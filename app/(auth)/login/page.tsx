'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderLock, Mail, Lock, User, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Google OAuth Authentication
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setOauthLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/auth/callback?next=/dashboard/projects`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // If data.url is returned, the browser redirects to Google's consent screen
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMessage(err.message || 'Unable to connect with Google. Please try again.');
      setOauthLoading(false);
    }
  };

  // 2. Email / Password Sign In & Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client validation
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!fullName.trim()) {
          setErrorMessage('Please enter your full name to create an account.');
          setLoading(false);
          return;
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const emailRedirectTo = `${origin}/auth/callback?next=/dashboard/projects`;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim(),
              role: 'freelancer', // Default creator account
            },
          },
        });

        if (error) throw error;

        // If email confirmation is enabled, notify user; otherwise redirect
        if (data?.session) {
          router.push('/dashboard/projects');
        } else {
          setSuccessMessage(
            'Account created! Please check your email inbox to confirm your registration.'
          );
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          // Provide user-friendly feedback
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please verify your credentials.');
          }
          throw error;
        }

        if (data.session) {
          router.push('/dashboard/projects');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B1329] text-sky-400 mb-4 shadow-sm border border-slate-800">
          <FolderLock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">ClientVault</h2>
        <p className="mt-1 text-xs text-slate-500">
          Industrial-grade client file portal with Row Level Security
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
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
                setErrorMessage(null);
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
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Multi-Provider: Prominent "Continue with Google" Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading || loading}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50"
          >
            {oauthLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' Icon */}
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

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#0B1329] hover:bg-slate-800 focus:outline-none transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
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
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Protected with AES-256 Supabase Storage & Row Level Security</span>
        </div>
      </div>
    </div>
  );
}
