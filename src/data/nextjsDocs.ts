export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- CLIENTVAULT: PRODUCTION-READY SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase (PostgreSQL 15+) with Supabase Auth and Supabase Storage
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the files metadata table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL DEFAULT 'Default Project',
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    category TEXT NOT NULL DEFAULT 'document',
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index frequently queried columns for high throughput
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_client_id ON public.files(client_id);
CREATE INDEX IF NOT EXISTS idx_files_project_name ON public.files(project_name);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);

-- Enable Row Level Security (RLS) on public.files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: public.files Table
-- ------------------------------------------------------------------------------

-- POLICY 1: SELECT (View Files)
-- Freelancers can view files they uploaded. Clients can view files assigned to them.
CREATE POLICY "Users can only view their own or assigned files"
ON public.files
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    auth.uid() = client_id
);

-- POLICY 2: INSERT (Upload Files)
-- Authenticated users can insert file records tied to their own auth.uid()
CREATE POLICY "Users can only upload files under their own identity"
ON public.files
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND
    auth.uid() = user_id
);

-- POLICY 3: UPDATE (Modify File metadata or project assignment)
CREATE POLICY "Users can only update their own file metadata"
ON public.files
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- POLICY 4: DELETE (Securely remove files)
CREATE POLICY "Users can only delete their own files"
ON public.files
FOR DELETE
USING (
    auth.uid() = user_id
);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKET CREATION & STORAGE RLS POLICIES
-- Target Bucket: 'client-vault-files' (Private)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-vault-files',
    'client-vault-files',
    false,
    52428800, -- 50 MB in bytes
    ARRAY[
        'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif',
        'application/pdf', 'application/zip', 'application/x-zip-compressed',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv', 'application/json',
        'video/mp4', 'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read objects in their own folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-vault-files'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.files
            WHERE public.files.storage_path = storage.objects.name
              AND (public.files.user_id = auth.uid() OR public.files.client_id = auth.uid())
        )
    )
);

CREATE POLICY "Users can upload objects into their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client-vault-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete objects in their own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'client-vault-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);`;

export const NEXTJS_PROJECT_STRUCTURE = `clientvault/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Email/password authentication page
│   │   └── signup/
│   │       └── page.tsx           # New client or freelancer onboarding
│   ├── dashboard/
│   │   ├── layout.tsx             # Navy sidebar + main content layout
│   │   ├── page.tsx               # Main file portal (dropzone + data table)
│   │   └── settings/
│   │       └── page.tsx           # Profile & client project permissions
│   ├── api/
│   │   └── files/
│   │       └── route.ts           # Optional secure server-side handler
│   ├── favicon.ico
│   ├── globals.css                # Tailwind CSS v4 setup
│   └── layout.tsx                 # Root layout with fonts & auth provider
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── dialog.tsx
│   ├── Sidebar.tsx                # Navy sidebar navigation & storage quota
│   ├── Header.tsx                 # Breadcrumbs, search & quick actions
│   ├── Dropzone.tsx               # Drag & drop upload zone with progress
│   ├── FileList.tsx               # Tabular file data table with delete
│   └── DeleteModal.tsx            # Accessible file removal confirmation
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client (createBrowserClient)
│   │   └── server.ts              # Server Supabase client (createServerClient)
│   └── utils.ts                   # Byte & date formatters
├── middleware.ts                  # Edge middleware protecting /dashboard
├── supabase/
│   └── schema.sql                 # PostgreSQL DDL & RLS policies
├── .env.local                     # Supabase URL & Anon Key for Vercel
├── package.json
└── tailwind.config.ts`;

export const NEXTJS_MIDDLEWARE_CODE = `import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for ClientVault
 * Protects /dashboard routes and syncs session tokens.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check current authenticated session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // Guard protected routes
  if (isDashboardRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};`;
