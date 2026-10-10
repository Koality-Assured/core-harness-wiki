#!/usr/bin/env node
// docs/scripts/validate-content.mjs
// Run from repo root: node docs/scripts/validate-content.mjs
// Validates markdown metadata, frontmatter syntax, slug uniqueness, and link integrity.
// Zero dependencies — runs on standard Node 20+.

import {
  SECTIONS, SECTION_IDS, SEVERITIES, REQUIRED_FIELDS,
  listAllArticles, readArticle, readManifest, pathInfo,
  isStrictArticle, inferManifestRow,
} from './lib.mjs';

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`✗ ${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`⚠ ${file}: ${msg}`);

const candidates = listAllArticles();
const slugs = new Set();
const articlesByFile = {};

for (const f of candidates) {
  const { fm, src } = readArticle(f);
  const pi = pathInfo(f);

  if (isStrictArticle(fm)) {
    for (const k of REQUIRED_FIELDS) {
      if (fm[k] === undefined || fm[k] === '' || fm[k] === null) {
        err(f, `missing required frontmatter field: ${k}`);
      }
    }

    if (fm.section && !SECTION_IDS.includes(fm.section)) {
      err(f, `section "${fm.section}" not in configured sections [${SECTION_IDS.join(', ')}]`);
    }

    if (fm.severity && !SEVERITIES.includes(fm.severity)) {
      err(f, `severity "${fm.severity}" not in [${SEVERITIES.join(', ')}]`);
    }

    const expectedSlug = f.replace(/\.md$/, '');
    if (fm.slug && fm.slug !== expectedSlug) {
      err(f, `frontmatter slug "${fm.slug}" should mirror file path "${expectedSlug}"`);
    }

    const currentSlug = fm.slug || expectedSlug;
    if (slugs.has(currentSlug)) {
      err(f, `duplicate slug "${currentSlug}"`);
    }
    slugs.add(currentSlug);

    if (fm.tags && !Array.isArray(fm.tags)) err(f, 'tags must be an array');
    if (fm.related && !Array.isArray(fm.related)) err(f, 'related must be an array');

    articlesByFile[f] = fm;
    continue;
  }

  // Inferable article (markdown starting with `# Title`)
  const inferred = inferManifestRow(f, src, fm);
  if (inferred) {
    if (slugs.has(inferred.slug)) {
      err(f, `duplicate slug "${inferred.slug}"`);
    }
    slugs.add(inferred.slug);
    articlesByFile[f] = { slug: inferred.slug, related: inferred.related || [] };
    continue;
  }

  err(f, 'file must have either complete frontmatter or a leading `# Title` heading');
}

// Validate related links
for (const [f, fm] of Object.entries(articlesByFile)) {
  for (const ref of fm.related || []) {
    if (!slugs.has(ref)) {
      warn(f, `related slug "${ref}" does not exist in scanned articles`);
    }
    if (ref === fm.slug) {
      err(f, 'related field cannot reference the article itself');
    }
  }
}

// Validate manifest sync status
try {
  const manifest = readManifest();
  const manifestSlugs = new Set((manifest.articles || []).map(a => a.slug));
  const fileSlugs = new Set(Object.keys(articlesByFile).map(f => f.replace(/\.md$/, '')));

  for (const s of fileSlugs) {
    if (!manifestSlugs.has(s)) {
      warn(`./${s}.md`, 'valid on disk but not present in docs/manifest.json (run build-manifest)');
    }
  }
  for (const s of manifestSlugs) {
    if (!fileSlugs.has(s)) {
      warn('manifest.json', `lists slug "${s}" but no matching file exists on disk`);
    }
  }
} catch (e) {
  warn('manifest.json', `could not read manifest: ${e.message}`);
}

console.log(`Validation: Scanned ${candidates.length} candidate file(s).`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log('  ' + w);
}

if (errors.length > 0) {
  console.log('\nErrors:');
  for (const e of errors) console.log('  ' + e);
  console.log(`\n${errors.length} error(s) found. Please resolve before deployment.`);
  process.exit(1);
}

console.log('\n✓ All content validation checks passed.');
