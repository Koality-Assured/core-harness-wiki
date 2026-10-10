// docs/scripts/dashboard-stats.mjs — metrics & activity feed derived from repo state and git history.
// Zero dependencies — runs on standard Node 20+.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function resolveManifestRepo(existingRepo, repoRoot, fallbackOrg = 'Koality-Assured') {
  if (process.env.GITHUB_REPOSITORY && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(process.env.GITHUB_REPOSITORY.trim())) {
    return process.env.GITHUB_REPOSITORY.trim();
  }
  if (existingRepo && typeof existingRepo === 'string' && existingRepo.includes('/')) {
    return existingRepo.trim();
  }
  if (!repoRoot) return '';
  try {
    const raw = execSync('git remote get-url origin', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const clean = raw.replace(/\.git$/i, '').trim();
    const matchSSH = clean.match(/^git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/i);
    if (matchSSH) return `${matchSSH[1]}/${matchSSH[2]}`;
    const matchHTTPS = clean.match(/github\.com[/:]\s*([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/i);
    if (matchHTTPS) return `${matchHTTPS[1]}/${matchHTTPS[2]}`;
  } catch { /* ignore */ }

  return '';
}

export function resolveManifestBranch(existingBranch, repoRoot) {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME.trim();
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF.trim();
  if (repoRoot) {
    try {
      const current = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (current && current !== 'HEAD') return current;
    } catch { /* ignore */ }
  }
  if (existingBranch && typeof existingBranch === 'string') return existingBranch.trim();
  return 'main';
}

export function countGitAuthors(repoRoot) {
  try {
    const raw = execSync('git log --format=%aN --all', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 20 * 1024 * 1024,
    });
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.length ? new Set(lines).size : null;
  } catch {
    return null;
  }
}

function truncate(s, maxLen) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  return t.length <= maxLen ? t : `${t.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

export function deriveActivityFeed(articles, repoRoot, { limit = 12 } = {}) {
  if (repoRoot) {
    try {
      const raw = execSync(
        `git log -n ${limit} --date=short --pretty=format:%ad%x1f%aN%x1f%s%x0a`,
        {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: 4 * 1024 * 1024,
        }
      );
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const feed = [];
      for (const line of lines) {
        const i1 = line.indexOf('\x1f');
        const i2 = i1 === -1 ? -1 : line.indexOf('\x1f', i1 + 1);
        if (i1 === -1 || i2 === -1) continue;
        const date = line.slice(0, i1).trim();
        const who = line.slice(i1 + 1, i2).trim();
        const subject = line.slice(i2 + 1).trim();
        if (!subject) continue;
        feed.push({ ts: date, who: truncate(who, 40), what: truncate(subject, 140) });
      }
      if (feed.length > 0) return feed;
    } catch { /* fallback to doc activity */ }
  }

  // Fallback: derive from article update dates
  const sorted = [...articles].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  return sorted.slice(0, limit).map(a => ({
    ts: a.updated || '—',
    who: a.owner || 'core-team',
    what: `Updated: ${truncate(a.title || a.slug, 120)}`,
  }));
}

export function deriveDashboardStats(articles, repoRoot) {
  const reviewed = articles.filter(a => a.reviewed && /^\d{4}-\d{2}-\d{2}$/.test(String(a.reviewed))).length;
  const coverage = articles.length > 0 ? Math.round((100 * reviewed) / articles.length) : 0;
  const gitAuthors = countGitAuthors(repoRoot);
  const people = new Set();
  for (const a of articles) {
    if (a.owner) people.add(a.owner);
    if (a.author) people.add(a.author);
  }
  const contributors = (typeof gitAuthors === 'number' && gitAuthors > 0) ? gitAuthors : people.size;

  return {
    articles: articles.length,
    reviewedArticles: reviewed,
    coverage,
    contributors,
    contributorsSource: (typeof gitAuthors === 'number' && gitAuthors > 0) ? 'git-authors' : 'article-owners',
  };
}
