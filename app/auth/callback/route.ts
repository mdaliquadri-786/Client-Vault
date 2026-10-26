import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth Callback Route Handler (app/auth/callback/route.ts)
 * 
 * Handles the OAuth exchange code on redirect from providers (e.g. Google),
 * sets the secure HTTP-only session cookies via @supabase/ssr, and redirects
 * the authenticated user directly into their projects vault.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 'next' param defaults to /dashboard/projects if not specified
  const next = searchParams.get('next') ?? '/dashboard/projects';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Successfully exchanged OAuth authorization code for persistent session
        const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before reverse proxy
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          // In local dev, redirect to origin
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error('Supabase code exchange error:', error.message);
      }
    } catch (err) {
      console.error('OAuth callback server exception:', err);
    }
  }

  // Return the user to an error page or login with informative query parameter
  return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
}
