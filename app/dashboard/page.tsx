'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dropzone } from '@/components/Dropzone';
import { FileList } from '@/components/FileList';
import { DeleteModal } from '@/components/DeleteModal';
import { FileRecord } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FolderKanban, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<FileRecord | null>(null);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(true);
  const [activeProject, setActiveProject] = useState<string>('All Deliverables');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('projects')
      .select('name')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setActiveProject(data[0].name);
        }
      });
  }, []);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedFileToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Client Vault</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-700">{activeProject}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Client Deliverables & Files
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted client file storage secured with PostgreSQL Row Level Security (RLS).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-slate-500" />
            <span>View Projects</span>
          </Link>

          <button
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162347] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>{showUploadZone ? 'Hide Upload Area' : 'Upload Files'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone (Dropzone) */}
      {showUploadZone && (
        <section aria-label="File Upload Dropzone" className="animate-in fade-in slide-in-from-top-2 duration-150">
          <Dropzone
            projectName={activeProject}
            onUploadComplete={handleUploadComplete}
          />
        </section>
      )}

      {/* Main Files Data Table */}
      <section aria-label="Uploaded Files Data Table">
        <FileList
          refreshTrigger={refreshTrigger}
          onDeleteRequest={(file) => setSelectedFileToDelete(file)}
        />
      </section>

      {/* Secure Delete Modal */}
      {selectedFileToDelete && (
        <DeleteModal
          file={selectedFileToDelete}
          onClose={() => setSelectedFileToDelete(null)}
          onDeleted={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
