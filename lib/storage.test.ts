import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Binary MIME type resolution: ensures .exe defaults to application/octet-stream
function resolveMimeType(filename: string, browserType?: string): string {
  const lower = filename.toLowerCase();
  const isBinaryExe = lower.endsWith('.exe') || lower.endsWith('.bin') || lower.endsWith('.dll') || !browserType;
  return isBinaryExe ? 'application/octet-stream' : (browserType || 'application/octet-stream');
}

// 2. ASCII-safe S3 key generator
function generateAsciiStorageKey(originalName: string, projectId: string, mockUuidSlice: string, mockTimestamp: number): string {
  const nameParts = originalName.split('.');
  const rawExt = nameParts.length > 1 ? nameParts.pop() : '';
  const safeExt = rawExt?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const asciiStorageKey = `${mockTimestamp}_${mockUuidSlice}.${safeExt}`;
  const safeProjectFolder = projectId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeProjectFolder}/${asciiStorageKey}`;
}

// 3. Payload builder: ensures download_count is omitted and schema constraints are respected
function buildFilePayload(params: {
  projectId: string;
  userId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  storagePath: string;
  category: string;
}) {
  return {
    project_id: params.projectId,
    user_id: params.userId,
    name: params.name,
    size_bytes: params.sizeBytes,
    mime_type: params.mimeType,
    storage_path: params.storagePath,
    category: params.category,
  };
}

test('Binary .exe file strictly resolves to application/octet-stream', () => {
  assert.equal(resolveMimeType('setup.exe', ''), 'application/octet-stream');
  assert.equal(resolveMimeType('installer.exe', 'application/x-msdownload'), 'application/octet-stream');
  assert.equal(resolveMimeType('report.pdf', 'application/pdf'), 'application/pdf');
  assert.equal(resolveMimeType('photo.png', 'image/png'), 'image/png');
  assert.equal(resolveMimeType('unknown_file', ''), 'application/octet-stream');
});

test('ASCII storage key correctly isolates project and sanitizes non-ASCII Urdu/Arabic filenames for S3', () => {
  const urduFilename = 'دستاویز_معاہدہ.pdf';
  const projectId = 'proj_mvqowbp2_9ozc1';
  const storagePath = generateAsciiStorageKey(urduFilename, projectId, 'a1b2c3d4', 1710000000000);

  assert.equal(storagePath, 'proj_mvqowbp2_9ozc1/1710000000000_a1b2c3d4.pdf');
  assert.equal(/^[\x00-\x7F]+$/.test(storagePath), true);
});

test('Database payload omits non-existent download_count column to prevent PGRST204 errors', () => {
  const payload = buildFilePayload({
    projectId: 'proj_mvqowbp2_9ozc1',
    userId: '06ca1648-5870-4311-8345-a6b352d73c1b',
    name: 'deliverable.pdf',
    sizeBytes: 2048,
    mimeType: 'application/pdf',
    storagePath: 'proj/deliverable.pdf',
    category: 'document',
  });

  assert.equal('download_count' in payload, false);
  assert.equal(payload.project_id, 'proj_mvqowbp2_9ozc1');
  assert.equal(payload.user_id, '06ca1648-5870-4311-8345-a6b352d73c1b');
});
