export interface VaultUser {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'client';
  company?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string; // TEXT primary key
  name: string;
  client_name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  file_count?: number;
  total_bytes?: number;
}

export interface ProjectMember {
  id: string; // TEXT primary key
  project_id: string; // TEXT foreign key
  user_id?: string | null;
  email: string;
  role: 'client' | 'reviewer' | 'admin';
  status: 'pending' | 'accepted' | 'revoked';
  invite_token: string;
  invited_at: string;
  accepted_at?: string | null;
}

export interface VaultFile {
  id: string; // TEXT primary key
  project_id?: string; // TEXT foreign key
  name: string; // Full UTF-8 display name (Urdu, Arabic, etc.)
  size: number; // in bytes
  type: string; // MIME type
  category: 'document' | 'image' | 'archive' | 'design' | 'media' | 'other';
  uploaded_at: string;
  uploaded_by: string; // user id
  uploader_name: string;
  client_id?: string;
  project_name?: string;
  storage_path?: string;
  url?: string;
  download_count: number;
  is_locked?: boolean;
}

export interface StorageStats {
  usedBytes: number;
  maxBytes: number;
  fileCount: number;
  clientCount: number;
  projectCount: number;
}
