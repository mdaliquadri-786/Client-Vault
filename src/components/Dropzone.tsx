import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, X } from 'lucide-react';
import { useVault } from '../context/VaultContext.js';
import { formatFileSize } from '../utils/formatters.js';

interface DropzoneProps {
  onUploadSuccess?: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onUploadSuccess }) => {
  const { uploadFiles, uploadingQueue, selectedProject, projects } = useVault();
  const [isDragOver, setIsDragOver] = useState(false);
  const [targetProject, setTargetProject] = useState(
    selectedProject !== 'All Projects' ? selectedProject : 'Acme Rebrand 2026'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await uploadFiles(filesArray, targetProject);
      if (onUploadSuccess) onUploadSuccess();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await uploadFiles(filesArray, targetProject);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    }
  };

  return (
    <div className="space-y-4">
      {/* Target Project Selector for Upload */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200">
        <div>
          <label htmlFor="target-project-select" className="text-xs font-semibold text-slate-700 block">
            Target Client Project
          </label>
          <span className="text-[11px] text-slate-500">
            Files uploaded will be secured in this client&apos;s isolated vault
          </span>
        </div>
        <select
          id="target-project-select"
          value={targetProject}
          onChange={(e) => setTargetProject(e.target.value)}
          className="text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-slate-500 font-medium"
        >
          {projects.map((proj) => (
            <option key={proj} value={proj}>
              {proj}
            </option>
          ))}
        </select>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
          isDragOver
            ? 'border-sky-500 bg-sky-50/60 shadow-inner'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload files drop area"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3 border border-slate-200">
          <UploadCloud className="w-6 h-6 text-slate-600" />
        </div>

        <h4 className="text-sm font-semibold text-slate-800 mb-1">
          Drag and drop your files here, or{' '}
          <span className="text-sky-600 underline font-medium">browse</span>
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mb-3">
          Supports design assets, documents, PDFs, brand kits, and archives up to 50 MB per file.
        </p>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Encrypted with PostgreSQL RLS</span>
          <span>·</span>
          <span>Automatic Virus & Integrity Check</span>
        </div>
      </div>

      {/* Uploading Queue */}
      {uploadingQueue.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h5 className="text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span>Upload Progress</span>
            <span className="text-[11px] text-slate-500 font-mono">
              {uploadingQueue.length} file(s)
            </span>
          </h5>

          <div className="space-y-2.5">
            {uploadingQueue.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-800 truncate max-w-xs">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      ({formatFileSize(item.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'uploading' && (
                      <span className="text-sky-600 flex items-center gap-1 font-mono tabular-nums text-[11px]">
                        <Loader2 className="w-3 h-3 animate-spin" /> {item.progress}%
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-amber-600 text-[11px] font-medium">
                        Indexing RLS...
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Secured
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-rose-600 flex items-center gap-1 text-[11px] font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {item.status !== 'error' ? (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        item.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-600 mt-1">{item.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
