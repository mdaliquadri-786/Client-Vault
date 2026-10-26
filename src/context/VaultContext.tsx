import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultFile, StorageStats } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { getFileCategory, validateFileUpload } from '../utils/formatters.js';
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
  downloadFile: (file: VaultFile) => Promise<void>;
  projects: string[];
  createProject: (name: string, clientName?: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<VaultFile[]>(() => {
    const saved = localStorage.getItem('cv_vault_files');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [projects, setProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('cv_vault_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [uploadingQueue, setUploadingQueue] = useState<UploadingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load real files and projects from Supabase if configured
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (supabase) {
      // 1. Fetch real projects
      supabase
        .from('projects')
        .select('name')
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (!error && data && data.length > 0) {
            const projectNames = data.map((p) => p.name);
            setProjects(projectNames);
            localStorage.setItem('cv_vault_projects', JSON.stringify(projectNames));
          }
        });

      // 2. Fetch real files
      supabase
        .from('files')
        .select('*')
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (!error && data) {
            const mappedFiles: VaultFile[] = data.map((f: any) => ({
              id: f.id,
              project_id: f.project_id || '',
              name: f.name,
              size: Number(f.size_bytes) || 0,
              type: f.mime_type || 'application/octet-stream',
              category: f.category || getFileCategory(f.name, f.mime_type),
              uploaded_at: f.created_at || new Date().toISOString(),
              uploaded_by: f.user_id || user?.id || '',
              uploader_name: user?.name || 'Vault User',
              client_id: '',
              project_name: f.project_name || 'Project Vault',
              download_count: f.download_count || 0,
            }));
            setFiles(mappedFiles);
            localStorage.setItem('cv_vault_files', JSON.stringify(mappedFiles));
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Save files to local storage whenever changed
  useEffect(() => {
    localStorage.setItem('cv_vault_files', JSON.stringify(files));
  }, [files]);

  // Save projects to local storage
  useEffect(() => {
    localStorage.setItem('cv_vault_projects', JSON.stringify(projects));
  }, [projects]);

  // Filter files by search query, project, and category
  const filteredFiles = files.filter((file) => {
    const projName = file.project_name || 'All Projects';
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

  // Calculate real storage stats
  const totalUsedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxStorageBytes = 5 * 1024 * 1024 * 1024; // 5.0 GB standard quota

  const stats: StorageStats = {
    usedBytes: totalUsedBytes,
    maxBytes: maxStorageBytes,
    fileCount: files.length,
    clientCount: 0,
    projectCount: projects.length,
  };

  const createProject = async (name: string, clientName?: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const supabase = getSupabaseClient();
    if (supabase && user) {
      try {
        await supabase.from('projects').insert([
          {
            name: cleanName,
            client_name: clientName || 'Client Partner',
            owner_id: user.id,
          },
        ]);
      } catch (err) {
        console.warn('Supabase project insert notice:', err);
      }
    }

    setProjects((prev) => (prev.includes(cleanName) ? prev : [...prev, cleanName]));
    setSelectedProject(cleanName);
  };

  const uploadFiles = async (newFiles: File[], targetProject?: string) => {
    if (!user) return;
    const projectToUse =
      targetProject || (selectedProject !== 'All Projects' ? selectedProject : 'General Vault');

    const supabase = getSupabaseClient();

    for (const rawFile of newFiles) {
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

      setUploadingQueue((prev) => [
        ...prev,
        {
          id: queueId,
          name: rawFile.name,
          size: rawFile.size,
          progress: 30,
          status: 'uploading',
        },
      ]);

      let storagePath = `${projectToUse.toLowerCase().replace(/[^a-z0-9]/g, '-')}/${Date.now()}_${rawFile.name}`;

      if (supabase) {
        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('client-vault-files')
            .upload(storagePath, rawFile, { upsert: true });

          if (uploadErr) {
            console.warn('Storage upload notice:', uploadErr.message);
          } else if (uploadData) {
            storagePath = uploadData.path;
          }

          await supabase.from('files').insert([
            {
              name: rawFile.name,
              size_bytes: rawFile.size,
              mime_type: rawFile.type,
              storage_path: storagePath,
              category: getFileCategory(rawFile.name, rawFile.type),
              project_name: projectToUse,
              user_id: user.id,
            },
          ]);
        } catch (err) {
          console.warn('Supabase record insert notice:', err);
        }
      }

      // Add file to vault state
      const newVaultFile: VaultFile = {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type || 'application/octet-stream',
        category: getFileCategory(rawFile.name, rawFile.type),
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
        uploader_name: user.name,
        client_id: '',
        project_name: projectToUse,
        download_count: 0,
      };

      setFiles((prev) => [newVaultFile, ...prev]);

      setUploadingQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, progress: 100, status: 'completed' }
            : item
        )
      );

      // Clean up queue item after a moment
      setTimeout(() => {
        setUploadingQueue((prev) => prev.filter((item) => item.id !== queueId));
      }, 2500);
    }
  };

  const deleteFile = async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return { success: false, error: 'File not found' };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('files').delete().eq('id', fileId);
      } catch (err) {
        console.warn('Supabase delete record error:', err);
      }
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    return { success: true };
  };

  const downloadFile = async (file: VaultFile) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase.storage
          .from('client-vault-files')
          .createSignedUrl(file.name, 60);

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      } catch (err) {
        console.warn('Signed URL generation notice:', err);
      }
    }

    // Direct mock blob download for local session
    const dummyBlob = new Blob([`ClientVault Deliverable: ${file.name}`], { type: file.type });
    const url = URL.createObjectURL(dummyBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <VaultContext.Provider
      value={{
        files,
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
        createProject,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
