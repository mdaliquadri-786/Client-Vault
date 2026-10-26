import React from 'react';
import { ShieldCheck, Lock, UserCheck, Key, CheckCircle2, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';

export const SecurityInspector: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { files } = useVault();

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Row Level Security (RLS) & Access Control Inspector
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every file record and storage object is cryptographically scoped to the authenticated tenant.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Simulate Identity:</span>
            <button
              onClick={() => switchRole('freelancer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                user?.role === 'freelancer'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Freelancer (Owner)
            </button>
            <button
              onClick={() => switchRole('client')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                user?.role === 'client'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Client (Restricted)
            </button>
          </div>
        </div>

        {/* Current Identity Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Session auth.uid()</span>
            <span className="font-mono text-slate-900 font-semibold">{user?.id || 'null'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Session auth.role()</span>
            <span className="font-mono text-emerald-700 font-semibold">authenticated</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Portal Access Scope</span>
            <span className="text-slate-900 font-semibold capitalize">
              {user?.role === 'freelancer' ? 'Full Workspace Admin' : 'Single Client Sandbox (Acme Corp)'}
            </span>
          </div>
        </div>
      </div>

      {/* RLS Policies Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900">
            Active PostgreSQL & Storage RLS Policies
          </h3>
          <p className="text-xs text-slate-500">
            Enforced at the database engine level; requests bypassing these policies are rejected by PostgreSQL.
          </p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Policy 1 */}
          <div className="p-5 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  POLICY &quot;Users can only view their own or assigned files&quot; (SELECT)
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium">
                  Enforced
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                Freelancers can view all files in their projects. Clients can only see files where <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">client_id = auth.uid()</code>.
              </p>
              <div className="mt-2 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                USING (auth.uid() = user_id OR auth.uid() = client_id)
              </div>
            </div>
          </div>

          {/* Policy 2 */}
          <div className="p-5 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  POLICY &quot;Users can only upload files under their own identity&quot; (INSERT)
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium">
                  Enforced
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                Guarantees that files cannot be forged under another user ID or client workspace during upload.
              </p>
              <div className="mt-2 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                WITH CHECK (auth.role() = &apos;authenticated&apos; AND auth.uid() = user_id)
              </div>
            </div>
          </div>

          {/* Policy 3 */}
          <div className="p-5 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  POLICY &quot;Users can only delete their own files&quot; (DELETE)
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium">
                  Enforced
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                Clients cannot delete deliverables uploaded by the designer, and other clients cannot delete peer files.
              </p>
              <div className="mt-2 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                USING (auth.uid() = user_id)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
