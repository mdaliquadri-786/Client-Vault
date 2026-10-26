import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth & Auth Code Exchange Callback Handler (app/auth/callback/route.ts)
 * 
 * Securely handles the authorization code exchange on redirect from OAuth providers (e.g. Google)
 * and email confirmations. Sets session cookies via @supabase/ssr and redirects cleanly to
 * /dashboard/projects, stripping code query parameters.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If OAuth provider returned an explicit error parameter
  if (error) {
    console.error('OAuth callback error from provider:', error, errorDescription);
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Next destination defaults to /dashboard/projects
  const next = requestUrl.searchParams.get('next') ?? '/dashboard/projects';

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        // Forwarded host support for reverse proxies (Vercel, Cloud Run, etc.)
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        const targetBase = (!isLocalEnv && forwardedHost) 
          ? `https://${forwardedHost}` 
          : requestUrl.origin;

        // Clean redirection URL stripping auth code parameter
        const targetUrl = new URL(next, targetBase);
        return NextResponse.redirect(targetUrl.toString());
      } else {
        console.error('Supabase auth code exchange error:', exchangeError.message);
      }
    } catch (err: any) {
      console.error('Server exception during auth code exchange:', err);
    }
  }

  // In case of invalid/expired code, safely redirect to login with user-friendly alert
  const failureUrl = new URL('/login', requestUrl.origin);
  failureUrl.searchParams.set('error', 'Authentication session expired or invalid. Please sign in again.');
  return NextResponse.redirect(failureUrl.toString());
}
