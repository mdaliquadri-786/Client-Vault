'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderLock,
  LayoutDashboard,
  FolderKanban,
  Settings,
  HardDrive,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  activeItem?: 'dashboard' | 'projects' | 'settings';
  onNavigate?: (item: 'dashboard' | 'projects' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onNavigate,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Account');
  const [userInitials, setUserInitials] = useState<string>('CV');
  const [usedBytes, setUsedBytes] = useState<number>(0);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(true);

  // Standard allocated storage quota tier (5.0 GB)
  const maxBytes = 5 * 1024 * 1024 * 1024;

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Fetch authenticated user details
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      if (user) {
        const email = user.email || '';
        const name = (user.user_metadata?.full_name as string) || email.split('@')[0] || 'Vault User';
        setUserEmail(email);
        setUserName(name);

        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || email.slice(0, 2).toUpperCase() || 'CV';
        setUserInitials(initials);

        // 2. Fetch real sum of size_bytes from public.files for the logged-in user
        supabase
          .from('files')
          .select('size_bytes')
          .then(({ data, error }) => {
            if (!isMounted) return;
            if (!error && data) {
              const total = data.reduce((acc, row) => acc + (Number(row.size_bytes) || 0), 0);
              setUsedBytes(total);
            }
            setIsLoadingStorage(false);
          });
      } else {
        setIsLoadingStorage(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const percentUsed = Math.min(100, Math.round((usedBytes / maxBytes) * 100));

  // Determine active route state
  const isDashboardActive = activeItem === 'dashboard' || pathname === '/dashboard';
  const isProjectsActive = activeItem === 'projects' || pathname?.startsWith('/dashboard/projects');
  const isSettingsActive = activeItem === 'settings' || pathname === '/dashboard/settings';

  return (
    <aside
      className="w-64 shrink-0 bg-[#0B1329] text-slate-300 flex flex-col h-screen border-r border-slate-800/80 select-none font-sans"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-[#080E1F]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight text-base font-sans block leading-none">
              ClientVault
            </span>
            <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400 mt-1 block">
              Secure File Portal
            </span>
          </div>
        </div>
      </div>

      {/* Security Status Banner */}
      <div className="px-5 py-2.5 border-b border-slate-800/60 bg-[#0d162e] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-sky-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Row Level Security
        </span>
        <span className="text-[11px] font-mono text-emerald-400">Active</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Portal Menu
          </span>
        </div>

        <Link
          href="/dashboard"
          onClick={() => onNavigate?.('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
            isDashboardActive
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </div>
          {isDashboardActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
        </Link>

        <Link
          href="/dashboard/projects"
          onClick={() => onNavigate?.('projects')}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
            isProjectsActive
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderKanban className={`w-4 h-4 shrink-0 ${isProjectsActive ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Client Projects</span>
          </div>
          {isProjectsActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
        </Link>

        <Link
          href="/dashboard/settings"
          onClick={() => onNavigate?.('settings')}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
            isSettingsActive
              ? 'bg-sky-500/15 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Settings</span>
          </div>
          {isSettingsActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
        </Link>
      </nav>

      {/* Dynamic Storage Meter (Real Sum of size_bytes from public.files) */}
      <div className="p-4 mx-3 mb-3 bg-[#111a33] rounded-xl border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Storage Meter</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums text-[11px]">
            {isLoadingStorage ? '...' : `${percentUsed}%`}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${usedBytes > 0 ? Math.max(4, percentUsed) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
          <span>{isLoadingStorage ? 'Calculating...' : formatFileSize(usedBytes)}</span>
          <span>{formatFileSize(maxBytes)} max</span>
        </div>
      </div>

      {/* Dynamic User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080E1F] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate font-mono">
              {userEmail || 'Authenticated'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Sign Out of ClientVault"
          aria-label="Sign Out of ClientVault"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
