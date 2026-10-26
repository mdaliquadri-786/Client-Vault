import React, { useState } from 'react';
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
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useVault } from '../context/VaultContext.js';
import { VaultFile } from '../types/index.js';
import { formatFileSize, formatDate } from '../utils/formatters.js';

interface FileListProps {
  onDeleteRequest: (file: VaultFile) => void;
  onOpenUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  onDeleteRequest,
  onOpenUpload,
}) => {
  const {
    filteredFiles,
    downloadFile,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
  } = useVault();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownloadClick = async (file: VaultFile) => {
    setDownloadingId(file.id);
    await downloadFile(file);
    setDownloadNotice(`Generated secure download link for ${file.name}`);
    setTimeout(() => {
      setDownloadingId(null);
    }, 600);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 4000);
  };

  const getCategoryIcon = (category: VaultFile['category'], name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'fig') {
      return <Figma className="w-4 h-4 text-purple-600 shrink-0" />;
    }
    switch (category) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'media':
        return <Film className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'design':
        return <Figma className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'document', label: 'Documents & PDFs' },
    { id: 'design', label: 'Design Kits' },
    { id: 'image', label: 'Images' },
    { id: 'archive', label: 'Archives' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs font-sans">
      {/* Table Header Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> PostgreSQL RLS Protected
          </span>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredFiles.length} item{filteredFiles.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{downloadNotice}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-200/70 text-emerald-900 font-semibold px-2 py-0.5 rounded">
            Encrypted URL
          </span>
        </div>
      )}

      {/* Main Data Table or Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            No deliverables uploaded yet. Upload your first file above.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Upload client deliverables, documents, or design kits with automated encryption and Row Level Security.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1329] hover:bg-[#152347] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Upload New File
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Client Files Data Table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                <th scope="col" className="py-3 px-6">File Name</th>
                <th scope="col" className="py-3 px-4">Project</th>
                <th scope="col" className="py-3 px-4 text-right">File Size</th>
                <th scope="col" className="py-3 px-4">Upload Date</th>
                <th scope="col" className="py-3 px-4">Uploaded By</th>
                <th scope="col" className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFiles.map((file) => {
                const isDownloading = downloadingId === file.id;

                return (
                  <tr key={file.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* File Name */}
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
                          {getCategoryIcon(file.category, file.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 hover:text-sky-600 transition-colors" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {file.type}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                        {file.project_name || 'General'}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {formatFileSize(file.size)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(file.uploaded_at)}</span>
                      </div>
                    </td>

                    {/* Uploader */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{file.uploader_name}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadClick(file)}
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
