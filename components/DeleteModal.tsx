'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FileRecord } from '@/types/database';

interface DeleteModalProps {
  file: FileRecord | null;
  isOpen?: boolean;
  onClose: () => void;
  onDeleted?: (fileId: string) => void;
  onDeleteSuccess?: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  file,
  isOpen = true,
  onClose,
  onDeleted,
  onDeleteSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!file || !isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  /**
   * Two-Step Atomic File Deletion:
   * 1. Remove physical binary object from private Supabase Storage bucket 'client-vault-files'
   * 2. Delete the metadata record from 'public.files' table (enforced by RLS)
   */
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const supabase = createClient();

    try {
      // 1. Remove the physical binary from Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('client-vault-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Storage bucket deletion warning:', storageError.message);
      }

      // 2. Delete metadata row from public.files table
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (onDeleted) onDeleted(file.id);
      if (onDeleteSuccess) onDeleteSuccess();
      onClose();
    } catch (err: any) {
      console.error('Delete operation failed:', err);
      setErrorMessage(
        err?.message || 'Failed to delete file. Check your Row Level Security permissions.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start gap-4 bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-slate-900">
              Permanently Delete Deliverable?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              This purges the binary from Supabase Storage and erases the database record.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target File Details */}
        <div className="p-5 bg-slate-50/60 border-b border-slate-100 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">File Name:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[220px]">
              {file.name}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">Size:</span>
            <span className="font-mono tabular-nums">{formatFileSize(file.size_bytes)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">Storage Location:</span>
            <span className="font-mono text-[11px] text-slate-500 truncate max-w-[220px]">
              client-vault-files/{file.storage_path}
            </span>
          </div>
        </div>

        {/* Error notification if RLS check fails */}
        {errorMessage && (
          <div className="mx-5 my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Deletion Error</p>
              <p className="mt-0.5 text-[11px] text-rose-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
