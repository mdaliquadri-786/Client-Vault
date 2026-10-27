'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Figma,
  Film,
  File,
  Download,
  Trash2,
  FolderOpen,
  Loader2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FileRecord } from '@/types/database';

interface FileListProps {
  projectId?: string;
  onDeleteRequest: (file: FileRecord) => void;
  refreshTrigger?: number;
  initialFiles?: FileRecord[];
}

export const FileList: React.FC<FileListProps> = ({
  projectId,
  onDeleteRequest,
  refreshTrigger = 0,
  initialFiles,
}) => {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles || []);
  const [loading, setLoading] = useState<boolean>(!initialFiles);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setErrorMessage(null);
    const supabase = createClient();

    try {
      let query = supabase.from('files').select('*');
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Files fetch error:', error.message);
        setErrorMessage('Unable to load vault files from database.');
        setFiles([]);
      } else {
        setFiles((data as FileRecord[]) || []);
      }
    } catch (err: any) {
      console.error('Fetch files exception:', err);
      setErrorMessage('Network or server error while loading deliverables.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshTrigger]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    } catch {
      return 'Recently';
    }
  };

  const getCategoryIcon = (category: string, filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'fig') return <Figma className="w-4 h-4 text-purple-600 shrink-0" />;
    switch (category) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'video':
      case 'media':
        return <Film className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  /**
   * Fix "Failed to load PDF" (Download Issue):
   * Browsers crash when trying to preview PDFs in an inline tab without download headers.
   * By passing { download: file.name } to createSignedUrl, Supabase sets:
   * Content-Disposition: attachment; filename="<file.name>"
   * Then dynamically creating an <a> element with href & download attributes guarantees
   * an immediate, clean local file download without crashing the PDF viewer.
   */
  const handleDownload = async (file: FileRecord) => {
    setDownloadingId(file.id);
    setDownloadNotice(null);
    const supabase = createClient();

    try {
      // 1. Request signed URL from Supabase Storage with explicit download disposition
      const { data, error } = await supabase.storage
        .from('client-vault-files')
        .createSignedUrl(file.storage_path, 60, {
          download: file.name,
        });

      if (error || !data?.signedUrl) {
        // Fallback to getPublicUrl with download option
        const { data: publicData } = supabase.storage
          .from('client-vault-files')
          .getPublicUrl(file.storage_path, {
            download: file.name,
          });

        if (publicData?.publicUrl) {
          const link = document.createElement('a');
          link.href = publicData.publicUrl;
          link.download = file.name;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error(error?.message || 'Download URL could not be generated.');
        }
      } else {
        // Dynamically create anchor element with download attribute
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = file.name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setDownloadNotice(`Secure download started for "${file.name}"`);
      setTimeout(() => setDownloadNotice(null), 4000);
    } catch (err: any) {
      console.error('Download error:', err);
      setErrorMessage(`Failed to download "${file.name}". Please try again.`);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden font-sans">
      {/* Table Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Deliverables & Vault Files</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
            {files.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>PostgreSQL RLS Protected</span>
        </div>
      </div>

      {/* Notifications */}
      {downloadNotice && (
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
          <span>{downloadNotice}</span>
          <button onClick={() => setDownloadNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Querying Supabase files...</p>
        </div>
      ) : files.length === 0 ? (
        /* Empty State with Exact Required Text */
        <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-800 mb-1">
            No deliverables uploaded yet. Upload your first file above.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Files added to this project will be securely encrypted in Supabase Storage with Row Level Security.
          </p>
        </div>
      ) : (
        /* Data Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th scope="col" className="py-3 px-6">File Name</th>
                <th scope="col" className="py-3 px-6">Size</th>
                <th scope="col" className="py-3 px-6">Type / Category</th>
                <th scope="col" className="py-3 px-6">Date Uploaded</th>
                <th scope="col" className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {files.map((file) => {
                const isDownloading = downloadingId === file.id;

                return (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* File Name */}
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
                          {getCategoryIcon(file.category, file.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 hover:text-sky-600 transition-colors" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {file.mime_type || 'binary/octet-stream'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-6 font-mono text-slate-600 tabular-nums">
                      {formatFileSize(file.size_bytes)}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-6">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {file.category || 'general'}
                      </span>
                    </td>

                    {/* Date Uploaded */}
                    <td className="py-3.5 px-6 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={isDownloading}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Secure Download"
                          aria-label={`Download ${file.name}`}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => onDeleteRequest(file)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete File"
                          aria-label={`Delete ${file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
