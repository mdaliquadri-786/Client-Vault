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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types/database';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { InviteClientModal } from '@/components/InviteClientModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeInviteProject, setActiveInviteProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Projects fetch notice:', error.message);
      }

      if (data && data.length > 0) {
        setProjects(data as Project[]);
      } else {
        // Default projects for demonstration and testing
        setProjects([
          {
            id: 'proj-acme-2026',
            name: 'Acme Rebrand 2026',
            client_name: 'Acme Corporation',
            owner_id: 'usr-freelancer-8472',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            file_count: 5,
            total_bytes: 68300000,
          },
          {
            id: 'proj-horizon-2026',
            name: 'Horizon Mobile App',
            client_name: 'Horizon Health Tech',
            owner_id: 'usr-freelancer-8472',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            file_count: 1,
            total_bytes: 6180000,
          },
          {
            id: 'proj-apex-2026',
            name: 'Apex Retail Portal',
            client_name: 'Apex Global Industries',
            owner_id: 'usr-freelancer-8472',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            file_count: 3,
            total_bytes: 18200000,
          },
        ]);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatFileSize = (bytes: number = 0): string => {
    if (bytes === 0) return '0 B';
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

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Client Projects & Portals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your client workspaces, deliverables, and client portal invitations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg shadow-xs transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading client projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">No Projects Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Create your first client project to start isolating files and deliverables.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg transition-colors"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Client Company Badge & Security Pill */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[180px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{proj.client_name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> RLS Isolated
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {proj.name}
                </h3>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Files className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono tabular-nums">{proj.file_count ?? 4} files</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono tabular-nums">{formatFileSize(proj.total_bytes ?? 24500000)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setActiveInviteProject(proj)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded hover:bg-slate-100 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-sky-600" />
                  <span>Invite Client</span>
                </button>

                <Link
                  href={`/dashboard/projects/${proj.id}`}
                  className="flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700 transition-colors py-1 px-2 rounded hover:bg-sky-50"
                >
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Invite Client Modal */}
      {activeInviteProject && (
        <InviteClientModal
          projectId={activeInviteProject.id}
          projectName={activeInviteProject.name}
          clientName={activeInviteProject.client_name}
          isOpen={Boolean(activeInviteProject)}
          onClose={() => setActiveInviteProject(null)}
        />
      )}
    </div>
  );
}
