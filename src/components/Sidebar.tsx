import React from 'react';
import {
  FolderLock,
  Files,
  FolderKanban,
  UploadCloud,
  ShieldCheck,
  Code2,
  HardDrive,
  LogOut,
  Users,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import { formatFileSize } from '../utils/formatters.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenArchitectureModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenArchitectureModal,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { stats, selectedProject, setSelectedProject, projects } = useVault();

  const percentUsed = Math.min(100, Math.round((stats.usedBytes / stats.maxBytes) * 100));

  return (
    <aside
      className="w-64 shrink-0 bg-[#0B1329] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 select-none"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#080E1F]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight text-base font-sans">
              ClientVault
            </span>
            <span className="block text-[10px] uppercase font-medium tracking-wider text-slate-400">
              Secure File Portal
            </span>
          </div>
        </div>
      </div>

      {/* Client Project Selector */}
      <div className="p-4 border-b border-slate-800/60 bg-[#0d162e]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-medium">Active Portal Scope</span>
          <span className="text-[11px] text-sky-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> RLS Active
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
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
            currentTab === 'files'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Files className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Files & Deliverables</span>
          <span className="ml-auto text-[11px] font-mono tabular-nums text-slate-400">
            {stats.fileCount}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('projects')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
            currentTab === 'projects'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FolderKanban className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Client Projects</span>
          <span className="ml-auto text-[11px] font-mono tabular-nums text-slate-400">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('upload')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
            currentTab === 'upload'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <UploadCloud className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Upload Files</span>
        </button>

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Architecture & Specs
          </span>
        </div>

        <button
          onClick={onOpenArchitectureModal}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors text-left"
        >
          <Code2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Supabase SQL & RLS</span>
        </button>

        <button
          onClick={() => setCurrentTab('security')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
            currentTab === 'security'
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
          <span>Security & RLS Inspector</span>
        </button>

        {/* Role Testing Sandbox */}
        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Test Access Role
          </span>
        </div>

        <div className="px-3 py-2 bg-[#121b36] rounded-md border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Viewing Mode:</span>
            <span className="font-semibold text-slate-200 capitalize">
              {user?.role === 'freelancer' ? 'Freelancer (Owner)' : 'Client (Restricted)'}
            </span>
          </div>

          <div className="flex gap-1.5 pt-1">
            <button
              onClick={() => switchRole('freelancer')}
              className={`flex-1 py-1 px-2 text-[11px] rounded font-medium transition-colors ${
                user?.role === 'freelancer'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Freelancer
            </button>
            <button
              onClick={() => switchRole('client')}
              className={`flex-1 py-1 px-2 text-[11px] rounded font-medium transition-colors ${
                user?.role === 'client'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Client
            </button>
          </div>
        </div>
      </nav>

      {/* Storage Quota Card */}
      <div className="p-4 mx-3 mb-3 bg-[#111a33] rounded-lg border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Storage Used</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums">
            {percentUsed}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(4, percentUsed)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
          <span>{formatFileSize(stats.usedBytes)}</span>
          <span>{formatFileSize(stats.maxBytes)} max</span>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080E1F] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'CV'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          title="Sign out"
          aria-label="Sign out of ClientVault"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
