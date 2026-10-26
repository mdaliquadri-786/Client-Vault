import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultFile, StorageStats } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { getFileCategory, validateFileUpload, canUserSelectFile, canUserDeleteFile } from '../utils/formatters.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

interface UploadingItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

interface VaultContextType {
  files: VaultFile[];
  filteredFiles: VaultFile[];
  uploadingQueue: UploadingItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  stats: StorageStats;
  uploadFiles: (fileList: File[], targetProject?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<{ success: boolean; error?: string }>;
  downloadFile: (file: VaultFile) => void;
  projects: string[];
}

const DEFAULT_PROJECTS = ['Acme Rebrand 2026', 'Horizon Mobile App', 'Apex Retail Portal'];

const INITIAL_FILES: VaultFile[] = [
  {
    id: 'f-101',
    project_id: 'proj-acme-2026',
    name: 'Brand_Identity_System_v2.4_Production.pdf',
    size: 14889728, // 14.2 MB
    type: 'application/pdf',
    category: 'document',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    uploaded_by: 'usr-freelancer-8472',
    uploader_name: 'Elena Rostova',
    client_id: 'usr-client-9104',
    project_name: 'Acme Rebrand 2026',
    download_count: 7,
  },
  {
    id: 'f-102',
    project_id: 'proj-acme-2026',
    name: 'Master_Logomark_Vector_Suite.zip',
    size: 38797312, // 37.0 MB
    type: 'application/zip',
    category: 'archive',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    uploaded_by: 'usr-freelancer-8472',
    uploader_name: 'Elena Rostova',
    client_id: 'usr-client-9104',
    project_name: 'Acme Rebrand 2026',
    download_count: 14,
  },
  {
    id: 'f-103',
    project_id: 'proj-acme-2026',
    name: 'Design_Tokens_Figma_Kit.fig',
    size: 9332326, // 8.9 MB
    type: 'application/octet-stream',
    category: 'design',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    uploaded_by: 'usr-freelancer-8472',
    uploader_name: 'Elena Rostova',
    client_id: 'usr-client-9104',
    project_name: 'Acme Rebrand 2026',
    download_count: 5,
  },
  {
    id: 'f-104',
    project_id: 'proj-acme-2026',
    name: 'Client_Feedback_Annotations_Oct.pdf',
    size: 2411724, // 2.3 MB
    type: 'application/pdf',
    category: 'document',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    uploaded_by: 'usr-client-9104',
    uploader_name: 'Marcus Vance',
    client_id: 'usr-client-9104',
    project_name: 'Acme Rebrand 2026',
    download_count: 3,
  },
  {
    id: 'f-105',
    project_id: 'proj-horizon-2026',
    name: 'Product_Packaging_HighRes_Render.png',
    size: 6186598, // 5.9 MB
    type: 'image/png',
    category: 'image',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    uploaded_by: 'usr-freelancer-8472',
    uploader_name: 'Elena Rostova',
    client_id: 'usr-client-9104',
    project_name: 'Horizon Mobile App',
    download_count: 9,
  },
  {
    id: 'f-106',
    project_id: 'proj-acme-2026',
    name: 'Final_Signed_Work_Agreement.pdf',
    size: 1845120, // 1.76 MB
    type: 'application/pdf',
    category: 'document',
    uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    uploaded_by: 'usr-freelancer-8472',
    uploader_name: 'Elena Rostova',
    client_id: 'usr-client-9104',
    project_name: 'Acme Rebrand 2026',
    download_count: 4,
  },
];

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<VaultFile[]>(() => {
    const saved = localStorage.getItem('cv_vault_files');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_FILES;
      }
    }
    return INITIAL_FILES;
  });

  const [uploadingQueue, setUploadingQueue] = useState<UploadingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Persist files in local storage for refresh continuity
  useEffect(() => {
    localStorage.setItem('cv_vault_files', JSON.stringify(files));
  }, [files]);

  // Strict RLS Filtering Simulation based on active authenticated user:
  const accessibleFiles = files.filter((f) => {
    if (!user) return false;
    return canUserSelectFile(user, f);
  });

  // Filter by search query, project, and category
  const filteredFiles = accessibleFiles.filter((file) => {
    const projName = file.project_name || 'Acme Rebrand 2026';
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploader_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      selectedProject === 'All Projects' || projName === selectedProject;

    const matchesCategory =
      selectedCategory === 'all' || file.category === selectedCategory;

    return matchesSearch && matchesProject && matchesCategory;
  });

  // Calculate storage usage
  const totalUsedBytes = accessibleFiles.reduce((acc, f) => acc + f.size, 0);
  const maxStorageBytes = 10 * 1024 * 1024 * 1024; // 10 GB quota tier

  const stats: StorageStats = {
    usedBytes: totalUsedBytes,
    maxBytes: maxStorageBytes,
    fileCount: accessibleFiles.length,
    clientCount: 1, // Acme Corporation active client
    projectCount: 3,
  };

  const uploadFiles = async (newFiles: File[], targetProject?: string) => {
    if (!user) return;
    const projectToUse = targetProject || (selectedProject !== 'All Projects' ? selectedProject : 'Acme Rebrand 2026');

    for (const rawFile of newFiles) {
      // Validate file security and size
      const validation = validateFileUpload({ name: rawFile.name, size: rawFile.size });
      const queueId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      if (!validation.valid) {
        setUploadingQueue((prev) => [
          ...prev,
          {
            id: queueId,
            name: rawFile.name,
            size: rawFile.size,
            progress: 100,
            status: 'error',
            errorMessage: validation.error,
          },
        ]);
        continue;
      }

      // Add to uploading queue
      setUploadingQueue((prev) => [
        ...prev,
        {
          id: queueId,
          name: rawFile.name,
          size: rawFile.size,
          progress: 15,
          status: 'uploading',
        },
      ]);

      // Progress animation
      await new Promise((r) => setTimeout(r, 200));
      setUploadingQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, progress: 55 } : item))
      );

      await new Promise((r) => setTimeout(r, 250));
      setUploadingQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, progress: 90, status: 'processing' } : item))
      );

      await new Promise((r) => setTimeout(r, 200));

      const fileId = `f-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
      const safeName = rawFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetProjId = projectToUse.toLowerCase().includes('horizon')
        ? 'proj-horizon-2026'
        : projectToUse.toLowerCase().includes('apex')
        ? 'proj-apex-2026'
        : 'proj-acme-2026';
      const storagePath = `${targetProjId}/${fileId}_${safeName}`;

      // Upload physical binary to Supabase Storage if configured
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.storage
            .from('client-vault-files')
            .upload(storagePath, rawFile, {
              cacheControl: '3600',
              upsert: false,
            });

          await supabase.from('files').insert({
            id: fileId,
            project_id: targetProjId,
            user_id: user.id,
            name: rawFile.name,
            size_bytes: rawFile.size,
            mime_type: rawFile.type || 'application/octet-stream',
            storage_path: storagePath,
            category: getFileCategory(rawFile.name, rawFile.type),
            download_count: 0,
          });
        } catch (storageErr) {
          console.warn('Supabase storage upload notice:', storageErr);
        }
      }

      const newVaultFile: VaultFile = {
        id: fileId,
        project_id: targetProjId,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type || 'application/octet-stream',
        category: getFileCategory(rawFile.name, rawFile.type),
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
        uploader_name: user.name,
        client_id: user.role === 'client' ? user.id : 'usr-client-9104',
        project_name: projectToUse,
        download_count: 0,
      };

      setFiles((prev) => [newVaultFile, ...prev]);

      setUploadingQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, progress: 100, status: 'completed' } : item))
      );

      // Clean up completed item after 2 seconds
      setTimeout(() => {
        setUploadingQueue((prev) => prev.filter((item) => item.id !== queueId));
      }, 2500);
    }
  };

  const deleteFile = async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const target = files.find((f) => f.id === fileId);
    if (!target) {
      return { success: false, error: 'File not found' };
    }

    // Enforce RLS rule: Clients can only delete files they themselves uploaded.
    if (!canUserDeleteFile(user, target)) {
      return {
        success: false,
        error: 'Security Policy Violation (RLS): You can only delete files you uploaded.',
      };
    }

    // Two-step deletion: Supabase Storage bucket + PostgreSQL table
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const safeName = target.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${target.project_id}/${target.id}_${safeName}`;
        await supabase.storage.from('client-vault-files').remove([storagePath]);
        await supabase.from('files').delete().eq('id', fileId);
      } catch (err) {
        console.warn('Supabase delete notice:', err);
      }
    }

    // Remove from state
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    return { success: true };
  };

  const downloadFile = async (file: VaultFile) => {
    // Increment download counter
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, download_count: f.download_count + 1 } : f))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${file.project_id}/${file.id}_${safeName}`;
        const { data, error } = await supabase.storage
          .from('client-vault-files')
          .createSignedUrl(storagePath, 60);

        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      } catch (err) {
        console.warn('Signed URL generation notice:', err);
      }
    }

    // Fallback blob download
    const blob = new Blob([`ClientVault Secure Download\nFile: ${file.name}\nSize: ${file.size} bytes\nTimestamp: ${file.uploaded_at}`], {
      type: file.type || 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const projects = Array.from(
    new Set([...DEFAULT_PROJECTS, ...files.map((f) => f.project_name || 'Acme Rebrand 2026')])
  );

  return (
    <VaultContext.Provider
      value={{
        files: accessibleFiles,
        filteredFiles,
        uploadingQueue,
        searchQuery,
        setSearchQuery,
        selectedProject,
        setSelectedProject,
        selectedCategory,
        setSelectedCategory,
        stats,
        uploadFiles,
        deleteFile,
        downloadFile,
        projects,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
