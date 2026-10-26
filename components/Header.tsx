'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, User, Shield, Bell } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  projectName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  projectName = 'Acme Rebrand 2026',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) {
      onSearch(val);
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

        {/* Profile Dropdown Placeholder */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-6 h-6 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-semibold text-[10px]">
              ER
            </div>
            <span className="font-medium text-slate-700">Elena Rostova</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">Elena Rostova</p>
                <p className="text-[11px] text-slate-500 font-mono">elena@studioflow.design</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Freelancer Admin (RLS Owner)</span>
                </div>
              </div>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              >
                Portal Settings
              </button>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              >
                Client Access Permissions
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
