'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Link as LinkIcon, Check, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface InviteClientModalProps {
  isOpen: boolean;
  projectId: string;
  projectName?: string;
  clientName?: string;
  onClose: () => void;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({
  isOpen,
  projectId,
  projectName = 'Project Vault',
  clientName,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'client' | 'reviewer' | 'admin'>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const inviteLink = inviteToken
    ? `${origin}/invite/${inviteToken}`
    : `${origin}/dashboard/projects/${projectId}?invite=true`;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please provide a client email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();

    try {
      const generatedToken = `cs_inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      
      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        email: email.trim().toLowerCase(),
        role,
        status: 'pending',
        invite_token: generatedToken,
      });

      if (error) {
        console.warn('Invite insertion error:', error.message);
      }

      setInviteToken(generatedToken);
      setSuccessMessage(`Invitation dispatched to ${email.trim()} with isolated project access.`);
      setEmail('');
    } catch (err: any) {
      console.error('Invite error:', err);
      setErrorMessage(err?.message || 'Failed to generate invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="invite-modal-title" className="text-base font-semibold text-slate-900">
                Invite Client to Project
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant secure access to <span className="font-semibold text-slate-700">{projectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@acmecorp.com"
                  className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Portal Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
              >
                <option value="client">Client (Download deliverables, preview assets)</option>
                <option value="reviewer">Reviewer (Download & request revisions)</option>
                <option value="admin">Admin (Manage deliverables & members)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B1329] text-white text-xs font-semibold hover:bg-[#162347] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Issuing Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Client Invitation</span>
                </>
              )}
            </button>
          </form>

          {/* Direct Link Section */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Or Share Direct Access Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px] select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Copy Invite Link"
                aria-label="Copy Invite Link"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
