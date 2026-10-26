'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Building2, Mail, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types/database';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) {
      setError('Project name and client name are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id || 'usr-freelancer-8472';
      const projectId = `proj-${Date.now().toString(36)}`;

      // 1. Insert into public.projects table
      const { data, error: dbError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          name: name.trim(),
          client_name: clientName.trim(),
          owner_id: ownerId,
        })
        .select()
        .single();

      if (dbError) {
        console.warn('Supabase project insert notice:', dbError.message);
      }

      // 2. If client email was provided, insert an invitation into public.project_members
      if (clientEmail.trim()) {
        await supabase
          .from('project_members')
          .insert({
            project_id: projectId,
            email: clientEmail.trim().toLowerCase(),
            role: 'client',
            status: 'pending',
            invite_token: `inv_${Date.now().toString(36)}`,
          });
      }

      const createdProject: Project = (data as Project) || {
        id: projectId,
        name: name.trim(),
        client_name: clientName.trim(),
        owner_id: ownerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_count: 0,
        total_bytes: 0,
      };

      onProjectCreated(createdProject);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Project creation failed:', err);
      setError(err?.message || 'Failed to create project.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="create-project-title" className="text-base font-semibold text-slate-900">
                Create New Client Project
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up an isolated vault for a new client partnership.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Mobile Redesign 2026"
              className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Company / Organization *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Client Email (Optional Invite)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. contact@acmecorp.com"
                className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Vault...</span>
                </>
              ) : (
                <>
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
