import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { VaultFile } from '../types/index.js';
import { useVault } from '../context/VaultContext.js';
import { formatFileSize, formatDate } from '../utils/formatters.js';

interface DeleteConfirmModalProps {
  file: VaultFile | null;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  file,
  onClose,
}) => {
  const { deleteFile } = useVault();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!file) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const result = await deleteFile(file.id);

    setIsDeleting(false);
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to delete file.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-slate-900">
              Permanently Delete File?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This action will remove the record from PostgreSQL and purge the file from Supabase Storage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Target Summary */}
        <div className="p-5 bg-slate-50/60 border-b border-slate-100 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">File Name:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[220px]">
              {file.name}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">Size:</span>
            <span className="font-mono tabular-nums">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">Uploaded:</span>
            <span className="font-mono tabular-nums">{formatDate(file.uploaded_at)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-500">Uploaded By:</span>
            <span className="font-medium text-slate-800">{file.uploader_name}</span>
          </div>
        </div>

        {/* Error message (e.g., RLS permission violation) */}
        {errorMessage && (
          <div className="mx-5 my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <p className="font-medium">Permission Denied</p>
            <p className="mt-0.5 text-[11px] text-rose-600">{errorMessage}</p>
          </div>
        )}

        {/* Actions */}
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
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
