export interface Project {
  id: string; // TEXT primary key supporting arbitrary text/slug IDs
  name: string;
  client_name: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  file_count?: number;
  total_bytes?: number;
  description?: string | null;
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

export interface FileRecord {
  id: string; // UUID primary key in postgres
  project_id: string; // TEXT foreign key
  user_id: string; // UUID foreign key
  client_id?: string | null;
  name: string; // Full UTF-8 display filename (supports Arabic, Urdu, special chars)
  storage_path: string; // ASCII-safe sanitized storage path for S3 bucket
  size_bytes: number;
  mime_type: string;
  category: 'document' | 'image' | 'archive' | 'design' | 'media' | 'other';
  download_count?: number;
  created_at: string;
  updated_at?: string;
  project_name?: string | null;
}

export type FileInsert = {
  id?: string;
  project_id: string;
  user_id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  category: FileRecord['category'];
  project_name?: string | null;
  client_id?: string | null;
};
