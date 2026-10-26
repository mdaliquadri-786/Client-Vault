import React from 'react';
import { Search, Plus, ShieldCheck } from 'lucide-react';
import { useVault } from '../context/VaultContext.js';
import { useAuth } from '../context/AuthContext.js';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenArchitectureModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
}) => {
  const { searchQuery, setSearchQuery, selectedProject } = useVault();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 font-sans select-none">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-800 tracking-tight">ClientVault</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{selectedProject}</span>
        <span className="text-slate-300">/</span>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>RLS Active</span>
        </span>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverables..."
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
            aria-label="Search files"
          />
        </div>

        {/* Primary Action Button: Upload */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#152347] rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Upload File</span>
        </button>
      </div>
    </header>
  );
};
