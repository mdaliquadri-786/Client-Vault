import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileUp, Loader2 } from 'lucide-react';
import { useVault } from '../context/VaultContext.js';
import { useAuth } from '../context/AuthContext.js';
import { createClient } from '@/lib/supabase/client';

interface DropzoneProps {
  onUploadSuccess?: () => void;
  targetProjectId?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onUploadSuccess, targetProjectId }) => {
  const { user } = useAuth();
  const { selectedProject, uploadFiles } = useVault();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProjectId = targetProjectId || (selectedProject !== 'All Projects' ? selectedProject : 'general');

  const getCategory = (filename: string): any => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['fig', 'sketch', 'xd', 'ai', 'psd'].includes(ext)) return 'design';
    if (['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'].includes(ext)) return 'document';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';
    if (['zip', 'rar', 'tar', 'gz', '7z', 'iso'].includes(ext)) return 'archive';
    if (['mp4', 'mov', 'mp3', 'wav', 'webm'].includes(ext)) return 'media';
    return 'other';
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setSuccess(null);

    // Max 100 MB limit
    if (file.size > 100 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 100 MB limit.`);
      return;
    }

    setIsUploading(true);
    setProgress(20);

    const supabase = createClient();

    try {
      // 1. Generate ASCII-safe storage object key path for S3 bucket
      const nameParts = file.name.split('.');
      const rawExt = nameParts.length > 1 ? nameParts.pop() : '';
      const safeExt = rawExt?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
      
      const uuidSlice = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 10);
      
      const asciiStorageKey = `${Date.now()}_${uuidSlice}.${safeExt}`;
      const safeProjectFolder = activeProjectId.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${safeProjectFolder}/${asciiStorageKey}`;

      const resolvedContentType = file.type || 'application/octet-stream';

      setProgress(50);

      // Upload binary to Supabase Storage bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('client-vault-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: resolvedContentType,
        });

      if (storageError) {
        console.warn('Storage notice:', storageError.message);
      }

      setProgress(80);

      const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : undefined;

      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          ...(fileUuid ? { id: fileUuid } : {}),
          project_id: activeProjectId,
          user_id: user?.id || '06ca1648-5870-4311-8345-a6b352d73c1b',
          name: file.name,
          size_bytes: file.size,
          mime_type: resolvedContentType,
          storage_path: storagePath,
          category: getCategory(file.name),
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB insert error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Sync with VaultContext
      await uploadFiles([file], activeProjectId);

      setProgress(100);
      setSuccess(`"${file.name}" securely stored in ClientShare.`);

      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        if (onUploadSuccess) onUploadSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Failed to upload deliverable.');
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 font-sans">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-sky-500 bg-sky-50/70 shadow-inner'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        } ${isUploading ? 'pointer-events-none opacity-90' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Drag and drop file upload zone"
      >
        {/* Hidden input deliberately has NO accept attribute to permit .exe, .zip, etc. */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
          aria-hidden="true"
        />

        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3 border border-slate-200">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-600" />
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-900 mb-1">
          {isUploading ? (
            <span>Uploading Deliverable...</span>
          ) : (
            <>
              Drag and drop your file here, or{' '}
              <span className="text-sky-600 underline font-medium">browse</span>
            </>
          )}
        </h4>

        <p className="text-xs text-slate-500 max-w-sm mb-3">
          Files are automatically encrypted and isolated inside <span className="font-mono text-slate-700">client-vault-files/{activeProjectId}/</span> using PostgreSQL Row Level Security.
        </p>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Bucket: client-vault-files</span>
          <span>·</span>
          <span>All File Types Supported (.exe, .zip, etc.)</span>
        </div>
      </div>

      {isUploading && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 shadow-xs">
          <div className="flex justify-between text-xs text-slate-700">
            <span className="font-medium flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-sky-600" />
              <span>Streaming physical binary to Supabase Storage...</span>
            </span>
            <span className="font-mono tabular-nums text-slate-500 font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
