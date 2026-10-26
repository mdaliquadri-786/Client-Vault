import React from 'react';
import {
  FolderLock,
  Files,
  FolderKanban,
  UploadCloud,
  HardDrive,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import { formatFileSize } from '../utils/formatters.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenArchitectureModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { user, logout } = useAuth();
  const { stats, selectedProject, setSelectedProject, projects } = useVault();

  const percentUsed = Math.min(100, Math.round((stats.usedBytes / stats.maxBytes) * 100));

  return (
    <aside
      className="w-64 shrink-0 bg-[#0B1329] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 select-none font-sans"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#080E1F]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight text-base font-sans block leading-none">
              ClientVault
            </span>
            <span className="block text-[10px] uppercase font-medium tracking-wider text-slate-400 mt-1">
              Secure File Portal
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Security & Project Scope */}
      <div className="p-4 border-b border-slate-800/60 bg-[#0d162e]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium text-[11px] uppercase tracking-wider">Active Scope</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> RLS Active
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-[#14203e] text-slate-200 text-xs rounded-md px-3 py-2 border border-slate-700/80 focus:outline-none focus:border-sky-500 appearance-none font-medium cursor-pointer"
            aria-label="Filter files by project scope"
          >
            <option value="All Projects">All Projects (Overview)</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => setCurrentTab('files')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
            currentTab === 'files'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Files className={`w-4 h-4 shrink-0 ${currentTab === 'files' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span>Files & Deliverables</span>
          <span className="ml-auto text-[11px] font-mono tabular-nums text-slate-400">
            {stats.fileCount}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('projects')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
            currentTab === 'projects'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FolderKanban className={`w-4 h-4 shrink-0 ${currentTab === 'projects' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span>Client Projects</span>
          <span className="ml-auto text-[11px] font-mono tabular-nums text-slate-400">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('upload')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
            currentTab === 'upload'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <UploadCloud className={`w-4 h-4 shrink-0 ${currentTab === 'upload' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span>Upload Deliverable</span>
        </button>
      </nav>

      {/* Dynamic Storage Meter (Real Sum of size_bytes) */}
      <div className="p-4 mx-3 mb-3 bg-[#111a33] rounded-xl border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Storage Used</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums text-[11px]">
            {percentUsed}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.usedBytes > 0 ? Math.max(4, percentUsed) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
          <span>{formatFileSize(stats.usedBytes)}</span>
          <span>{formatFileSize(stats.maxBytes)} max</span>
        </div>
      </div>

      {/* Dynamic User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080E1F] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'CV'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user?.name || 'Vault User'}</p>
            <p className="text-[11px] text-slate-400 truncate font-mono">{user?.email || 'Authenticated'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          title="Sign out of ClientVault"
          aria-label="Sign out of ClientVault"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
