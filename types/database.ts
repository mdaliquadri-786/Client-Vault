export interface Project {
  id: string;
  name: string;
  client_name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
  total_bytes?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id?: string | null;
  email: string;
  role: 'client' | 'reviewer' | 'admin';
  status: 'pending' | 'accepted' | 'revoked';
  invite_token: string;
  invited_at: string;
  accepted_at?: string | null;
}

export interface FileRecord {
  id: string;
  project_id: string;
  user_id: string;
  client_id?: string | null;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  category: 'document' | 'image' | 'archive' | 'design' | 'media' | 'other';
  download_count: number;
  created_at: string;
  updated_at: string;
  project_name?: string;
}

export type FileInsert = Omit<FileRecord, 'id' | 'created_at' | 'updated_at' | 'download_count'> & {
  download_count?: number;
};
