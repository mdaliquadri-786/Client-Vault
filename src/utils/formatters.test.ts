import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  formatDate,
  getFileCategory,
  validateFileUpload,
  canUserSelectFile,
  canUserDeleteFile,
} from './formatters.js';

test('formatFileSize converts bytes accurately', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1024 * 1024 * 4.5), '4.5 MB');
  assert.equal(formatFileSize(1024 * 1024 * 1024 * 2.2), '2.2 GB');
});

test('getFileCategory assigns correct category based on extension and mime', () => {
  assert.equal(getFileCategory('design-tokens.fig', ''), 'design');
  assert.equal(getFileCategory('invoice.pdf', 'application/pdf'), 'document');
  assert.equal(getFileCategory('hero-illustration.png', 'image/png'), 'image');
  assert.equal(getFileCategory('branding-assets.zip', 'application/zip'), 'archive');
  assert.equal(getFileCategory('walkthrough.mp4', 'video/mp4'), 'media');
  assert.equal(getFileCategory('binary.data', 'application/octet-stream'), 'other');
});

test('validateFileUpload enforces security rules and limits', () => {
  // Empty name
  assert.equal(validateFileUpload({ name: '', size: 100 }).valid, false);

  // Executable file block
  const blocked = validateFileUpload({ name: 'malware.exe', size: 1024 });
  assert.equal(blocked.valid, false);
  assert.match(blocked.error || '', /blocked for security/);

  // 0 bytes file
  assert.equal(validateFileUpload({ name: 'empty.txt', size: 0 }).valid, false);

  // Exceeds max bytes limit (e.g. 10MB limit)
  const tooLarge = validateFileUpload(
    { name: 'large.zip', size: 20 * 1024 * 1024 },
    10 * 1024 * 1024
  );
  assert.equal(tooLarge.valid, false);
  assert.match(tooLarge.error || '', /exceeds maximum allowed upload size/);

  // Valid file
  const valid = validateFileUpload({ name: 'contract.pdf', size: 500000 });
  assert.equal(valid.valid, true);
  assert.equal(valid.error, undefined);
});

test('formatDate handles valid ISO dates without crashing', () => {
  const result = formatDate('2026-03-15T14:30:00Z');
  assert.ok(result.length > 0);
  assert.notEqual(result, 'Recently');
});

test('canUserSelectFile simulates SELECT RLS policy correctly', () => {
  const freelancer = { id: 'usr-free-1', role: 'freelancer' as const };
  const clientA = { id: 'usr-client-A', role: 'client' as const };
  const clientB = { id: 'usr-client-B', role: 'client' as const };

  const fileA = { uploaded_by: 'usr-free-1', client_id: 'usr-client-A' };
  const fileB = { uploaded_by: 'usr-free-1', client_id: 'usr-client-B' };

  // Freelancer can view any file in workspace
  assert.equal(canUserSelectFile(freelancer, fileA), true);
  assert.equal(canUserSelectFile(freelancer, fileB), true);

  // Client A can view their assigned file, but NOT Client B's file
  assert.equal(canUserSelectFile(clientA, fileA), true);
  assert.equal(canUserSelectFile(clientA, fileB), false);
});

test('canUserDeleteFile simulates DELETE RLS policy strictly', () => {
  const freelancer = { id: 'usr-free-1', role: 'freelancer' as const };
  const client = { id: 'usr-client-A', role: 'client' as const };

  const designerFile = { uploaded_by: 'usr-free-1' };
  const clientFile = { uploaded_by: 'usr-client-A' };

  // Freelancer (vault owner) can delete any file
  assert.equal(canUserDeleteFile(freelancer, designerFile), true);
  assert.equal(canUserDeleteFile(freelancer, clientFile), true);

  // Client can delete their OWN uploaded feedback file
  assert.equal(canUserDeleteFile(client, clientFile), true);

  // Client CANNOT delete a file uploaded by the designer
  assert.equal(canUserDeleteFile(client, designerFile), false);
});

test('50MB boundary check conforms to storage bucket limit', () => {
  const fiftyMB = 50 * 1024 * 1024;
  assert.equal(validateFileUpload({ name: 'ok.zip', size: fiftyMB }).valid, true);
  assert.equal(validateFileUpload({ name: 'oversize.zip', size: fiftyMB + 1 }).valid, false);
});

