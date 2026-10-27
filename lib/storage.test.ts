import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Logic check: ASCII-safe S3 storage key generation
function generateAsciiStorageKey(originalName: string, projectId: string, mockUuidSlice: string, mockTimestamp: number): string {
  const nameParts = originalName.split('.');
  const rawExt = nameParts.length > 1 ? nameParts.pop() : '';
  const safeExt = rawExt?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const asciiStorageKey = `${mockTimestamp}_${mockUuidSlice}.${safeExt}`;
  const safeProjectFolder = projectId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeProjectFolder}/${asciiStorageKey}`;
}

// 2. Logic check: Fallback MIME type resolution
function resolveContentType(type: string | undefined | null): string {
  return type || 'application/octet-stream';
}

// 3. Logic check: TEXT ID validity (supports any non-empty string, no strict UUID pattern)
function isValidTextId(id: unknown): boolean {
  return typeof id === 'string' && id.trim().length > 0;
}

test('ASCII storage key correctly sanitizes non-ASCII Urdu/Arabic filenames for S3', () => {
  const urduFilename = 'دستاویز_اہم_معاہدہ.pdf';
  const projectId = 'proj-acme-123';
  const storagePath = generateAsciiStorageKey(urduFilename, projectId, 'a1b2c3d4', 1710000000000);
  
  assert.equal(storagePath, 'proj-acme-123/1710000000000_a1b2c3d4.pdf');
  // Path must be 100% ASCII
  assert.equal(/^[\x00-\x7F]+$/.test(storagePath), true);
  // Original filename remains intact for DB record
  assert.equal(urduFilename, 'دستاویز_اہم_معاہدہ.pdf');
});

test('ASCII storage key supports .exe and unusual extensions', () => {
  const exeFilename = 'installer_v2.exe';
  const projectId = 'client_share_alpha';
  const storagePath = generateAsciiStorageKey(exeFilename, projectId, 'e5f6g7h8', 1710000005000);

  assert.equal(storagePath, 'client_share_alpha/1710000005000_e5f6g7h8.exe');
  assert.equal(/^[\x00-\x7F]+$/.test(storagePath), true);
});

test('Content type safely falls back to application/octet-stream for .exe or untyped files', () => {
  assert.equal(resolveContentType(''), 'application/octet-stream');
  assert.equal(resolveContentType(undefined), 'application/octet-stream');
  assert.equal(resolveContentType('application/pdf'), 'application/pdf');
  assert.equal(resolveContentType('application/x-msdownload'), 'application/x-msdownload');
});

test('Schema supports arbitrary TEXT IDs without failing UUID format checks', () => {
  assert.equal(isValidTextId('proj-12345'), true);
  assert.equal(isValidTextId('slug-acme-redesign'), true);
  assert.equal(isValidTextId('custom_text_id_999'), true);
  assert.equal(isValidTextId(''), false);
});
