import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { readManifest } from './lib.mjs';

test('build-manifest invariants', () => {
  // Run the build-manifest script
  execSync('node docs/scripts/build-manifest.mjs', { stdio: 'inherit' });
  
  // Verify manifest exists
  const manifestPath = path.join(process.cwd(), 'docs', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json should be generated');
  
  // Verify manifest contents
  const manifest = readManifest();
  assert.ok(Array.isArray(manifest.articles), 'Manifest must contain an articles array');
  assert.ok(Array.isArray(manifest.sections), 'Manifest must contain a sections array');
  assert.ok(manifest.meta, 'Manifest must contain meta object');
});

test('sync-site-content invariants', () => {
  // Ensure sync runs without error
  execSync('node docs/scripts/sync-site-content.mjs', { stdio: 'inherit' });
  
  // Verify files in manifest are copied to docs/
  const manifest = readManifest();
  for (const art of manifest.articles) {
    const dest = path.join(process.cwd(), 'docs', art.file);
    assert.ok(fs.existsSync(dest), `Synced file should exist: ${dest}`);
  }
  
  // Ensure docs folder remains
  const docsRoot = path.join(process.cwd(), 'docs');
  assert.ok(fs.existsSync(docsRoot), 'docs folder must exist');
});
