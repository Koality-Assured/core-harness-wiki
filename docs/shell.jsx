// docs/shell.jsx — Topbar, Sidebar, breadcrumbs, tags, and severity badges.

function LoadingState() {
  return (
    <div style={{ padding: '120px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
      <div style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 12 }}>
        ▸ INITIALIZING CORE HARNESS WIKI
      </div>
      <div>Loading manifest & navigation index…</div>
    </div>
  );
}

function Sev({ level }) {
  const sevConfig = window.WIKI_DATA?.sev?.[level] || { label: (level || 'INFO').toUpperCase(), tone: 'info' };
  return <span className={`sev ${sevConfig.tone}`}>{sevConfig.label}</span>;
}

function Tag({ children, onClick }) {
  return (
    <span className="tag" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      #{children}
    </span>
  );
}

function SectionBadge({ section }) {
  const sec = (window.WIKI_DATA?.sections || []).find(s => s.id === section);
  const accent = sec?.accent || 'var(--accent)';
  return (
    <span className="section-badge" style={{ borderColor: accent, color: accent }}>
      {sec?.code ? `[${sec.code}]` : ''} {sec?.name || section}
    </span>
  );
}

function Crumbs({ trail, go }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 20, flexWrap: 'wrap' }}>
      {trail.map((step, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span style={{ opacity: 0.4 }}>/</span>}
          {step.route ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                go(step.route);
              }}
              style={{ color: 'var(--fg-2)' }}
            >
              {step.label}
            </a>
          ) : (
            <span style={{ color: 'var(--fg)' }}>{step.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ── Starred Articles Persistence ───────────────────────────────────────────
const STARRED_STORAGE_KEY = 'core_harness_wiki_starred';

function getStarredSlugs() {
  try {
    return JSON.parse(localStorage.getItem(STARRED_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function isArticleStarred(slug) {
  return getStarredSlugs().includes(slug);
}

function toggleArticleStarred(slug) {
  const list = getStarredSlugs();
  const idx = list.indexOf(slug);
  if (idx === -1) list.push(slug);
  else list.splice(idx, 1);
  try {
    localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
  return idx === -1;
}

// ── Topbar Component ────────────────────────────────────────────────────────

function Topbar({ onOpenSearch, onToggleNav, route, go }) {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const meta = window.WIKI_DATA?.meta || {};
  const repoSlug = meta.repo || '';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={onToggleNav} aria-label="Toggle navigation">
          ☰
        </button>
        <button type="button" className="brand-badge" onClick={() => go({ name: 'home' })}>
          <span className="logo-dot"></span>
          <span>{meta.name || 'Core Harness Wiki'}</span>
        </button>
      </div>

      <button type="button" className="topbar-search" onClick={onOpenSearch} aria-label="Search wiki documentation">
        <span>Search wiki documentation…</span>
        <kbd>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </button>

      <div className="topbar-right">
        {repoSlug && (
          <a
            href={`https://github.com/${repoSlug}`}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ padding: '4px 10px', fontSize: 12 }}
          >
            GitHub ↗
          </a>
        )}
      </div>
    </header>
  );
}

// ── Sidebar Component ───────────────────────────────────────────────────────

function buildSidebarTree(articles) {
  const roots = [];
  const rootArticles = [];
  const nodes = new Map();

  for (const article of articles) {
    const path = String(article.subsection || '').split('/').map(s => s.trim()).filter(Boolean);
    if (path.length === 0) {
      rootArticles.push(article);
      continue;
    }

    let parent = null;
    let key = '';
    for (const label of path) {
      key = key ? `${key}/${label}` : label;
      let node = nodes.get(key);
      if (!node) {
        node = { id: key, label, children: [], articles: [] };
        nodes.set(key, node);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
      parent = node;
    }
    parent.articles.push(article);
  }

  return { roots, rootArticles };
}

function countSidebarNode(node) {
  return node.articles.length + node.children.reduce((sum, child) => sum + countSidebarNode(child), 0);
}

function SidebarArticle({ article, route, go }) {
  const active = route.name === 'article' && route.slug === article.slug;
  return (
    <li>
      <button
        type="button"
        className={`sidebar-link sidebar-article ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => go({ name: 'article', slug: article.slug })}
        title={article.title}
      >
        <span className="sidebar-bullet" aria-hidden="true">•</span>
        <span className="sidebar-label">{article.title}</span>
      </button>
    </li>
  );
}

function SidebarNode({ sectionId, node, route, go }) {
  const active = route.name === 'subsection' && route.section === sectionId && route.subsection === node.id;
  return (
    <li className="sidebar-node">
      <button
        type="button"
        className={`sidebar-link sidebar-subsection ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => go({ name: 'subsection', section: sectionId, subsection: node.id })}
      >
        <span className="sidebar-bullet" aria-hidden="true">▪</span>
        <span className="sidebar-label">{node.label}</span>
        <span className="count">{countSidebarNode(node)}</span>
      </button>
      {(node.articles.length > 0 || node.children.length > 0) && (
        <ul className="sidebar-tree sidebar-tree-nested">
          {node.children.map(child => (
            <SidebarNode key={child.id} sectionId={sectionId} node={child} route={route} go={go} />
          ))}
          {node.articles.map(article => (
            <SidebarArticle key={article.slug} article={article} route={route} go={go} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Sidebar({ route, go }) {
  const D = window.WIKI_DATA || { sections: [], articles: [] };
  const sections = D.sections || [];
  const articles = D.articles || [];
  const totalArticles = articles.length;
  const activeArticle = route.name === 'article' ? articles.find(article => article.slug === route.slug) : null;
  const activeSectionId = route.section || activeArticle?.section;
  const [expanded, setExpanded] = React.useState(() => new Set(sections.map(sec => sec.id)));

  const toggleSection = (id) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const navButton = (key, label, target, active, extra = null) => (
    <li key={key}>
      <button
        type="button"
        className={`sidebar-link ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => go(target)}
      >
        <span className="sidebar-label">{label}</span>
        {extra}
      </button>
    </li>
  );

  return (
    <aside className="sidebar">
      <nav aria-label="Wiki navigation" className="sidebar-nav">
        <div className="sidebar-group-title">Overview</div>
        <ul className="sidebar-list">
          {navButton('home', 'Home', { name: 'home' }, route.name === 'home', <span className="count">{totalArticles}</span>)}
          {navButton('recent', 'Recent updates', { name: 'recent' }, route.name === 'recent')}
          {navButton('starred', 'Starred articles', { name: 'starred' }, route.name === 'starred')}
        </ul>

        <div className="sidebar-group-title sidebar-group-title-sections">Documentation</div>
        <ul className="sidebar-list sidebar-sections" aria-label="Documentation sections">
          {sections.map((sec) => {
            const isExpanded = expanded.has(sec.id);
            const isActive = activeSectionId === sec.id;
            const sectionArticles = articles.filter(article => article.section === sec.id);
            const tree = buildSidebarTree(sectionArticles);
            const treeId = `sidebar-tree-${sec.id}`;
            return (
              <li key={sec.id} className="sidebar-section">
                <div className="sidebar-section-heading">
                  <button
                    type="button"
                    className="sidebar-disclosure"
                    aria-expanded={isExpanded}
                    aria-controls={treeId}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sec.name || sec.id}`}
                    onClick={() => toggleSection(sec.id)}
                  >
                    <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
                  </button>
                  <button
                    type="button"
                    className={`sidebar-link sidebar-section-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => go({ name: 'section', section: sec.id })}
                  >
                    <span className="sidebar-label">{sec.name || sec.id}</span>
                    <span className="count">{sec.count}</span>
                  </button>
                </div>
                {isExpanded && (
                  <ul id={treeId} className="sidebar-tree" aria-label={`${sec.name || sec.id} documents`}>
                    {tree.roots.map(node => (
                      <SidebarNode key={node.id} sectionId={sec.id} node={node} route={route} go={go} />
                    ))}
                    {tree.rootArticles.map(article => (
                      <SidebarArticle key={article.slug} article={article} route={route} go={go} />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="sidebar-list">
          {navButton('settings', 'Settings', { name: 'settings' }, route.name === 'settings')}
        </ul>
      </div>
    </aside>
  );
}
