import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { VaultProvider, useVault } from './context/VaultContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Dropzone } from './components/Dropzone.js';
import { FileList } from './components/FileList.js';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.js';
import { AuthPage } from './components/AuthPage.js';
import { ProjectsView } from './components/ProjectsView.js';
import { InviteClientModal } from '@/components/InviteClientModal';
import { VaultFile } from './types/index.js';
import { UploadCloud, UserPlus } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const { selectedProject, setSelectedProject, projects } = useVault();
  const [currentTab, setCurrentTab] = useState<'files' | 'projects' | 'upload'>('files');
  const [fileToDelete, setFileToDelete] = useState<VaultFile | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showInlineDropzone, setShowInlineDropzone] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans select-none antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab as 'files' | 'projects' | 'upload');
          if (tab === 'files') setShowInlineDropzone(false);
        }}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenUpload={() => {
            if (currentTab !== 'files') {
              setCurrentTab('files');
            }
            setShowInlineDropzone((prev) => !prev);
          }}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* View 1: Files & Deliverables */}
            {currentTab === 'files' && (
              <>
                {/* Title and Action bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      {selectedProject === 'All Projects'
                        ? 'All Deliverables & Client Files'
                        : `${selectedProject} Vault`}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage, organize, and securely share production files with clients using Row Level Security.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {projects.length > 0 && (
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-sky-600" />
                        <span>Invite Client</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowInlineDropzone((prev) => !prev)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162347] rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-sky-400" />
                      <span>{showInlineDropzone ? 'Hide Upload Area' : 'Quick Upload'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible or active Dropzone */}
                {showInlineDropzone && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                    <Dropzone onUploadSuccess={() => setShowInlineDropzone(false)} />
                  </div>
                )}

                {/* Main Data Table */}
                <FileList
                  onDeleteRequest={(file) => setFileToDelete(file)}
                  onOpenUpload={() => setShowInlineDropzone(true)}
                />
              </>
            )}

            {/* View 2: Client Projects Directory */}
            {currentTab === 'projects' && (
              <ProjectsView
                onSelectProject={(projectName) => {
                  setSelectedProject(projectName);
                  setCurrentTab('files');
                }}
              />
            )}

            {/* View 3: Dedicated Upload Zone */}
            {currentTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Upload to Client Vault
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop deliverables and assets into Supabase Storage with Row Level Security.
                  </p>
                </div>

                <Dropzone
                  onUploadSuccess={() => {
                    setTimeout(() => setCurrentTab('files'), 800);
                  }}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <DeleteConfirmModal
          file={fileToDelete}
          onClose={() => setFileToDelete(null)}
        />
      )}

      {/* Invite Client Modal */}
      {isInviteModalOpen && (
        <InviteClientModal
          projectId={selectedProject !== 'All Projects' ? selectedProject : 'project-vault'}
          projectName={selectedProject !== 'All Projects' ? selectedProject : 'Active Project Vault'}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <VaultProvider>
      <DashboardContent />
    </VaultProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
