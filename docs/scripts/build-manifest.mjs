#!/usr/bin/env node
// docs/scripts/build-manifest.mjs
// Walks configured section folders, parses metadata from markdown files, and generates docs/manifest.json.
// Zero dependencies — runs on standard Node 20+.

import fs from 'node:fs';
import path from 'node:path';
import {
  CONFIG, SECTIONS, listAllArticles, readArticle, readManifest,
  MANIFEST_PATH, pathInfo, inferManifestRow, REPO_ROOT, DOCS_ROOT,
} from './lib.mjs';
import {
  deriveDashboardStats,
  deriveActivityFeed,
  resolveManifestRepo,
  resolveManifestBranch,
} from './dashboard-stats.mjs';

const existing = (() => {
  try { return readManifest(); } catch { return {}; }
})();

console.log(`[build-manifest] Scanning configured sections: ${SECTIONS.map(s => s.id).join(', ')}...`);

const articles = [];
const fileList = listAllArticles();

for (const f of fileList) {
  const { fm, src } = readArticle(f);
  const row = inferManifestRow(f, src, fm);
  if (row) articles.push(row);
}

// Sort: newest updated first, then alphabetical by title
articles.sort((a, b) => {
  if (a.updated && b.updated && a.updated !== b.updated) {
    return b.updated.localeCompare(a.updated);
  }
  return (a.title || '').localeCompare(b.title || '');
});

// Build dynamic subsection hierarchy per section
const existingSections = new Map((existing.sections || []).map(s => [s.id, s]));
const sections = SECTIONS.map(s => {
  const inSec = articles.filter(a => a.section === s.id);
  const ex = existingSections.get(s.id) || {};

  // Group discovered subsections
  const subMap = new Map();
  for (const a of inSec) {
    if (a.subsection) {
      const topSub = a.subsection.split('/')[0];
      subMap.set(topSub, (subMap.get(topSub) || 0) + 1);
    }
  }

  const subsections = Array.from(subMap.entries()).map(([id, count]) => ({ id, count }));
  subsections.sort((a, b) => a.id.localeCompare(b.id));

  return {
    id: s.id,
    name: s.name || s.id,
    code: s.code || s.id.slice(0, 4).toUpperCase(),
    priority: s.priority || 'primary',
    desc: s.desc || ex.desc || '',
    accent: s.accent || '#00F0FF',
    count: inSec.length,
    subsections,
  };
});

const derivedStats = deriveDashboardStats(articles, REPO_ROOT);
const recentEvents = deriveActivityFeed(articles, REPO_ROOT, { limit: 12 });
const repoSlug = resolveManifestRepo(CONFIG.repo || existing.meta?.repo, REPO_ROOT, CONFIG.org);
const repoBranch = resolveManifestBranch(CONFIG.branch || existing.meta?.branch, REPO_ROOT);

const manifest = {
  meta: {
    name: CONFIG.name,
    tagline: CONFIG.tagline,
    description: CONFIG.description,
    org: CONFIG.org,
    repo: repoSlug,
    branch: repoBranch,
    contentBase: '.',
    updated: new Date().toISOString().slice(0, 10),
  },
  sections,
  articles,
  stats: {
    ...derivedStats,
    articles: articles.length,
    sections: sections.filter(s => s.priority === 'primary').length,
  },
  recentEvents,
  sev: CONFIG.severities,
};

fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

console.log(`✓ Rebuilt manifest.json — ${articles.length} article(s) across ${sections.length} section(s).`);
console.log(`  ◆ Repository: ${repoSlug || '(local)'} [branch: ${repoBranch}]`);
console.log(`  ◆ Contributors: ${derivedStats.contributors} (${derivedStats.contributorsSource})`);
console.log(`  ◆ Standards Coverage: ${derivedStats.coverage}% (${derivedStats.reviewedArticles}/${derivedStats.articles} reviewed)`);

for (const s of sections) {
  console.log(`  ▶ [${s.code}] ${s.id.padEnd(16)} ${String(s.count).padStart(3)} article(s)`);
  for (const sub of s.subsections) {
    console.log(`    └─ ${sub.id.padEnd(20)} ${sub.count}`);
  }
}
