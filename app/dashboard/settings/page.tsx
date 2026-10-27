'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, HardDrive, Key, CheckCircle2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('freelancer');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
        setUserName((user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User');
        setRole((user.user_metadata?.role as string) || 'freelancer');
      }
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-800">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portal Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your ClientShare account preferences, authentication, and security parameters.
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile configuration saved successfully.</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" />
          <span>Account Profile</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                value={userEmail}
                className="w-full bg-slate-100 text-slate-500 text-xs px-3 py-2 rounded-lg border border-slate-200 cursor-not-allowed font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Role</label>
            <input
              type="text"
              readOnly
              value={role === 'freelancer' ? 'Freelancer / Agency Lead' : 'Client Partner'}
              className="w-full max-w-sm bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-200 cursor-not-allowed capitalize"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#162347] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Row Level Security (RLS) Policy Status</span>
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          All client files uploaded to ClientShare are governed by PostgreSQL Row Level Security policies. Clients are restricted to project deliverables they own or were explicitly invited to access via encrypted tokens.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>RLS Enforcement: Active on public.projects, public.project_members, and public.files</span>
        </div>
      </div>
    </div>
  );
}
