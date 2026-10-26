/**
 * Formats byte values into clean, human-readable file sizes with tabular typography.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, unitIndex);

  // Return integer for Bytes, 1 decimal place for KB/MB/GB
  if (unitIndex === 0) {
    return `${Math.round(size)} B`;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats ISO date string or Date into friendly, professional date-time.
 */
export function formatDate(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Recently';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return 'Recently';
  }
}

/**
 * Categorizes a file by extension and MIME type.
 */
export function getFileCategory(
  filename: string,
  mimeType: string = ''
): 'document' | 'image' | 'archive' | 'design' | 'media' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['fig', 'sketch', 'xd', 'ai', 'psd', 'eps', 'indd'].includes(ext)) {
    return 'design';
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'xls', 'ppt', 'pptx'].includes(ext) || mimeType.includes('pdf') || mimeType.includes('text/')) {
    return 'document';
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff', 'avif'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archive';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'aac', 'flac'].includes(ext) || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'media';
  }

  return 'other';
}

/**
 * Validates a candidate file before uploading.
 * Max size: 50MB default for browser upload test.
 */
export function validateFileUpload(
  file: { name: string; size: number },
  maxBytes: number = 50 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!file.name || file.name.trim() === '') {
    return { valid: false, error: 'File name cannot be empty.' };
  }

  // Reject executable or dangerous extensions
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'dll', 'com'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Files with .${ext} extension are blocked for security reasons.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File exceeds maximum allowed upload size of ${formatFileSize(maxBytes)}.`,
    };
  }

  return { valid: true };
}

/**
 * Pure PostgreSQL RLS simulation for public.files SELECT policy:
 * USING (auth.uid() = user_id OR auth.uid() = client_id)
 */
export function canUserSelectFile(
  user: { id: string; role: 'freelancer' | 'client' },
  file: { uploaded_by: string; client_id?: string | null }
): boolean {
  if (user.role === 'freelancer') return true;
  return user.id === file.uploaded_by || (Boolean(file.client_id) && user.id === file.client_id);
}

/**
 * Pure PostgreSQL RLS simulation for public.files DELETE policy:
 * USING (auth.uid() = user_id)
 */
export function canUserDeleteFile(
  user: { id: string; role: 'freelancer' | 'client' },
  file: { uploaded_by: string }
): boolean {
  if (user.role === 'freelancer') return true;
  return user.id === file.uploaded_by;
}

