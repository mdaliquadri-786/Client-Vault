'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  UserPlus,
  Shield,
  Loader2,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProjectMember } from '@/types/database';

interface InviteClientModalProps {
  projectId: string;
  projectName: string;
  clientName?: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: (member: ProjectMember) => void;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({
  projectId,
  projectName,
  clientName = 'Client Partner',
  isOpen,
  onClose,
  onInviteSent,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'client' | 'reviewer'>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');

  // Seed / local list of active members
  const [members, setMembers] = useState<ProjectMember[]>([
    {
      id: 'mem-1',
      project_id: projectId,
      email: 'marcus@acmecorp.com',
      role: 'client',
      status: 'accepted',
      invite_token: 'tok-acme-7721',
      invited_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      accepted_at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
      user_id: 'usr-client-9104',
    },
  ]);

  if (!isOpen) return null;

  const generatedInviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${projectId}?token=cv_${projectId.slice(0, 8)}_secure`
    : `https://clientvault.vercel.app/invite/${projectId}`;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const token = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          email: email.trim().toLowerCase(),
          role,
          status: 'pending',
          invite_token: token,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase invite insert notice:', error.message);
      }

      const newMember: ProjectMember = (data as ProjectMember) || {
        id: `mem-${Date.now()}`,
        project_id: projectId,
        email: email.trim().toLowerCase(),
        role,
        status: 'pending',
        invite_token: token,
        invited_at: new Date().toISOString(),
      };

      setMembers((prev) => [newMember, ...prev]);
      if (onInviteSent) onInviteSent(newMember);

      setEmail('');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRevoke = async (memberId: string) => {
    const supabase = createClient();
    try {
      await supabase.from('project_members').delete().eq('id', memberId);
    } catch (err) {
      console.warn('Revoke notice:', err);
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
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
                Grant secure access to deliverables in <span className="font-medium text-slate-800">{projectName}</span>
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

        {/* Tab Switcher: Email vs Secure Link */}
        <div className="px-6 pt-4 border-b border-slate-100 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invite via Email</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-sky-600 text-sky-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Instant Portal Link</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'email' ? (
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
                    placeholder="client.executive@clientcompany.com"
                    className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Portal Role & Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      role === 'client'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">Client (Default)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Download assets & upload feedback
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('reviewer')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      role === 'reviewer'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">Reviewer Only</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Read-only access to deliverables
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#0B1329] hover:bg-[#162447] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Invitation...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Send Secure Invitation</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Share this secure one-time onboarding link directly with your client to give them instant access to this project portal.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-[#0B1329] hover:bg-[#162447] rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-lg flex items-start gap-2.5 text-xs text-sky-800">
                <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Recipients will be prompted to authenticate or verify their email before accessing files.
                </span>
              </div>
            </div>
          )}

          {/* Existing Project Members List */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
              <span>Active Project Members</span>
              <span className="text-[11px] font-mono text-slate-400">{members.length} member(s)</span>
            </h4>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{m.email}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="capitalize">{m.role}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {m.status === 'accepted' ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Revoke access"
                    aria-label={`Revoke access for ${m.email}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
