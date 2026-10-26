-- ==============================================================================
-- CLIENTVAULT: MULTI-CLIENT PORTAL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Target: Supabase (PostgreSQL 15+) with Dynamic Projects & Client Invitations
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the `projects` table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- 3. Create the `project_members` (invites & access) table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'reviewer', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_email ON public.project_members(email);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_token ON public.project_members(invite_token);

-- 4. Create / Update the `files` table referencing project_id
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    category TEXT NOT NULL DEFAULT 'document',
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_storage_path ON public.files(storage_path);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: public.projects Table
-- ------------------------------------------------------------------------------

-- SELECT: Project owners OR active invited members can view the project
CREATE POLICY "Users can view projects they own or belong to"
ON public.projects
FOR SELECT
USING (
    auth.uid() = owner_id
    OR
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE public.project_members.project_id = public.projects.id
          AND (
              public.project_members.user_id = auth.uid()
              OR
              public.project_members.email = (auth.jwt() ->> 'email')
          )
          AND public.project_members.status = 'accepted'
    )
);

-- INSERT: Authenticated users can create projects under their own ownership
CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND
    auth.uid() = owner_id
);

-- UPDATE: Only project owners can edit project metadata
CREATE POLICY "Owners can update their projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only project owners can delete their projects
CREATE POLICY "Owners can delete their projects"
ON public.projects
FOR DELETE
USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: public.project_members Table
-- ------------------------------------------------------------------------------

-- SELECT: Owners can view all members; invited users can view their own invites
CREATE POLICY "Users can view relevant project memberships"
ON public.project_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.project_members.project_id
          AND public.projects.owner_id = auth.uid()
    )
    OR
    user_id = auth.uid()
    OR
    email = (auth.jwt() ->> 'email')
);

-- INSERT: Only project owners can send client invitations
CREATE POLICY "Project owners can invite members"
ON public.project_members
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.project_members.project_id
          AND public.projects.owner_id = auth.uid()
    )
);

-- UPDATE: Project owners can update invites, or clients can accept their own invite
CREATE POLICY "Owners can manage invites and invitees can accept"
ON public.project_members
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.project_members.project_id
          AND public.projects.owner_id = auth.uid()
    )
    OR
    email = (auth.jwt() ->> 'email')
    OR
    user_id = auth.uid()
);

-- DELETE: Project owners can revoke memberships
CREATE POLICY "Project owners can revoke memberships"
ON public.project_members
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.project_members.project_id
          AND public.projects.owner_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: public.files Table
-- ------------------------------------------------------------------------------

-- SELECT: Project owners and project members can view project files
CREATE POLICY "Users can view files in their authorized projects"
ON public.files
FOR SELECT
USING (
    -- User is file uploader
    auth.uid() = user_id
    OR
    -- User is project owner
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.files.project_id
          AND public.projects.owner_id = auth.uid()
    )
    OR
    -- User is accepted project member
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE public.project_members.project_id = public.files.project_id
          AND (public.project_members.user_id = auth.uid() OR public.project_members.email = (auth.jwt() ->> 'email'))
          AND public.project_members.status = 'accepted'
    )
);

-- INSERT: Authenticated project owners and members can upload files
CREATE POLICY "Authorized project participants can upload files"
ON public.files
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND
    auth.uid() = user_id
    AND (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.files.project_id
              AND public.projects.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE public.project_members.project_id = public.files.project_id
              AND (public.project_members.user_id = auth.uid() OR public.project_members.email = (auth.jwt() ->> 'email'))
              AND public.project_members.status = 'accepted'
        )
    )
);

-- DELETE: File uploader or project owner can delete files
CREATE POLICY "Uploaders or project owners can delete files"
ON public.files
FOR DELETE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE public.projects.id = public.files.project_id
          AND public.projects.owner_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKET & STORAGE RLS POLICIES
-- Target Bucket: 'client-vault-files' (Private)
-- Object path convention: '<project_id>/<file_uuid>_<filename>'
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-vault-files',
    'client-vault-files',
    false,
    52428800, -- 50 MB
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

CREATE POLICY "Users can read objects in authorized projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-vault-files'
    AND EXISTS (
        SELECT 1 FROM public.files
        WHERE public.files.storage_path = storage.objects.name
          AND (
              public.files.user_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.projects
                  WHERE public.projects.id = public.files.project_id
                    AND public.projects.owner_id = auth.uid()
              )
              OR EXISTS (
                  SELECT 1 FROM public.project_members
                  WHERE public.project_members.project_id = public.files.project_id
                    AND (public.project_members.user_id = auth.uid() OR public.project_members.email = (auth.jwt() ->> 'email'))
                    AND public.project_members.status = 'accepted'
              )
          )
    )
);

CREATE POLICY "Users can upload objects to their project directory"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client-vault-files'
);

CREATE POLICY "Users can delete their own objects or project objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'client-vault-files'
    AND EXISTS (
        SELECT 1 FROM public.files
        WHERE public.files.storage_path = storage.objects.name
          AND (
              public.files.user_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.projects
                  WHERE public.projects.id = public.files.project_id
                    AND public.projects.owner_id = auth.uid()
              )
          )
    )
);
