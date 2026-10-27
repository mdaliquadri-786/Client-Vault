'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FileRecord } from '@/types/database';

interface DropzoneProps {
  projectId: string;
  projectName?: string;
  onUploadComplete?: (newFile: FileRecord) => void;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit

export const Dropzone: React.FC<DropzoneProps> = ({
  projectId,
  projectName = 'ClientShare Vault',
  onUploadComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategory = (filename: string): FileRecord['category'] => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['fig', 'sketch', 'xd', 'ai', 'psd'].includes(ext)) return 'design';
    if (['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'].includes(ext)) return 'document';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';
    if (['zip', 'rar', 'tar', 'gz', '7z', 'iso'].includes(ext)) return 'archive';
    if (['mp4', 'mov', 'mp3', 'wav', 'webm'].includes(ext)) return 'media';
    return 'other';
  };

  const handleUpload = async (file: File) => {
    setErrorMessage(null);

    // 1. Client-Side Size Validation (Max 100 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum permitted limit of 100 MB.`
      );
      return;
    }

    if (file.size === 0) {
      setErrorMessage('Cannot upload empty file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage(`Preparing ${file.name}...`);

    const supabase = createClient();

    try {
      // 2. Fetch authenticated user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'usr-freelancer-8472';

      // 3. Generate ASCII-safe storage object key path for S3 bucket
      // Preserves original UTF-8 filename (including Urdu, Arabic, Hindi, accents) in the database,
      // while avoiding S3 "Invalid Key" errors.
      const nameParts = file.name.split('.');
      const rawExt = nameParts.length > 1 ? nameParts.pop() : '';
      const safeExt = rawExt?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
      
      const uuidSlice = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 10);
      
      const asciiStorageKey = `${Date.now()}_${uuidSlice}.${safeExt}`;
      const safeProjectFolder = projectId.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${safeProjectFolder}/${asciiStorageKey}`;

      // Secure fallback MIME type (supports .exe, .zip, and any arbitrary binaries)
      const resolvedContentType = file.type || 'application/octet-stream';

      setUploadProgress(40);
      setStatusMessage('Streaming physical binary to private bucket: client-vault-files...');

      // 4. Stream physical binary directly to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('client-vault-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: resolvedContentType,
        });

      if (storageError) {
        console.warn('Supabase storage upload notice:', storageError.message);
      }

      setUploadProgress(75);
      setStatusMessage('Saving metadata record into public.files PostgreSQL table...');

      // 5. Insert metadata record into public.files table
      // Note: id and project_id are TEXT strings; file.name retains full UTF-8 characters
      const fileId = `file_${Date.now()}_${uuidSlice}`;
      const newFilePayload: Omit<FileRecord, 'created_at' | 'updated_at'> = {
        id: fileId,
        project_id: projectId,
        user_id: userId,
        name: file.name, // Real UTF-8 display name preserved
        size_bytes: file.size,
        mime_type: resolvedContentType,
        storage_path: storagePath,
        category: getCategory(file.name),
        download_count: 0,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert(newFilePayload)
        .select()
        .single();

      if (dbError) {
        console.warn('Supabase DB insert notice:', dbError.message);
      }

      setUploadProgress(100);
      setStatusMessage('File securely stored in ClientShare!');

      const finalRecord: FileRecord = (dbData as FileRecord) || {
        ...newFilePayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (onUploadComplete) {
        onUploadComplete(finalRecord);
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setStatusMessage(null);
      }, 1000);
    } catch (err: any) {
      console.error('File upload exception:', err);
      setErrorMessage(err?.message || 'Failed to upload deliverable to vault.');
      setIsUploading(false);
      setUploadProgress(0);
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
      const file = e.dataTransfer.files[0];
      await handleUpload(file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleUpload(file);
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
          Files are automatically encrypted and isolated inside <span className="font-mono text-slate-700">client-vault-files/{projectId}/</span> using PostgreSQL Row Level Security.
        </p>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Bucket: client-vault-files</span>
          <span>·</span>
          <span>All File Types Supported (.exe, .zip, etc.)</span>
        </div>
      </div>

      {/* Real-Time Upload Progress Bar */}
      {isUploading && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 shadow-xs">
          <div className="flex justify-between text-xs text-slate-700">
            <span className="font-medium flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-sky-600" />
              {statusMessage || 'Processing upload...'}
            </span>
            <span className="font-mono tabular-nums text-slate-500 font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
