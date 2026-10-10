// docs/scripts/lib.mjs — shared helpers for validate, build-manifest, and sync-site-content.
// Zero dependencies — runs on standard Node 20+ in GitHub Actions and locally.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DOCS_ROOT = path.resolve(SCRIPT_DIR, '..');
export const REPO_ROOT = path.resolve(DOCS_ROOT, '..');
export const MANIFEST_PATH = path.join(DOCS_ROOT, 'manifest.json');
export const CONFIG_PATH = path.join(REPO_ROOT, 'wiki.config.json');

// ── Configuration Loading & Auto-Discovery ─────────────────────────────────

export function loadConfig() {
  let userConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.warn(`[lib.mjs] Warning: Could not parse ${CONFIG_PATH}: ${e.message}`);
    }
  }

  const defaultSections = [
    { id: 'architecture', name: 'Architecture', code: 'ARCH', desc: 'Core harness architecture, context firebreaks, and memory subsystems.', priority: 'primary' },
    { id: 'standards',    name: 'Standards',    code: 'STND', desc: 'Normative standards, context management, repository taxonomy, and naming rules.', priority: 'primary' },
    { id: 'ai-tooling',   name: 'AI Tooling',   code: 'TOOL', desc: 'Operator archetypes, skills catalog, A2A interaction protocol, and memory schemas.', priority: 'primary' },
    { id: 'supporting',   name: 'Supporting',   code: 'SUPP', desc: 'Operational tool patterns, CLI guides, ast-grep, QMD discovery, and Headroom.', priority: 'primary' },
    { id: 'references',   name: 'References',   code: 'REF',  desc: 'Industry standards, benchmark methodologies, and conventional commit rules.', priority: 'primary' },
  ];

  return {
    name: userConfig.name || 'Core Harness Wiki',
    tagline: userConfig.tagline || 'The Knowledge Base & Operating System for AI Agent Harnesses',
    description: userConfig.description || 'Interactive documentation, architectural standards, tool patterns, and agent protocols.',
    org: userConfig.org || 'Koality-Assured',
    repo: userConfig.repo || '',
    branch: userConfig.branch || 'main',
    siteDir: userConfig.siteDir || 'docs',
    sections: userConfig.sections || defaultSections,
    severities: userConfig.severities || {
      critical: { label: 'CRITICAL', tone: 'crit' },
      high:     { label: 'HIGH',     tone: 'high' },
      medium:   { label: 'MEDIUM',   tone: 'med' },
      low:      { label: 'LOW',      tone: 'low' },
      info:     { label: 'INFO',     tone: 'info' },
    },
    skipPrefixes: userConfig.skipPrefixes || [
      '.git/',
      '.github/',
      'node_modules/',
      'scratch/',
      'dist/',
      'build/',
      'tmp/',
      'docs/scripts/',
    ],
  };
}

export const CONFIG = loadConfig();
export const SECTIONS = CONFIG.sections;
export const SECTION_IDS = SECTIONS.map(s => s.id);
export const SEVERITIES = Object.keys(CONFIG.severities);
export const REQUIRED_FIELDS = [
  'title', 'slug', 'section', 'severity', 'owner', 'updated', 'summary',
];

export const EXCLUDE_BASENAMES = new Set([
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'PORTING.md',
  'MAINTENANCE.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE.md',
]);

export function posixRel(relPath) {
  return relPath.split(path.sep).join('/');
}

export function shouldSkipPath(relPosix) {
  if (CONFIG.skipPrefixes.some(p => relPosix === p || relPosix.startsWith(p))) return true;
  return false;
}

export function basenameExcluded(basename) {
  return EXCLUDE_BASENAMES.has(basename);
}

// ── YAML-lite parser ─────────────────────────────────────────────────────────

export function parseYamlLite(src) {
  const out = {};
  const lines = src.split('\n');
  let currentKey = null;
  let multilineMode = false;
  let multilineBuf = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Multiline folded scalar support: key: >- or key: |
    if (multilineMode) {
      if (line.startsWith('  ') || line.startsWith('\t')) {
        multilineBuf.push(line.trim());
        continue;
      } else {
        out[currentKey] = multilineBuf.join(' ').trim();
        multilineMode = false;
        multilineBuf = [];
        currentKey = null;
      }
    }

    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const raw = m[2].trim();

    if (raw === '>-' || raw === '>' || raw === '|' || raw === '|-') {
      currentKey = key;
      multilineMode = true;
      multilineBuf = [];
      continue;
    }

    let val;
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const inner = raw.slice(1, -1).trim();
      val = inner
        ? inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s => {
          const t = s.trim();
          return t.startsWith('"') && t.endsWith('"') ? JSON.parse(t) : t.replace(/^['"]|['"]$/g, '');
        })
        : [];
    } else if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      val = raw.slice(1, -1);
    } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
      val = parseFloat(raw);
    } else if (raw === 'true' || raw === 'false') {
      val = raw === 'true';
    } else if (raw === '~' || raw === 'null' || raw === '') {
      val = null;
    } else {
      val = raw;
    }
    out[key] = val;
  }

  if (multilineMode && currentKey) {
    out[currentKey] = multilineBuf.join(' ').trim();
  }

  return out;
}

export function extractFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  return parseYamlLite(m[1]);
}

export function stripLeadingYamlFence(src) {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart();
}

