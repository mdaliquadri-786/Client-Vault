'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  LayoutDashboard,
  FolderKanban,
  Settings,
  HardDrive,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  activeItem?: 'dashboard' | 'projects' | 'settings';
  onNavigate?: (item: 'dashboard' | 'projects' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'dashboard',
  onNavigate,
}) => {
  const [currentNav, setCurrentNav] = useState<'dashboard' | 'projects' | 'settings'>(activeItem);
  const [userEmail, setUserEmail] = useState<string>('freelancer@clientvault.io');
  const [userName, setUserName] = useState<string>('Elena Rostova');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || 'user@clientvault.io');
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vault User');
      }
    });
  }, []);

  const handleNavClick = (item: 'dashboard' | 'projects' | 'settings') => {
    setCurrentNav(item);
    if (onNavigate) {
      onNavigate(item);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    // Redirect to login page in Next.js App Router
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

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
      <div className="px-5 py-3 border-b border-slate-800/60 bg-[#0d162e] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-sky-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Row Level Security
        </span>
        <span className="text-[11px] font-mono text-emerald-400">Active</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
            </button>
          );
        })}
      </nav>

      {/* Storage Quota Progress Card */}
      <div className="p-4 mx-3 mb-3 bg-[#111a33] rounded-xl border border-slate-800/90 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Storage Quota</span>
          </div>
          <span className="text-slate-400 font-mono tabular-nums text-[11px]">
            14.2%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-300"
            style={{ width: '14.2%' }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
          <span>1.42 GB</span>
          <span>10.0 GB max</span>
        </div>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080E1F] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate font-mono">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
          title="Sign Out of ClientVault"
          aria-label="Sign Out of ClientVault"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
