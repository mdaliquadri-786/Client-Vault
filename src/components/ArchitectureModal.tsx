import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  FolderTree,
  ShieldAlert,
  Code2,
  Key,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  SUPABASE_SQL_SCHEMA,
  NEXTJS_PROJECT_STRUCTURE,
  NEXTJS_MIDDLEWARE_CODE,
} from '../data/nextjsDocs.js';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabaseClient.js';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'structure' | 'middleware' | 'components' | 'connect'>('sql');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Live Supabase configuration state
  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.anonKey);
  const [configSaved, setConfigSaved] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const NEXTJS_LAYOUT_CODE = `// app/dashboard/layout.tsx
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}`;

  const NEXTJS_PAGE_CODE = `// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Dropzone } from '@/components/Dropzone';
import { FileList } from '@/components/FileList';
import { DeleteModal } from '@/components/DeleteModal';

export default function DashboardPage() {
  const [activeFileToDelete, setActiveFileToDelete] = useState(null);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Client Deliverables & Vault
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload and review design deliverables, production assets, and client files.
        </p>
      </div>

      {/* Drag and Drop Upload Area */}
      <Dropzone />

      {/* File Data Table */}
      <FileList onDeleteRequest={(file) => setActiveFileToDelete(file)} />

      {/* Secure Delete Modal */}
      {activeFileToDelete && (
        <DeleteModal
          file={activeFileToDelete}
          onClose={() => setActiveFileToDelete(null)}
        />
      )}
    </div>
  );
}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-arch-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0B1329] text-sky-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-arch-title" className="text-sm font-semibold text-slate-900">
                ClientVault Architecture & Next.js / Supabase Blueprint
              </h2>
              <p className="text-xs text-slate-500">
                Turnkey production files ready for Vercel and Supabase deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close architecture modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-2 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Supabase SQL & RLS</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'structure'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>2. Project Structure</span>
          </button>

          <button
            onClick={() => setActiveTab('middleware')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'middleware'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>3. Edge Middleware</span>
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'components'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Next.js Components</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'connect'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Live Supabase Connect</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-200">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Execute this SQL in your Supabase SQL Editor. Creates the <code className="text-sky-300">files</code> table, private storage bucket, and RLS policies.
                </span>
                <button
                  onClick={() => handleCopy(SUPABASE_SQL_SCHEMA, 'sql')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                >
                  {copiedSection === 'sql' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-black/60 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto text-emerald-300 selection:bg-sky-900 leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Recommended Next.js 15 (App Router) folder structure for Vercel deployment.
                </span>
                <button
                  onClick={() => handleCopy(NEXTJS_PROJECT_STRUCTURE, 'structure')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                >
                  {copiedSection === 'structure' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Tree</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-black/60 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto text-sky-300 leading-relaxed">
                {NEXTJS_PROJECT_STRUCTURE}
              </pre>
            </div>
          )}

          {activeTab === 'middleware' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Place in <code className="text-sky-300">middleware.ts</code> at the root of your Next.js project to guard <code className="text-sky-300">/dashboard</code>.
                </span>
                <button
                  onClick={() => handleCopy(NEXTJS_MIDDLEWARE_CODE, 'middleware')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                >
                  {copiedSection === 'middleware' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Middleware</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-black/60 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto text-amber-200 leading-relaxed">
                {NEXTJS_MIDDLEWARE_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Inspect and copy the complete Next.js (App Router) client components and Supabase utilities.
              </div>

              <div className="space-y-4">
                {/* 1. Supabase Client Utility */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-sky-400 font-mono">1. lib/supabase/client.ts</span>
                    <button
                      onClick={() => handleCopy(`import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}`, 'comp-client')}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                    >
                      {copiedSection === 'comp-client' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300">
{`import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}`}
                  </pre>
                </div>

                {/* 2. File Upload Zone */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-sky-400 font-mono">2. components/Dropzone.tsx</span>
                    <span className="text-[11px] text-slate-400">Uploads to &apos;client-vault-files&apos; bucket &amp; public.files table</span>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-amber-200 max-h-48 overflow-y-auto">
{`// components/Dropzone.tsx
// Uploads physical binary to Supabase Storage, then inserts metadata record into PostgreSQL
const { data, error } = await supabase.storage
  .from('client-vault-files')
  .upload(storagePath, file, { cacheControl: '3600', upsert: false });

const { error: dbError } = await supabase.from('files').insert({
  id: fileId,
  user_id: user.id,
  project_name: projectName,
  name: file.name,
  storage_path: storagePath,
  size_bytes: file.size,
  mime_type: file.type || 'application/octet-stream',
  category: getCategory(file.name),
});`}
                  </pre>
                </div>

                {/* 3. Data Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-sky-400 font-mono">3. components/FileList.tsx</span>
                    <span className="text-[11px] text-slate-400">Fetches from public.files table &amp; creates signed download URLs</span>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200 max-h-48 overflow-y-auto">
{`// components/FileList.tsx
// Fetches list of files protected by RLS
const { data, error } = await supabase
  .from('files')
  .select('*')
  .order('created_at', { ascending: false });

// Downloads with temporary signed URL (60s validity)
const { data: urlData } = await supabase.storage
  .from('client-vault-files')
  .createSignedUrl(file.storage_path, 60);`}
                  </pre>
                </div>

                {/* 4. Delete Modal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-sky-400 font-mono">4. components/DeleteModal.tsx</span>
                    <span className="text-[11px] text-slate-400">Removes from Supabase Storage &amp; deletes DB row</span>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-rose-300">
{`// components/DeleteModal.tsx
// Removes binary object from storage
await supabase.storage.from('client-vault-files').remove([file.storage_path]);

// Erases metadata row from PostgreSQL
await supabase.from('files').delete().eq('id', file.id);`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="max-w-xl mx-auto space-y-5 py-4">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white">
                  Connect Your Supabase Project (Optional)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your live Supabase project to perform real uploads, authentication, and PostgreSQL queries directly in this preview.
                </p>
              </div>

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Supabase Project URL (NEXT_PUBLIC_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Supabase Anon Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSupabaseUrl('');
                      setSupabaseKey('');
                      saveSupabaseConfig('', '');
                      setConfigSaved(true);
                      setTimeout(() => setConfigSaved(false), 2000);
                    }}
                    className="text-slate-400 hover:text-slate-200 underline"
                  >
                    Reset to Local Mock
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>Save Credentials</span>
                  </button>
                </div>

                {configSaved && (
                  <p className="text-emerald-400 text-center font-medium mt-2">
                    ✓ Configuration updated successfully!
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Row Level Security (RLS) is strictly enforced on all tables and storage buckets.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0B1329] text-white rounded-lg hover:bg-[#152347] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
