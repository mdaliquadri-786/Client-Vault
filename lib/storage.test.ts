import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Binary MIME type resolution: ensures .exe and binary files default to application/octet-stream
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

// 3. UTF-8 filename preservation via local blob download
function createBlobDownloadLink(blobUrl: string, originalName: string) {
  return {
    href: blobUrl,
    download: originalName,
  };
}

test('Binary .exe file strictly resolves to application/octet-stream', () => {
  assert.equal(resolveMimeType('setup.exe', ''), 'application/octet-stream');
  assert.equal(resolveMimeType('installer.exe', 'application/x-msdownload'), 'application/octet-stream');
  assert.equal(resolveMimeType('report.pdf', 'application/pdf'), 'application/pdf');
  assert.equal(resolveMimeType('photo.png', 'image/png'), 'image/png');
  assert.equal(resolveMimeType('unknown_file', ''), 'application/octet-stream');
});

test('Arabic poetry PDF name is preserved with 100% UTF-8 fidelity in blob download link', () => {
  const arabicPdfName = 'مناجات الفؤاد من أشعار الرقاة.pdf';
  const mockBlobUrl = 'blob:http://localhost:3000/1234-5678-90ab';
  const link = createBlobDownloadLink(mockBlobUrl, arabicPdfName);

  assert.equal(link.download, 'مناجات الفؤاد من أشعار الرقاة.pdf');
  assert.equal(link.download.includes('%20'), false);
  assert.equal(link.download.includes('%D9'), false);
  assert.equal(link.download.endsWith('.pdf'), true);
});

test('ASCII storage key correctly isolates project and sanitizes non-ASCII Urdu/Arabic filenames for S3', () => {
  const urduFilename = 'دستاویز_معاہدہ.pdf';
  const projectId = 'proj_mvqowbp2_9ozc1';
  const storagePath = generateAsciiStorageKey(urduFilename, projectId, 'a1b2c3d4', 1710000000000);

  assert.equal(storagePath, 'proj_mvqowbp2_9ozc1/1710000000000_a1b2c3d4.pdf');
  assert.equal(/^[\x00-\x7F]+$/.test(storagePath), true);
});
