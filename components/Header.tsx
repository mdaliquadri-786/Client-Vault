'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User, Shield, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  onSearch?: (query: string) => void;
  projectName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  projectName = 'All Projects',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Account');
  const [userInitials, setUserInitials] = useState<string>('CV');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email || '';
        const name = (user.user_metadata?.full_name as string) || email.split('@')[0] || 'User';
        setUserEmail(email);
        setUserName(name);
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || email.slice(0, 2).toUpperCase() || 'CV';
        setUserInitials(initials);
      }
    });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) {
      onSearch(val);
    }
  };

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 font-sans z-10">
      {/* Breadcrumbs Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-800 tracking-tight">ClientVault</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-600">{projectName}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-normal">Files</span>
      </nav>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search files or deliverables..."
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
            aria-label="Search files"
          />
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-6 h-6 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-semibold text-[10px]">
              {userInitials}
            </div>
            <span className="font-medium text-slate-700 truncate max-w-[120px]">{userName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{userEmail || 'Authenticated'}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                  <Shield className="w-3 h-3" />
                  <span>RLS Authenticated</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
