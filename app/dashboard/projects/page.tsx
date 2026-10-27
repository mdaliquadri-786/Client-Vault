'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderPlus,
  FolderKanban,
  Building2,
  Files,
  HardDrive,
  UserPlus,
  ArrowRight,
  Clock,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types/database';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { InviteClientModal } from '@/components/InviteClientModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeInviteProject, setActiveInviteProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage(null);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Projects fetch error:', error.message);
        setErrorMessage('Unable to load client projects from database.');
        setProjects([]);
      } else {
        setProjects((data as Project[]) || []);
      }
    } catch (err: any) {
      console.error('Fetch projects exception:', err);
      setErrorMessage('Network or server error while loading projects.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatFileSize = (bytes: number = 0): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              ClientShare Vaults
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Client Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated project vaults with isolated Row Level Security access controls.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1329] text-white text-xs font-semibold hover:bg-[#162347] transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <FolderPlus className="w-4 h-4 text-sky-400" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 text-sky-600 animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">Querying projects from database...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-6 text-center bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No client projects found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            Create your first project vault to organize deliverables, upload assets, and invite clients with isolated Row Level Security.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1329] text-white text-xs font-semibold hover:bg-[#162347] transition-colors shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-sky-400" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Client badge & RLS status */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{project.client_name || 'Client Partner'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>RLS Protected</span>
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                  {project.name}
                </h3>

                {/* Metadata Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Files className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.file_count ?? 0} deliverables</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatFileSize(project.total_bytes ?? 0)}</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Created {formatDate(project.created_at)}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveInviteProject(project)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Invite Client"
                  aria-label="Invite Client"
                >
                  <UserPlus className="w-4 h-4 text-sky-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => {
          setIsCreateModalOpen(false);
          fetchProjects();
        }}
      />

      {/* Invite Client Modal */}
      {activeInviteProject && (
        <InviteClientModal
          isOpen={Boolean(activeInviteProject)}
          projectId={activeInviteProject.id}
          projectName={activeInviteProject.name}
          clientName={activeInviteProject.client_name}
          onClose={() => setActiveInviteProject(null)}
        />
      )}
    </div>
  );
}
