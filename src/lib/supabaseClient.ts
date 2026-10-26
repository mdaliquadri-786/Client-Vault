import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage runtime configuration
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('cv_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('cv_supabase_anon_key') : null;

  const url = localUrl || envSupabaseUrl || '';
  const anonKey = localKey || envSupabaseAnonKey || '';
  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return { url, anonKey, isConfigured };
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem('cv_supabase_url', url.trim());
      localStorage.setItem('cv_supabase_anon_key', anonKey.trim());
      clientInstance = null; // reset client instance to reload with new creds
      return true;
    } else {
      localStorage.removeItem('cv_supabase_url');
      localStorage.removeItem('cv_supabase_anon_key');
      clientInstance = null;
      return false;
    }
  }
  return false;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      clientInstance = null;
    }
  }

  return clientInstance;
}
