import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { listAllArticles, parseYamlLite, readArticle, readManifest } from './lib.mjs';

test('YAML-lite frontmatter preserves CRLF block lists', () => {
  const eol = '\r\n';
  const frontmatter = [
    'title: Example',
    'tags:',
    '  - parser',
    '  - frontmatter',
    'related:',
    '  - architecture/example',
  ].join(eol);
  const parsed = parseYamlLite(frontmatter);

  assert.deepStrictEqual(parsed.tags, ['parser', 'frontmatter']);
  assert.deepStrictEqual(parsed.related, ['architecture/example']);

  const corpusFile = listAllArticles().find(file => {
    const { fm } = readArticle(file);
    return Array.isArray(fm?.tags) && fm.tags.length > 0 && Array.isArray(fm?.related) && fm.related.length > 0;
  });
  assert.ok(corpusFile, 'Corpus should contain block-list tags and related metadata');
});

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

  const manifestSlugs = new Set(manifest.articles.map(article => article.slug));
  const relatedArticle = manifest.articles.find(article => Array.isArray(article.related) && article.related.length > 0);
  assert.ok(relatedArticle, 'Manifest must contain at least one related article entry');
  assert.ok(manifestSlugs.has(relatedArticle.related[0]), 'Representative related reference must resolve to an in-site slug');
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

test('validate-content invariants', () => {
  // Ensure content validation passes with zero errors
  assert.doesNotThrow(() => {
    execSync('node docs/scripts/validate-content.mjs', { stdio: 'inherit' });
  }, 'validate-content.mjs should exit cleanly with 0 errors');
});

