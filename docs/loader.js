// docs/loader.js — Lazy-loading runtime loader with in-memory article caching.
// Fetches manifest.json for immediate shell & navigation rendering.
// Articles are fetched on-demand and cached locally in-memory.

(function () {
  const contentBase = (window.WIKI_CONTENT_BASE || '.').replace(/\/$/, '');
  const manifestPath = window.WIKI_MANIFEST_PATH || `${contentBase}/manifest.json`;

  const articleCache = new Map();
  const fetchPromises = new Map();

  async function fetchText(path) {
    const r = await fetch(path, { cache: 'default' });
    if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${path}`);
    return r.text();
  }

  async function fetchJson(path) {
    const r = await fetch(path, { cache: 'default' });
    if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${path}`);
    return r.json();
  }

  function resolveFile(meta) {
    return meta.file || `${meta.slug}.md`;
  }

  async function loadArticle(slug) {
    if (articleCache.has(slug)) {
      return articleCache.get(slug);
    }

    if (fetchPromises.has(slug)) {
      return fetchPromises.get(slug);
    }

    const meta = (window.WIKI_DATA?.articles || []).find(a => a.slug === slug);
    if (!meta) {
      throw new Error(`Article slug not found in manifest: ${slug}`);
    }

    const promise = (async () => {
      const filePath = `${contentBase}/${resolveFile(meta)}`;
      try {
        const mdText = await fetchText(filePath);
        const parsed = window.MD.parseMarkdown(mdText);
        const fm = parsed.frontmatter;

        const fullArticle = {
          ...meta,
          title: fm.title || meta.title,
          section: fm.section || meta.section,
          subsection: fm.subsection ?? meta.subsection ?? null,
          severity: fm.severity || meta.severity,
          owner: fm.owner || meta.owner,
          author: fm.author || meta.author,
          updated: fm.updated || meta.updated,
          reviewed: fm.reviewed || meta.reviewed,
          readingTime: fm.reading_time || meta.reading_time,
          tags: fm.tags || meta.tags || [],
          summary: fm.summary || meta.summary,
          related: fm.related || meta.related || [],
          sections: parsed.sections,
          body: parsed.blocks,
          rawMarkdown: mdText,
        };

        articleCache.set(slug, fullArticle);
        return fullArticle;
      } catch (err) {
        console.warn(`[WikiLoader] Failed to fetch article "${slug}" from ${filePath}:`, err);
        const fallbackArticle = {
          ...meta,
          sections: [],
          body: [
            {
              type: 'callout',
              tone: 'warn',
              title: 'Article body unavailable',
              text: `Could not load article file at ${filePath}. Check network connection or verify that the file exists in the repository.`,
            },
          ],
        };
        articleCache.set(slug, fallbackArticle);
        return fallbackArticle;
      } finally {
        fetchPromises.delete(slug);
      }
    })();

    fetchPromises.set(slug, promise);
    return promise;
  }

  function applyFallback(source) {
    const fb = window.WIKI_DATA_FALLBACK || {
      sections: [],
      articles: [],
      sev: {},
      recentEvents: [],
      stats: { articles: 0 },
      meta: {},
    };

    window.WIKI_DATA = {
      sections: fb.sections || [],
      articles: fb.articles || [],
      sev: fb.sev || {},
      recentEvents: fb.recentEvents || [],
      stats: fb.stats || { articles: 0 },
      meta: fb.meta || {},
      loadedFrom: source || 'fallback',
    };
  }

  window.WIKI_LOADER = {
    loadArticle,
    getArticle: (slug) => articleCache.get(slug) || null,
    clearCache: () => articleCache.clear(),
  };

  window.WIKI_READY = (async () => {
    try {
      const manifest = await fetchJson(manifestPath);
      window.WIKI_DATA = {
        sections: manifest.sections || [],
        articles: manifest.articles || [],
        sev: manifest.sev || {},
        recentEvents: manifest.recentEvents || [],
        stats: manifest.stats || { articles: (manifest.articles || []).length },
        meta: manifest.meta || {},
        loadedFrom: 'github-pages',
      };
      console.info(
        `%c[CoreHarnessWiki] %cLoaded manifest (${manifest.articles.length} articles across ${manifest.sections.length} sections)`,
        'color:#00f0ff;font-weight:600',
        'color:inherit'
      );
    } catch (err) {
      console.warn('[CoreHarnessWiki] Manifest fetch failed, falling back to bundled fallback data.', err);
      applyFallback('bundled-fallback');
    }
  })();
})();
