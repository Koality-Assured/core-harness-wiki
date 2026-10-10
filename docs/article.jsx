// docs/article.jsx — Article reader with TOC, frontmatter banner, code copy, and full markdown rendering.

function normalizePath(p) {
  const parts = String(p || '').replace(/\\/g, '/').split('/');
  const out = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (out.length) out.pop();
      continue;
    }
    out.push(part);
  }
  return out.join('/');
}

function resolveDocPath(baseFile, hrefPath) {
  const target = String(hrefPath || '').replace(/\\/g, '/');
  if (!target) return '';
  if (target.startsWith('/')) return normalizePath(target);
  const baseDir = String(baseFile || '').replace(/\\/g, '/').split('/').slice(0, -1);
  return normalizePath([...baseDir, ...target.split('/')].join('/'));
}

function findArticleByPath(docPath) {
  const targetPath = normalizePath(docPath);
  const targetSlug = targetPath.replace(/\.md$/i, '');
  return (window.WIKI_DATA?.articles || []).find((a) => {
    const fPath = normalizePath(a.file || `${a.slug}.md`);
    return fPath === targetPath || a.slug === targetSlug;
  });
}

function githubBlobHref(docPath, anchor) {
  const meta = window.WIKI_DATA?.meta || {};
  const repo = typeof meta.repo === 'string' ? meta.repo.trim() : '';
  const branch = typeof meta.branch === 'string' && meta.branch.trim() ? meta.branch.trim() : 'main';
  if (!repo || !docPath) return '';
  const base = `https://github.com/${repo}/blob/${encodeURIComponent(branch)}/${normalizePath(docPath)}`;
  return anchor ? `${base}#${encodeURIComponent(anchor)}` : base;
}

function githubEditHref(docPath) {
  const meta = window.WIKI_DATA?.meta || {};
  const repo = typeof meta.repo === 'string' ? meta.repo.trim() : '';
  const branch = typeof meta.branch === 'string' && meta.branch.trim() ? meta.branch.trim() : 'main';
  if (!repo || !docPath) return '';
  return `https://github.com/${repo}/edit/${encodeURIComponent(branch)}/${normalizePath(docPath)}`;
}

function githubIssueHref(article) {
  const meta = window.WIKI_DATA?.meta || {};
  const repo = typeof meta.repo === 'string' ? meta.repo.trim() : '';
  if (!repo || !article) return '';
  const file = article.file || `${article.slug}.md`;
  const title = encodeURIComponent(`[Docs] ${article.title || file}`);
  const body = encodeURIComponent(
    `Article: ${article.title || ''}\nPath: ${file}\nURL: ${window.location.href}\n\nDescribe the issue or feedback:\n`
  );
  return `https://github.com/${repo}/issues/new?title=${title}&body=${body}`;
}

function resolveHref(article, rawHref) {
  const href = String(rawHref || '').trim();
  if (!href) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
    return { type: 'external', href };
  }
  if (href.startsWith('#')) {
    return { type: 'anchor', anchor: decodeURIComponent(href.slice(1)) };
  }

  const hashIdx = href.indexOf('#');
  const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const anchor = hashIdx >= 0 ? decodeURIComponent(href.slice(hashIdx + 1)) : null;
  const resolvedPath = resolveDocPath(article.file || `${article.slug}.md`, pathPart);
  const targetArt = findArticleByPath(resolvedPath);
  if (targetArt) {
    return { type: 'article', slug: targetArt.slug, anchor };
  }
  const fallback = githubBlobHref(resolvedPath, anchor);
  if (fallback) return { type: 'source', href: fallback };
  return { type: 'external', href };
}

