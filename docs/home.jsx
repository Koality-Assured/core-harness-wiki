// docs/home.jsx — Homepage rendered in three styles: dashboard (default), editorial, index.

function HomeScreen({ go, style }) {
  const D = window.WIKI_DATA || { sections: [], articles: [], stats: {} };
  const meta = D.meta || {};
  const stats = D.stats || {};
  const sections = D.sections || [];
  const articles = D.articles || [];

  const recent = [...articles]
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    .slice(0, 6);

  const featured = articles.find(a => a.severity === 'critical') || articles[0];
  const totalArticles = articles.length;
  const coverage = stats.coverage ?? 0;
  const contributors = stats.contributors ?? 1;

  if (style === 'index') {
    return (
      <div className="home-index">
        <div className="hero-main" style={{ marginBottom: 32 }}>
          <h1>{meta.name || 'Core Harness Wiki'}</h1>
          <p>{meta.description}</p>
        </div>

        {sections.map((sec) => {
          const secArticles = articles.filter(a => a.section === sec.id);
          return (
            <div key={sec.id} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 16 }}>
                <h2>{sec.name || sec.id}</h2>
                <span className="mono muted" style={{ fontSize: 12 }}>({secArticles.length})</span>
                <span style={{ marginLeft: 'auto', fontSize: 12 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); go({ name: 'section', section: sec.id }); }}>View section →</a>
                </span>
              </div>
              <p style={{ color: 'var(--fg-2)', fontSize: 13, marginBottom: 16 }}>{sec.desc}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {secArticles.map((a) => (
                  <div
                    key={a.slug}
                    onClick={() => go({ name: 'article', slug: a.slug })}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 12, borderRadius: 'var(--radius)', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{a.updated} · {a.owner}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (style === 'editorial') {
    return (
      <div className="home-editorial">
        <div className="hero-main" style={{ marginBottom: 40 }}>
          <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 8 }}>
            ▸ THE CORE HARNESS ECOSYSTEM
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.2 }}>The Knowledge Base & Operating System for AI Agent Harnesses.</h1>
          <p style={{ fontSize: 16, marginTop: 16, maxWidth: 640 }}>
            {meta.description || 'Architectural standards, context firebreaks, prompt caching patterns, and multi-agent protocols.'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn primary" onClick={() => go({ name: 'search' })}>Search Documentation (⌘K)</button>
            {sections[0] && (
              <button className="btn" onClick={() => go({ name: 'section', section: sections[0].id })}>
                Explore {sections[0].name || sections[0].id} →
              </button>
            )}
          </div>
        </div>

        {featured && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 28, borderRadius: 'var(--radius)', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="sev high">FEATURED</span>
              <SectionBadge section={featured.section} />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 24, cursor: 'pointer' }} onClick={() => go({ name: 'article', slug: featured.slug })}>
              {featured.title}
            </h2>
            <p style={{ color: 'var(--fg-2)', marginBottom: 16 }}>{featured.summary}</p>
            <button className="btn primary" onClick={() => go({ name: 'article', slug: featured.slug })}>Read Article →</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {sections.map((sec) => (
            <div
              key={sec.id}
              onClick={() => go({ name: 'section', section: sec.id })}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 20, borderRadius: 'var(--radius)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3>{sec.name || sec.id}</h3>
                <span className="mono muted" style={{ fontSize: 12 }}>{sec.count} docs</span>
              </div>
              <p style={{ color: 'var(--fg-2)', fontSize: 13 }}>{sec.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Dashboard style
  return (
    <div className="home-dashboard">
      <div className="hero">
        <div className="hero-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span>
            <span>READ-ONLY MIRROR · {totalArticles} DOCUMENTS</span>
            {recent[0]?.updated && (
              <span style={{ marginLeft: 'auto' }}>LAST COMMITTED: {recent[0].updated}</span>
            )}
          </div>
          <h1>{meta.name || 'Core Harness Wiki'}</h1>
          <p>{meta.description || 'Architectural standards, context firebreaks, prompt caching patterns, and multi-agent protocols.'}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {featured && (
              <button className="btn primary" onClick={() => go({ name: 'article', slug: featured.slug })}>
                Open Featured: {featured.title}
              </button>
            )}
            <button className="btn" onClick={() => go({ name: 'search' })}>Search (⌘K)</button>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-cell">
            <div className="k">Total Articles</div>
            <div className="v">{totalArticles}</div>
            <div className="delta">live from git tree</div>
          </div>
          <div className="stat-cell">
            <div className="k">Reviewed Coverage</div>
            <div className="v">{coverage}%</div>
            <div className="delta">{stats.reviewedArticles || 0} / {totalArticles} reviewed</div>
          </div>
          <div className="stat-cell">
            <div className="k">Contributors</div>
            <div className="v">{contributors}</div>
            <div className="delta">{stats.contributorsSource || 'git authors'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
        {sections.map((sec) => (
          <div
            key={sec.id}
            onClick={() => go({ name: 'section', section: sec.id })}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              padding: 20,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <SectionBadge section={sec.id} />
              <span className="mono muted" style={{ fontSize: 11 }}>{sec.count} articles</span>
            </div>
            <h3 style={{ margin: '8px 0', fontSize: 16 }}>{sec.name || sec.id}</h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 13, marginBottom: 12 }}>{sec.desc}</p>
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>Browse section →</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
          Recent Activity & Git Commits
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(D.recentEvents || []).slice(0, 8).map((evt, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                padding: '8px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
              }}
            >
              <span className="mono muted" style={{ fontSize: 11, minWidth: 80 }}>{evt.ts}</span>
              <span className="mono" style={{ color: 'var(--accent)', minWidth: 100 }}>{evt.who}</span>
              <span style={{ color: 'var(--fg-2)' }}>{evt.what}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
