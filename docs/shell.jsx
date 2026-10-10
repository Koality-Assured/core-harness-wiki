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
        <div className="brand-badge" onClick={() => go({ name: 'home' })}>
          <span className="logo-dot"></span>
          <span>{meta.name || 'Core Harness Wiki'}</span>
        </div>
      </div>

      <div className="topbar-search" onClick={onOpenSearch}>
        <span>Search wiki documentation…</span>
        <kbd>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </div>

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

function Sidebar({ route, go }) {
  const D = window.WIKI_DATA || { sections: [], articles: [] };
  const sections = D.sections || [];
  const totalArticles = (D.articles || []).length;

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-group-title">Overview</div>
        <div
          className={`sidebar-item ${route.name === 'home' ? 'active' : ''}`}
          onClick={() => go({ name: 'home' })}
        >
          <span>🏠 Home</span>
          <span className="count">{totalArticles}</span>
        </div>
        <div
          className={`sidebar-item ${route.name === 'recent' ? 'active' : ''}`}
          onClick={() => go({ name: 'recent' })}
        >
          <span>🕒 Recent Updates</span>
        </div>
        <div
          className={`sidebar-item ${route.name === 'starred' ? 'active' : ''}`}
          onClick={() => go({ name: 'starred' })}
        >
          <span>★ Starred Articles</span>
        </div>
      </div>

      <div>
        <div className="sidebar-group-title">Knowledge Sections</div>
        {sections.map((sec) => {
          const isActive = route.name === 'section' && route.section === sec.id;
          return (
            <div
              key={sec.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => go({ name: 'section', section: sec.id })}
            >
              <span>{sec.name || sec.id}</span>
              <span className="count">{sec.count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div
          className={`sidebar-item ${route.name === 'settings' ? 'active' : ''}`}
          onClick={() => go({ name: 'settings' })}
        >
          <span>⚙ Settings</span>
        </div>
      </div>
    </aside>
  );
}