function renderInlineText(text, article, go, onJump) {
  const tokens = window.MD.parseInlineTokens(text);
  return tokens.map((token, idx) => {
    if (token.type === 'text') {
      return <React.Fragment key={idx}>{token.text}</React.Fragment>;
    }
    if (token.type === 'bold') {
      return <strong key={idx}>{renderInlineText(token.text, article, go, onJump)}</strong>;
    }
    if (token.type === 'italic') {
      return <em key={idx}>{renderInlineText(token.text, article, go, onJump)}</em>;
    }
    if (token.type === 'strike') {
      return <del key={idx}>{renderInlineText(token.text, article, go, onJump)}</del>;
    }
    if (token.type === 'code') {
      return <code key={idx} className="mono" style={{ background: 'var(--bg-surface)', padding: '2px 5px', borderRadius: 4, fontSize: '0.9em' }}>{token.text}</code>;
    }
    if (token.type === 'image') {
      return <img key={idx} src={token.src} alt={token.alt} style={{ maxWidth: '100%', borderRadius: 'var(--radius)', margin: '12px 0' }} />;
    }
    if (token.type === 'link') {
      const res = resolveHref(article, token.href);
      if (res?.type === 'anchor') {
        return (
          <a
            key={idx}
            href={`#${res.anchor}`}
            onClick={(e) => {
              e.preventDefault();
              onJump(res.anchor);
            }}
          >
            {token.text}
          </a>
        );
      }
      if (res?.type === 'article') {
        return (
          <a
            key={idx}
            href={`#/${res.slug}`}
            onClick={(e) => {
              e.preventDefault();
              if (res.slug === article.slug && res.anchor) {
                onJump(res.anchor);
                return;
              }
              go({ name: 'article', slug: res.slug });
              if (res.anchor) {
                setTimeout(() => onJump(res.anchor), 100);
              }
            }}
          >
            {token.text}
          </a>
        );
      }
      return (
        <a key={idx} href={res?.href || token.href} target="_blank" rel="noreferrer">
          {token.text} ↗
        </a>
      );
    }
    return null;
  });
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const lines = code.split('\n').map((ln, k) => {
    const m = ln.match(/^(\s*[$#>])(\s.*)$/);
    if (m) {
      return <div key={k}><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{m[1]}</span><span style={{ color: 'var(--fg)' }}>{m[2]}</span></div>;
    }
    const m2 = ln.match(/^(\s*)(#.*)$/);
    if (m2) {
      return <div key={k} style={{ color: 'var(--muted)' }}>{ln}</div>;
    }
    return <div key={k}>{ln}</div>;
  });

  return (
    <div className="code-wrapper">
      <div className="code-header">
        <span>{lang || 'text'}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="mono">{lines}</pre>
    </div>
  );
}

function renderBlock(b, i, article, go, onJump) {
  if (b.type === 'lead') {
    return <p key={i} className="lead">{renderInlineText(b.text, article, go, onJump)}</p>;
  }
  if (b.type === 'p') {
    return <p key={i}>{renderInlineText(b.text, article, go, onJump)}</p>;
  }
  if (b.type === 'h') {
    const HeadingTag = b.level === 1 ? 'h1' : b.level === 2 ? 'h2' : b.level === 3 ? 'h3' : 'h4';
    return <HeadingTag key={i} id={b.id}>{b.text}</HeadingTag>;
  }
  if (b.type === 'hr') {
    return <hr key={i} />;
  }
  if (b.type === 'ol') {
    return <ol key={i}>{b.items.map((it, j) => <li key={j}>{renderInlineText(it, article, go, onJump)}</li>)}</ol>;
  }
  if (b.type === 'ul') {
    return <ul key={i}>{b.items.map((it, j) => <li key={j}>{renderInlineText(it, article, go, onJump)}</li>)}</ul>;
  }
  if (b.type === 'tasklist') {
    return (
      <ul key={i} className="tasklist">
        {b.items.map((it, j) => (
          <li key={j}>
            <input type="checkbox" checked={it.checked} readOnly style={{ accentColor: 'var(--accent)' }} />
            <span>{renderInlineText(it.text, article, go, onJump)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (b.type === 'code') {
    return <CodeBlock key={i} code={b.text} lang={b.lang} />;
  }
  if (b.type === 'callout') {
    return (
      <div key={i} className={`callout ${b.tone || 'info'}`}>
        <div className="icn">{b.tone === 'crit' ? '!!' : b.tone === 'warn' ? '!' : 'ℹ'}</div>
        <div>
          {b.title && <div className="ttl">{b.title}</div>}
          <div className="txt">{renderInlineText(b.text, article, go, onJump)}</div>
        </div>
      </div>
    );
  }
  if (b.type === 'table') {
    return (
      <div key={i} style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              {b.headers.map((h, j) => (
                <th key={j}>{renderInlineText(h, article, go, onJump)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((row, j) => (
              <tr key={j}>
                {row.map((cell, k) => (
                  <td key={k} className={k === 0 ? 'mono' : ''}>
                    {renderInlineText(cell, article, go, onJump)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

function TOC({ article, sections, activeId, onJump }) {
  const [copied, setCopied] = React.useState(false);
  const file = article.file || `${article.slug}.md`;
  const editHref = githubEditHref(file);
  const sourceHref = githubBlobHref(file);
  const issueHref = githubIssueHref(article);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <nav className="toc">
      <div className="toc-h">On this page</div>
      {sections.map((s, i) => (
        <div
          key={s.id}
          className={`toc-item ${activeId === s.id ? 'active' : ''}`}
          style={{ paddingLeft: s.level === 3 ? 14 : 6 }}
          onClick={() => onJump(s.id)}
        >
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <span>{s.h}</span>
        </div>
      ))}
      <div className="toc-h" style={{ marginTop: 20 }}>Actions</div>
      <div className="toc-item" onClick={copyLink}>
        {copied ? '✓ Link copied' : '📋 Copy page link'}
      </div>
      {sourceHref && (
        <a className="toc-item" href={sourceHref} target="_blank" rel="noreferrer">
          ↗ View source
        </a>
      )}
      {editHref && (
        <a className="toc-item" href={editHref} target="_blank" rel="noreferrer">
          ✏ Edit on GitHub
        </a>
      )}
      {issueHref && (
        <a className="toc-item" href={issueHref} target="_blank" rel="noreferrer">
          ⚠ Report issue
        </a>
      )}
    </nav>
  );
}

function ArticleScreen({ slug, go, layout }) {
  const [article, setArticle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    window.WIKI_LOADER.loadArticle(slug).then((art) => {
      if (cancelled) return;
      setArticle(art);
      setLoading(false);
      if (art.sections && art.sections.length > 0) {
        setActiveId(art.sections[0].id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onJump = (anchorId) => {
    setActiveId(anchorId);
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
        <div style={{ color: 'var(--accent)', marginBottom: 8 }}>▸ LOADING DOCUMENT</div>
        <div>{slug}</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ padding: '40px 0' }}>
        <h2>Article not found</h2>
        <p>The document at slug <code>{slug}</code> could not be located.</p>
        <button className="btn" onClick={() => go({ name: 'home' })}>Return Home</button>
      </div>
    );
  }

  const sections = article.sections || [];
  const hasToc = layout !== 'centered' && sections && sections.length > 0;
  const trail = [
    { label: 'Home', route: { name: 'home' } },
    { label: article.section, route: { name: 'section', section: article.section } },
    ...(article.subsection ? [{ label: article.subsection, route: { name: 'subsection', section: article.section, subsection: article.subsection } }] : []),
    { label: article.title },
  ];

  return (
    <div>
      <Crumbs trail={trail} go={go} />
      <div className={`article-view ${layout === 'centered' ? 'layout-centered' : ''} ${!hasToc ? 'no-toc' : ''}`}>
        <article className="article-content">
          <header className="article-header">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <SectionBadge section={article.section} />
              <Sev level={article.severity} />
            </div>
            <h1>{article.title}</h1>
            <div className="article-meta">
              <span>Updated: {article.updated}</span>
              <span>·</span>
              <span>Owner: {article.owner}</span>
              {article.readingTime && (
                <>
                  <span>·</span>
                  <span>{article.readingTime}</span>
                </>
              )}
            </div>
            {(article.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {article.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </header>

          <div className="article-body">
            {(article.body || []).map((b, i) => renderBlock(b, i, article, go, onJump))}
          </div>

          {article.related && article.related.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                Related Articles
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {article.related.map((relSlug) => (
                  <button
                    key={relSlug}
                    className="btn"
                    style={{ fontSize: 12 }}
                    onClick={() => go({ name: 'article', slug: relSlug })}
                  >
                    → {relSlug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>

        {hasToc && (
          <aside>
            <TOC article={article} sections={sections} activeId={activeId} onJump={onJump} />
          </aside>
        )}
      </div>
    </div>
  );
}
