import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultUser } from '../types/index.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

interface AuthContextType {
  user: VaultUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role?: 'freelancer' | 'client') => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<VaultUser | null>(null);
  // isLoading only guards initial session resolution, never form submissions
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Restore session from Supabase Auth or local storage
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          const u = session.user;
          const email = u.email || '';
          const name = (u.user_metadata?.full_name as string) || email.split('@')[0] || 'Vault User';
          setUser({
            id: u.id,
            email,
            name,
            role: (u.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
            company: (u.user_metadata?.company as string) || 'ClientVault Member',
          });
        } else {
          // Check local stored session
          const savedUser = localStorage.getItem('cv_current_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setIsInitializing(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const u = session.user;
          const email = u.email || '';
          const name = (u.user_metadata?.full_name as string) || email.split('@')[0] || 'Vault User';
          const newUser: VaultUser = {
            id: u.id,
            email,
            name,
            role: (u.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
            company: (u.user_metadata?.company as string) || 'ClientVault Member',
          };
          setUser(newUser);
          localStorage.setItem('cv_current_user', JSON.stringify(newUser));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('cv_current_user');
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      const savedUser = localStorage.getItem('cv_current_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            return {
              success: false,
              error: 'Invalid email or password. Please verify your credentials or create a new account.',
            };
          }
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return {
              success: false,
              error: 'Please confirm your email address before signing in.',
            };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const loggedUser: VaultUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: (data.user.user_metadata?.role as 'freelancer' | 'client') || 'freelancer',
            company: (data.user.user_metadata?.company as string) || 'ClientVault Member',
          };
          setUser(loggedUser);
          localStorage.setItem('cv_current_user', JSON.stringify(loggedUser));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Login failed.' };
      }
    }

    // Local fallback session
    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: VaultUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: 'freelancer',
      company: 'ClientVault Workspace',
    };

    setUser(newUser);
    localStorage.setItem('cv_current_user', JSON.stringify(newUser));
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: 'freelancer' | 'client' = 'freelancer'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanName = name.trim();

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard/projects`,
            data: {
              full_name: cleanName,
              role,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.session && data.user) {
          const newUser: VaultUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: cleanName,
            role,
            company: 'ClientVault Member',
          };
          setUser(newUser);
          localStorage.setItem('cv_current_user', JSON.stringify(newUser));
          return { success: true };
        }

        return {
          success: true,
          error: undefined,
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Sign up failed.' };
      }
    }

    // Local fallback
    const newUser: VaultUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanName || cleanEmail.split('@')[0],
      role,
      company: 'ClientVault Workspace',
    };

    setUser(newUser);
    localStorage.setItem('cv_current_user', JSON.stringify(newUser));
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase URL and API Key must be configured for Google OAuth.' };
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard/projects`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google OAuth failed' };
    }
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out notice:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('cv_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isInitializing,
        login,
        signup,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
