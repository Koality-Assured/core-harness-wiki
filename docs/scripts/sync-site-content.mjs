#!/usr/bin/env node
// docs/scripts/sync-site-content.mjs
// Copies Markdown files listed in docs/manifest.json from the repo root into docs/
// so GitHub Pages can serve them at identical relative paths.
//
// Zero dependencies — runs on standard Node 20+.

import fs from 'node:fs';
import path from 'node:path';
import { SECTION_IDS, readManifest, REPO_ROOT, DOCS_ROOT, posixRel } from './lib.mjs';

/** Files and directories under docs/ that must never be removed or overwritten */
const PROTECTED_DOCS_ENTRIES = new Set([
  'scripts',
  'index.html',
  'styles.css',
  'manifest.json',
  'data.js',
  'markdown.js',
  'loader.js',
  'article.jsx',
  'app.jsx',
  'home.jsx',
  'shell.jsx',
  'other-screens.jsx',
  'tweaks-panel.jsx',
  'favicon.svg',
  '.nojekyll',
  'CNAME',
]);

function wipeMirroredSections() {
  if (!fs.existsSync(DOCS_ROOT)) return;
  for (const name of fs.readdirSync(DOCS_ROOT)) {
    if (PROTECTED_DOCS_ENTRIES.has(name)) continue;
    // Only wipe mirrored section directories that live outside docs/ at repo root
    if (SECTION_IDS.includes(name) && name !== 'docs') {
      const target = path.join(DOCS_ROOT, name);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        fs.rmSync(target, { recursive: true, force: true });
      }
    }
  }
}

function main() {
  const manifest = readManifest();
  wipeMirroredSections();

  const articles = manifest.articles || [];
  let copied = 0;
  let skippedInPlace = 0;
  let missing = 0;

  for (const art of articles) {
    const rel = (art.file || `${art.slug}.md`).split('/').join(path.sep);
    const src = path.join(REPO_ROOT, rel);
    const dest = path.join(DOCS_ROOT, rel);

    // If source file is already inside docs/, no copy needed
    if (path.resolve(src) === path.resolve(dest)) {
      skippedInPlace += 1;
      continue;
    }

    if (!fs.existsSync(src)) {
      console.warn(`! manifest lists missing source file: ${art.file}`);
      missing += 1;
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied += 1;
  }

  console.log(`✓ Synced content into docs/ — ${copied} copied, ${skippedInPlace} already in-place.`);
  if (missing) {
    console.warn(`⚠ ${missing} file(s) listed in manifest were not found.`);
  }
}

main();
