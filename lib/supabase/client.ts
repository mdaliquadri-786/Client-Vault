import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser environments using @supabase/ssr.
 * Reads environment variables configured for Next.js on Vercel
 * (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
 */
export function createClient() {
  const supabaseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof window !== 'undefined' && localStorage.getItem('cv_supabase_url')) ||
    'https://placeholder.supabase.co';

  const supabaseAnonKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof window !== 'undefined' && localStorage.getItem('cv_supabase_anon_key')) ||
    'placeholder-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

