import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  FolderKanban,
  Building2,
  Files,
  HardDrive,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Project } from '../types/index.js';
import { formatFileSize } from '../utils/formatters.js';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { InviteClientModal } from '@/components/InviteClientModal';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.js';

interface ProjectsViewProps {
  onSelectProject: (projectName: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProject }) => {
  const { user } = useAuth();
  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cv_projects_cache');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeInviteProject, setActiveInviteProject] = useState<Project | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (supabase) {
      supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (!error && data) {
            setProjectsList(data as Project[]);
            localStorage.setItem('cv_projects_cache', JSON.stringify(data));
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProjectCreated = (newProject: any) => {
    const updated = [newProject, ...projectsList];
    setProjectsList(updated);
    localStorage.setItem('cv_projects_cache', JSON.stringify(updated));
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Client Projects & Portals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your client workspaces, deliverables, and client portal invitations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FolderPlus className="w-4 h-4 text-sky-400" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading client vaults...</p>
        </div>
      ) : projectsList.length === 0 ? (
        /* Clean Modern Empty State */
        <div className="py-16 px-6 text-center bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            No client projects found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-5">
            Create your first client project vault to organize deliverables and invite clients with isolated Row Level Security.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-sky-400" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projectsList.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Client Badge */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[170px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{proj.client_name || 'Client Partner'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> RLS Scoped
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors text-base">
                  {proj.name}
                </h3>

                {/* Meta details */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Files className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.file_count || 0} files</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatFileSize(proj.total_bytes || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectProject(proj.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveInviteProject(proj)}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
        onProjectCreated={handleProjectCreated}
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
};
