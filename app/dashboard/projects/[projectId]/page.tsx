'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FolderKanban,
  ChevronRight,
  UploadCloud,
  UserPlus,
  ArrowLeft,
  Building2,
  HardDrive,
  ShieldCheck,
  Loader2,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Project, FileRecord } from '@/types/database';
import { Dropzone } from '@/components/Dropzone';
import { FileList } from '@/components/FileList';
import { DeleteModal } from '@/components/DeleteModal';
import { InviteClientModal } from '@/components/InviteClientModal';

export default function ProjectPortalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) || '';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<FileRecord | null>(null);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const supabase = createClient();

    setLoading(true);
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && data) {
          setProject(data as Project);
        } else {
          console.warn('Project query notice:', error?.message);
          // Fallback project representation if project record is brand new or offline
          setProject({
            id: projectId,
            name: projectId.replace(/[-_]/g, ' '),
            client_name: 'Client Partner',
            owner_id: 'usr-freelancer-8472',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedFileToDelete(null);
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Securing project portal...</p>
      </div>
    );
  }

  const projectName = project?.name || 'Project Vault';

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link
              href="/dashboard/projects"
              className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium text-slate-600"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Projects</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{projectName}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {projectName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{project?.client_name || 'Client Portal'}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Dedicated project vault. All files uploaded here are isolated under project <span className="font-mono text-slate-700">{projectId}</span> with Row Level Security.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-600" />
            <span>Invite Client</span>
          </button>

          <button
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1329] text-white hover:bg-[#162347] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>{showUploadZone ? 'Hide Upload Area' : 'Upload Deliverables'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      {showUploadZone && (
        <section aria-label="Project Deliverable Upload" className="animate-in fade-in slide-in-from-top-2 duration-150">
          <Dropzone
            projectId={projectId}
            projectName={projectName}
            onUploadComplete={handleUploadComplete}
          />
        </section>
      )}

      {/* Deliverables Data Table */}
      <section aria-label="Project Files Table">
        <FileList
          projectId={projectId}
          refreshTrigger={refreshTrigger}
          onDeleteRequest={(file) => setSelectedFileToDelete(file)}
        />
      </section>

      {/* Delete Confirmation Modal */}
      {selectedFileToDelete && (
        <DeleteModal
          file={selectedFileToDelete}
          onClose={() => setSelectedFileToDelete(null)}
          onDeleted={handleDeleteSuccess}
        />
      )}

      {/* Client Invitation Modal */}
      {isInviteModalOpen && (
        <InviteClientModal
          isOpen={isInviteModalOpen}
          projectId={projectId}
          projectName={projectName}
          clientName={project?.client_name}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
