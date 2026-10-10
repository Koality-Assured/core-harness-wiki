// docs/other-screens.jsx — Section, Subsection, SearchModal, Settings, Recent, Starred screens.

function ArticleListItem({ article, go }) {
  const isStarred = isArticleStarred(article.slug);
  const [starred, setStarred] = React.useState(isStarred);

  const toggleStar = (e) => {
    e.stopPropagation();
    const next = toggleArticleStarred(article.slug);
    setStarred(next);
  };

  return (
    <div
      onClick={() => go({ name: 'article', slug: article.slug })}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        gap: 16,
        transition: 'all 0.1s ease',
      }}
      className="article-list-item"
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{article.title}</span>
          <Sev level={article.severity} />
        </div>
        <p style={{ color: 'var(--fg-2)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.summary}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div className="mono muted" style={{ fontSize: 11, textAlign: 'right' }}>
          <div>{article.updated}</div>
          <div style={{ opacity: 0.7 }}>{article.owner}</div>
        </div>
        <button
          onClick={toggleStar}
          style={{ background: 'transparent', border: 'none', color: starred ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
          title={starred ? 'Starred' : 'Star this article'}
        >
          {starred ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}

function SectionScreen({ section, go }) {
  const D = window.WIKI_DATA || { sections: [], articles: [] };
  const sec = D.sections.find(s => s.id === section);
  if (!sec) return <div className="muted">Section not found.</div>;

  const articles = D.articles.filter(a => a.section === section);
  const bySub = {};
  for (const a of articles) {
    const key = a.subsection || '__root__';
    (bySub[key] = bySub[key] || []).push(a);
  }

  const trail = [
    { label: 'Home', route: { name: 'home' } },
    { label: sec.name || sec.id },
  ];

  return (
    <div>
      <Crumbs trail={trail} go={go} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <SectionBadge section={sec.id} />
        <h1>{sec.name || sec.id}</h1>
        <span className="mono muted" style={{ fontSize: 12 }}>{articles.length} article(s)</span>
      </div>
      <p style={{ color: 'var(--fg-2)', maxWidth: 900, marginBottom: 28, borderLeft: `3px solid ${sec.accent || 'var(--accent)'}`, paddingLeft: 14 }}>
        {sec.desc}
      </p>

      {bySub['__root__'] && bySub['__root__'].length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 12 }}>
            Articles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bySub['__root__'].map(a => <ArticleListItem key={a.slug} article={a} go={go} />)}
          </div>
        </div>
      )}

      {Object.keys(bySub).filter(k => k !== '__root__').sort().map(subId => (
        <div key={subId} style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2
              style={{ fontSize: 18, cursor: 'pointer', margin: 0 }}
              onClick={() => go({ name: 'subsection', section: sec.id, subsection: subId })}
            >
              📁 {subId}
            </h2>
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}
              onClick={() => go({ name: 'subsection', section: sec.id, subsection: subId })}
            >
              view {bySub[subId].length} doc(s) →
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bySub[subId].map(a => <ArticleListItem key={a.slug} article={a} go={go} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubsectionScreen({ section, subsection, go }) {
  const D = window.WIKI_DATA || { sections: [], articles: [] };
  const sec = D.sections.find(s => s.id === section);
  if (!sec) return <div className="muted">Section not found.</div>;

  const articles = D.articles.filter(
    a => a.section === section && a.subsection && (a.subsection === subsection || a.subsection.startsWith(`${subsection}/`))
  );

  const trail = [
    { label: 'Home', route: { name: 'home' } },
    { label: sec.name || sec.id, route: { name: 'section', section: sec.id } },
    { label: subsection },
  ];

  return (
    <div>
      <Crumbs trail={trail} go={go} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <SectionBadge section={sec.id} />
        <h1>{subsection}</h1>
        <span className="mono muted" style={{ fontSize: 12 }}>{articles.length} article(s)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        {articles.map(a => <ArticleListItem key={a.slug} article={a} go={go} />)}
      </div>
    </div>
  );
}

function RecentScreen({ go }) {
  const articles = [...(window.WIKI_DATA?.articles || [])].sort((a, b) =>
    (b.updated || '').localeCompare(a.updated || '')
  );

  return (
    <div>
      <Crumbs trail={[{ label: 'Home', route: { name: 'home' } }, { label: 'Recent Updates' }]} go={go} />
      <h1>Recent Document Updates</h1>
      <p style={{ color: 'var(--fg-2)', marginBottom: 24 }}>Chronological list of recently touched documents in the repository.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {articles.map(a => <ArticleListItem key={a.slug} article={a} go={go} />)}
      </div>
    </div>
  );
}

function StarredScreen({ go }) {
  const starredSlugs = getStarredSlugs();
  const articles = (window.WIKI_DATA?.articles || []).filter(a => starredSlugs.includes(a.slug));

  return (
    <div>
      <Crumbs trail={[{ label: 'Home', route: { name: 'home' } }, { label: 'Starred Articles' }]} go={go} />
      <h1>Starred Articles</h1>
      <p style={{ color: 'var(--fg-2)', marginBottom: 24 }}>Your bookmarked documents, persisted locally in your browser.</p>
      {articles.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--muted)', textAlign: 'center' }}>
          No starred articles yet. Click the star icon next to any document to pin it here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {articles.map(a => <ArticleListItem key={a.slug} article={a} go={go} />)}
        </div>
      )}
    </div>
  );
}

function SearchModal({ open, onClose, go }) {
  const D = window.WIKI_DATA || { sections: [], articles: [] };
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        'Suggested': [...D.articles].sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 5),
        'Quick Actions': [
          { type: 'action', label: 'Go to Home', go: { name: 'home' } },
          { type: 'action', label: 'Open Settings', go: { name: 'settings' } },
          { type: 'action', label: 'Recent Updates', go: { name: 'recent' } },
        ],
      };
    }

    const matchedArticles = D.articles.filter((a) => (
      a.title.toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (a.tags || []).some(t => String(t).toLowerCase().includes(q)) ||
      (a.section || '').toLowerCase().includes(q) ||
      (a.owner || '').toLowerCase().includes(q)
    ));

    const matchedSections = D.sections.filter((s) => (
      (s.name || s.id).toLowerCase().includes(q) ||
      (s.desc || '').toLowerCase().includes(q)
    ));

    const out = {};
    if (matchedArticles.length > 0) out['Articles'] = matchedArticles;
    if (matchedSections.length > 0) out['Sections'] = matchedSections.map(s => ({ type: 'section', ...s }));
    return out;
  }, [query, D]);

  const flatItems = React.useMemo(() => {
    const items = [];
    for (const [group, groupItems] of Object.entries(results)) {
      groupItems.forEach(item => items.push({ group, item }));
    }
    return items;
  }, [results]);

  const executeItem = (item) => {
    if (item.type === 'action') go(item.go);
    else if (item.type === 'section') go({ name: 'section', section: item.id });
    else go({ name: 'article', slug: item.slug });
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) executeItem(flatItems[selectedIndex].item);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, flatItems, selectedIndex]);

  if (!open) return null;

  let counter = -1;

  return (
    <div className="cmdk-back" onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input">
          <span className="pmt">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search documentation, tags, standards, or tool patterns..."
          />
          <span className="esc">ESC</span>
        </div>

        <div className="cmdk-results">
          {Object.keys(results).length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
              No documents found matching "{query}"
            </div>
          ) : (
            Object.entries(results).map(([group, groupItems]) => (
              <div key={group}>
                <div className="cmdk-grp-h">{group}</div>
                {groupItems.map((item) => {
                  counter++;
                  const curIdx = counter;
                  const isActive = curIdx === selectedIndex;

                  if (item.type === 'action') {
                    return (
                      <div
                        key={'act-' + curIdx}
                        className={`cmdk-row ${isActive ? 'active' : ''}`}
                        onClick={() => executeItem(item)}
                      >
                        <span className="mono">⌘</span>
                        <span className="ttl">{item.label}</span>
                        <span className="mono muted" style={{ fontSize: 10 }}>ACTION</span>
                      </div>
                    );
                  }

                  if (item.type === 'section') {
                    return (
                      <div
                        key={'sec-' + item.id}
                        className={`cmdk-row ${isActive ? 'active' : ''}`}
                        onClick={() => executeItem(item)}
                      >
                        <span className="mono" style={{ color: item.accent || 'var(--accent)' }}>[{item.code}]</span>
                        <span className="ttl">
                          <span>{item.name || item.id}</span>
                          <small>{item.desc}</small>
                        </span>
                        <span className="mono muted" style={{ fontSize: 10 }}>SECTION</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.slug}
                      className={`cmdk-row ${isActive ? 'active' : ''}`}
                      onClick={() => executeItem(item)}
                    >
                      <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {item.section?.toUpperCase().slice(0, 4)}
                      </span>
                      <span className="ttl">
                        <span>{item.title}</span>
                        <small>{item.section} · upd {item.updated} · {item.owner}</small>
                      </span>
                      <Sev level={item.severity} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ go, t, setTweak }) {
  const meta = window.WIKI_DATA?.meta || {};
  const [cacheCleared, setCacheCleared] = React.useState(false);

  const clearCache = () => {
    window.WIKI_LOADER.clearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div>
      <Crumbs trail={[{ label: 'Home', route: { name: 'home' } }, { label: 'Settings' }]} go={go} />
      <h1>Wiki Settings & Configuration</h1>
      <p style={{ color: 'var(--fg-2)', marginBottom: 32 }}>Configure local display preferences, themes, and cache settings.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 20, borderRadius: 'var(--radius)' }}>
          <h3 style={{ margin: '0 0 12px' }}>Aesthetic Direction</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {['operative', 'nexus', 'redteam', 'minimal'].map((dir) => (
              <button
                key={dir}
                className={`btn ${t.direction === dir ? 'primary' : ''}`}
                onClick={() => setTweak('direction', dir)}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 20, borderRadius: 'var(--radius)' }}>
          <h3 style={{ margin: '0 0 12px' }}>Theme & Density</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <button className="btn" onClick={() => setTweak('dark', !t.dark)}>
              {t.dark ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['compact', 'regular', 'comfy'].map((density) => (
              <button
                key={density}
                className={`btn ${t.density === density ? 'primary' : ''}`}
                onClick={() => setTweak('density', density)}
              >
                {density}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 20, borderRadius: 'var(--radius)' }}>
          <h3 style={{ margin: '0 0 12px' }}>Article Layout</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {['sidebar', 'centered'].map((l) => (
              <button
                key={l}
                className={`btn ${t.articleLayout === l ? 'primary' : ''}`}
                onClick={() => setTweak('articleLayout', l)}
              >
                {l === 'sidebar' ? 'Sidebar TOC' : 'Centered'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 20, borderRadius: 'var(--radius)' }}>
          <h3 style={{ margin: '0 0 8px' }}>Local Memory Cache</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
            Articles are cached in memory for instant subsequent loads.
          </p>
          <button className="btn" onClick={clearCache}>
            {cacheCleared ? '✓ Cache Cleared' : 'Clear Article Cache'}
          </button>
        </div>
      </div>
    </div>
  );
}
