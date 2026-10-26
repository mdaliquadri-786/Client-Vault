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
  User,
  Clock,
  Filter,
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Header Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Showing {filteredFiles.length} item{filteredFiles.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Main Data Table */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            {searchQuery ? 'No matching files found' : 'Your vault is ready for files'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {searchQuery
              ? `No documents or assets match "${searchQuery}". Clear your search or check another project scope.`
              : 'Securely upload your first deliverables, client briefs, or assets using the upload zone.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-medium text-white bg-[#0B1329] hover:bg-[#152347] rounded-lg transition-colors"
          >
            Upload New File
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Client Files Data Table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                <th scope="col" className="py-3 px-6">
                  File Name
                </th>
                <th scope="col" className="py-3 px-4">
                  Project
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  File Size
                </th>
                <th scope="col" className="py-3 px-4">
                  Upload Date
                </th>
                <th scope="col" className="py-3 px-4">
                  Uploaded By
                </th>
                <th scope="col" className="py-3 px-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* File Name + Icon */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                        {getCategoryIcon(file.category, file.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 block truncate max-w-xs group-hover:text-sky-600 transition-colors">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {file.category} asset
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {file.project_name}
                  </td>

                  {/* File Size */}
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatFileSize(file.size)}
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 text-slate-500 font-mono tabular-nums whitespace-nowrap">
                    {formatDate(file.uploaded_at)}
                  </td>

                  {/* Uploaded By */}
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 flex items-center justify-center shrink-0">
                        {file.uploader_name.slice(0, 1)}
                      </span>
                      <span className="truncate max-w-[120px]">{file.uploader_name}</span>
                    </div>
                  </td>

                  {/* Secure Actions: Download & Delete */}
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title={`Download ${file.name}`}
                        aria-label={`Download ${file.name}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteRequest(file)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title={`Securely delete ${file.name}`}
                        aria-label={`Securely delete ${file.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
