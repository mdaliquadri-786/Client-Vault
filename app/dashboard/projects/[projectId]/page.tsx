'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Dropzone } from '@/components/Dropzone';
import { FileList } from '@/components/FileList';
import { DeleteModal } from '@/components/DeleteModal';
import { InviteClientModal } from '@/components/InviteClientModal';
import { FileRecord, Project } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import {
  UploadCloud,
  ChevronLeft,
  UserPlus,
  Building2,
  ShieldCheck,
  FolderLock,
  Loader2,
  FolderOpen,
} from 'lucide-react';

export default function ProjectVaultPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || '';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUploadZone, setShowUploadZone] = useState(true);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<FileRecord | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectDetails = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (data) {
          setProject(data as Project);
        } else {
          setProject(null);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
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
      <div className="p-16 text-center flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500">Securing client vault...</p>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center font-sans">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <FolderOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Project Vault Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested project vault could not be found or you do not have permission to access it under Row Level Security.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1329] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Projects Directory</span>
        </Link>
      </div>
    );
  }

  const projectName = project?.name || 'Project Vault';
  const clientName = project?.client_name || 'Client Partner';

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Navigation Breadcrumb & Back Link */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Projects</span>
        </Link>

        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Project RLS Isolated: {projectId}</span>
        </span>
      </div>

      {/* Project Vault Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{clientName}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {projectName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated secure vault for files, deliverables, and feedback exchanges.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-600" />
            <span>Invite Client</span>
          </button>

          <button
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{showUploadZone ? 'Hide Upload' : 'Upload Files'}</span>
          </button>
        </div>
      </div>

      {/* Project-Scoped Drag & Drop Upload Zone */}
      {showUploadZone && (
        <section aria-label="Project File Upload">
          <Dropzone
            projectId={projectId}
            projectName={projectName}
            onUploadComplete={handleUploadComplete}
          />
        </section>
      )}

      {/* Project-Scoped File List Data Table */}
      <section aria-label="Project Deliverables Table">
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
          projectId={projectId}
          projectName={projectName}
          clientName={clientName}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
