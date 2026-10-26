import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultUser } from '../types/index.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

interface AuthContextType {
  user: VaultUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: 'freelancer' | 'client') => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'freelancer' | 'client') => void;
  demoLogin: (role: 'freelancer' | 'client') => void;
}

const DEMO_FREELANCER: VaultUser = {
  id: 'usr-freelancer-8472',
  email: 'elena.designer@studioflow.design',
  name: 'Elena Rostova',
  role: 'freelancer',
  company: 'Studio Flow Creative',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
};

const DEMO_CLIENT: VaultUser = {
  id: 'usr-client-9104',
  email: 'marcus@acmecorp.com',
  name: 'Marcus Vance',
  role: 'client',
  company: 'Acme Corporation',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<VaultUser | null>(DEMO_FREELANCER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session or listen to Supabase auth state if configured
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@clientvault.io',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
            company: session.user.user_metadata?.company || 'ClientVault Member',
          });
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@clientvault.io',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
            company: session.user.user_metadata?.company || 'ClientVault Member',
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local session
      const savedUser = localStorage.getItem('cv_current_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(DEMO_FREELANCER);
        }
      } else {
        // Default to demo freelancer on first load for instant accessibility
        setUser(DEMO_FREELANCER);
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setIsLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const loggedUser: VaultUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: (data.user.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
          company: data.user.user_metadata?.company || 'ClientVault Member',
        };
        setUser(loggedUser);
        localStorage.setItem('cv_current_user', JSON.stringify(loggedUser));
        return { success: true };
      }
    }

    // Local authentication fallback for prototyping
    await new Promise((r) => setTimeout(r, 400));
    if (!email || !password) {
      setIsLoading(false);
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const isClient = email.toLowerCase().includes('client') || email.toLowerCase().includes('acme');
    const newUser: VaultUser = isClient
      ? { ...DEMO_CLIENT, email }
      : { ...DEMO_FREELANCER, email, name: email.split('@')[0] };

    setUser(newUser);
    localStorage.setItem('cv_current_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: 'freelancer' | 'client'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
          },
        },
      });

      setIsLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const loggedUser: VaultUser = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          role,
          company: role === 'freelancer' ? 'Design Studio' : 'Client Partner',
        };
        setUser(loggedUser);
        localStorage.setItem('cv_current_user', JSON.stringify(loggedUser));
        return { success: true };
      }
    }

    // Local signup simulation
    await new Promise((r) => setTimeout(r, 400));
    if (!email || !password || !name) {
      setIsLoading(false);
      return { success: false, error: 'All fields are required.' };
    }

    const newUser: VaultUser = {
      id: `usr-${Date.now().toString(36)}`,
      email,
      name,
      role,
      company: role === 'freelancer' ? `${name}'s Creative Studio` : 'Client Partner Ltd',
    };

    setUser(newUser);
    localStorage.setItem('cv_current_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/auth/callback?next=/dashboard/projects`,
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data?.url) {
          window.location.href = data.url;
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message };
      }
    }

    // Interactive preview fallback: simulate authenticated Google login
    await new Promise((r) => setTimeout(r, 600));
    const googleUser: VaultUser = {
      id: 'usr-google-3910',
      email: 'alex.rivera.design@gmail.com',
      name: 'Alex Rivera (Google)',
      role: 'freelancer',
      company: 'Rivera Creative Studio',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80',
    };
    setUser(googleUser);
    localStorage.setItem('cv_current_user', JSON.stringify(googleUser));
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.signOut().catch(console.warn);
    }
    setUser(null);
    localStorage.removeItem('cv_current_user');
  };

  const switchRole = (role: 'freelancer' | 'client') => {
    if (!user) return;
    const base = role === 'freelancer' ? DEMO_FREELANCER : DEMO_CLIENT;
    const updated: VaultUser = {
      ...base,
    };
    setUser(updated);
    localStorage.setItem('cv_current_user', JSON.stringify(updated));
  };

  const demoLogin = (role: 'freelancer' | 'client') => {
    const target = role === 'freelancer' ? DEMO_FREELANCER : DEMO_CLIENT;
    setUser(target);
    localStorage.setItem('cv_current_user', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        signInWithGoogle,
        logout,
        switchRole,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
