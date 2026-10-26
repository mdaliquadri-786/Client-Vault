import React from 'react';
import { Search, Plus, Code, ShieldCheck, Database } from 'lucide-react';
import { useVault } from '../context/VaultContext.js';
import { useAuth } from '../context/AuthContext.js';
import { getSupabaseConfig } from '../lib/supabaseClient.js';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenArchitectureModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenArchitectureModal,
}) => {
  const { searchQuery, setSearchQuery, selectedProject } = useVault();
  const { user } = useAuth();
  const { isConfigured } = getSupabaseConfig();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-slate-800">ClientVault</span>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-slate-600">{selectedProject}</span>
        <span className="text-slate-400">/</span>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
          {user?.role === 'freelancer' ? 'Freelancer Admin' : 'Client View'}
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
            placeholder="Search files or uploaders..."
            className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:text-slate-400"
            aria-label="Search files"
          />
        </div>

        {/* Supabase status badge / modal button */}
        <button
          onClick={onOpenArchitectureModal}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/80"
          title="Inspect Supabase SQL, RLS Policies, and Next.js Architecture"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase SQL & RLS</span>
        </button>

        {/* Primary Action Button: Upload */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0B1329] hover:bg-[#152347] rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>
    </header>
  );
};