export function extractH1Title(src) {
  const body = stripLeadingYamlFence(src);
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim().replace(/\s+#\s*$/, '') : null;
}

export function extractSemanticTags(src) {
  const head = stripLeadingYamlFence(src).slice(0, 4000);
  const mo = head.match(/\*\*(?:Semantic tags|Tags):\*\*\s*([^\r\n]+)/i);
  if (!mo) return [];
  const out = [];
  for (const t of mo[1].matchAll(/`([^`]+)`/g)) out.push(t[1]);
  return out;
}

export function inferSummaryFromMarkdown(src) {
  let s = stripLeadingYamlFence(src);
  s = s.replace(/^#\s[^\r\n]+\r?\n+/m, '');
  while ((s.split('\n')[0] || '').match(/^\*\*[^*]+\*\*:.*$/)) {
    s = s.replace(/^.*(\r?\n|$)/, '').trimStart();
  }
  const purpose = s.match(/^##\s*Purpose\b[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n##\s|\r?\n#\s|$)/im);
  if (purpose) {
    let txt = purpose[1].replace(/^\s*[-*]\s+/gm, ' ').replace(/\s+/g, ' ').trim();
    if (txt.length > 320) txt = `${txt.slice(0, 317)}…`;
    if (txt) return txt;
  }
  const firstBlock = s.split(/\r?\n\s*\r?\n/).find(blk => /^[^#|`\s]/.test(blk || ''));
  if (firstBlock) {
    let txt = firstBlock.replace(/\s+/g, ' ').trim();
    if (txt.length > 320) txt = `${txt.slice(0, 317)}…`;
    if (txt) return txt;
  }
  return extractH1Title(src) || 'Documentation article.';
}

export function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ── Git Dates with MTime fallback ──────────────────────────────────────────

let gitDateMapCache;
function getGitLastCommitDateMap() {
  if (gitDateMapCache !== undefined) return gitDateMapCache;
  try {
    const raw = execSync('git -c core.quotepath=false log --format=%x01%cd --date=short --name-only', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
    const map = new Map();
    let current = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('\x01')) { current = line.slice(1).trim(); continue; }
      const p = line.trim();
      if (!p || !current) continue;
      if (!map.has(p)) map.set(p, current);
    }
    gitDateMapCache = map;
  } catch {
    gitDateMapCache = null;
  }
  return gitDateMapCache;
}

export function fileLastUpdatedYmd(relPath) {
  const fromGit = getGitLastCommitDateMap()?.get(relPath);
  if (fromGit && /^\d{4}-\d{2}-\d{2}$/.test(fromGit)) return fromGit;
  try {
    const st = fs.statSync(path.join(REPO_ROOT, relPath));
    return st.mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Manifest Inference ──────────────────────────────────────────────────────

export function pathInfo(relPath) {
  const parts = posixRel(relPath).split('/');
  const file = parts.pop();
  const stem = file.replace(/\.md$/, '');
  const section = parts[0];
  const subsection = parts.length > 1 ? parts.slice(1).join('/') : null;
  return { section, subsection, stem, file };
}

export function isStrictArticle(fm) {
  if (!fm) return false;
  return REQUIRED_FIELDS.every(k => fm[k] !== undefined && fm[k] !== '' && fm[k] !== null);
}

export function inferManifestRow(relPath, src, fm = null) {
  const pi = pathInfo(relPath);
  if (shouldSkipPath(relPath)) return null;
  if (basenameExcluded(path.basename(relPath))) return null;

  const titleFromBody = extractH1Title(src);
  const title = (fm?.title && typeof fm.title === 'string') ? fm.title : (titleFromBody || pi.stem);
  const slug = fm?.slug || relPath.replace(/\.md$/, '');
  const tags = (fm?.tags && Array.isArray(fm.tags)) ? fm.tags : extractSemanticTags(src);
  const owner = (fm?.owner && typeof fm.owner === 'string') ? fm.owner : (CONFIG.org || 'core-harness');
  const updated = (fm?.updated && String(fm.updated).match(/^\d{4}-\d{2}-\d{2}$/))
    ? String(fm.updated).slice(0, 10)
    : fileLastUpdatedYmd(relPath);
  const severity = SEVERITIES.includes(fm?.severity) ? fm.severity : 'info';
  const readingTime = fm?.reading_time || calculateReadingTime(src);
  const summary = (fm?.summary && typeof fm.summary === 'string') ? fm.summary : inferSummaryFromMarkdown(src);

  return {
    file: relPath,
    slug,
    title,
    section: fm?.section || pi.section,
    subsection: fm?.subsection ?? pi.subsection ?? null,
    severity,
    owner,
    author: fm?.author || null,
    updated,
    reviewed: fm?.reviewed || null,
    reading_time: readingTime,
    tags,
    summary,
    related: Array.isArray(fm?.related) ? fm.related : [],
  };
}

// ── File Scanning ───────────────────────────────────────────────────────────

export function walkSectionMarkdown(sectionId) {
  const root = path.join(REPO_ROOT, sectionId);
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const relDir = posixRel(path.relative(REPO_ROOT, full));
        if (!shouldSkipPath(relDir)) stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const rel = posixRel(path.relative(REPO_ROOT, full));
        if (shouldSkipPath(rel)) continue;
        if (basenameExcluded(entry.name)) continue;
        out.push(rel);
      }
    }
  }
  return out.sort();
}

export function listAllArticles() {
  return SECTION_IDS.flatMap(secId => walkSectionMarkdown(secId)).sort((a, b) => a.localeCompare(b));
}

export function readArticle(relPath) {
  const filepath = path.join(REPO_ROOT, relPath);
  const src = fs.readFileSync(filepath, 'utf8');
  const fm = extractFrontmatter(src);
  return { file: relPath, filepath, src, fm };
}

export function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return { meta: {}, sections: [], articles: [], stats: {} };
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}
