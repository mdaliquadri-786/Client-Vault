import { createBrowserClient } from '@supabase/ssr';

/**
 * Normalizes Supabase URL by removing any trailing `/rest/v1` or `/` path segments.
 * Prevents invalid storage API endpoints (e.g. `/rest/v1/storage/v1/object/...`)
 */
function sanitizeSupabaseUrl(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Creates a Supabase client for browser environments using @supabase/ssr.
 * Reads environment variables configured for Next.js on Vercel
 * (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
 */
export function createClient() {
  const rawUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof window !== 'undefined' && (localStorage.getItem('clientshare_supabase_url') || localStorage.getItem('cv_supabase_url'))) ||
    'https://placeholder.supabase.co';

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);

  const supabaseAnonKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof window !== 'undefined' && (localStorage.getItem('clientshare_supabase_anon_key') || localStorage.getItem('cv_supabase_anon_key'))) ||
    'placeholder-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
