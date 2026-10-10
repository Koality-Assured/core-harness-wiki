// docs/app.jsx — Root Application, Hash Router, and Theme Controller.

const TWEAK_DEFAULTS = {
  direction: 'operative',
  dark: true,
  density: 'regular',
  articleLayout: 'sidebar',
  homeStyle: 'dashboard',
};

function routeToHash(route) {
  const enc = (p) => String(p).split('/').map(encodeURIComponent).join('/');
  switch (route.name) {
    case 'recent':
    case 'starred':
    case 'settings':
      return `#/${route.name}`;
    case 'section':
      return `#/${enc(route.section)}`;
    case 'subsection':
      return `#/${enc(route.section)}/${enc(route.subsection)}`;
    case 'article':
      return `#/${enc(route.slug)}`;
    default:
      return '#/';
  }
}

function hashToRoute(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!raw) return { name: 'home' };
  const path = raw.split('/').map(s => {
    try { return decodeURIComponent(s); } catch { return s; }
  }).join('/');

  if (path === 'recent' || path === 'starred' || path === 'settings') {
    return { name: path };
  }

  const D = window.WIKI_DATA || { sections: [], articles: [] };
  if ((D.articles || []).some(a => a.slug === path)) {
    return { name: 'article', slug: path };
  }

  const segs = path.split('/');
  if ((D.sections || []).some(s => s.id === segs[0])) {
    return segs.length === 1
      ? { name: 'section', section: segs[0] }
      : { name: 'subsection', section: segs[0], subsection: segs.slice(1).join('/') };
  }

  return { name: 'home' };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState({ name: 'home' });
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (window.WIKI_READY || Promise.resolve()).then(() => {
      if (cancelled) return;
      setLoaded(true);
      if (window.location.hash && window.location.hash !== '#/') {
        setRoute(hashToRoute(window.location.hash));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const applyRoute = (r) => {
    setRoute(r);
    setNavOpen(false);
    requestAnimationFrame(() => {
      const m = document.querySelector('.main');
      if (m) m.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const go = (r) => {
    if (r.name === 'search') {
      setSearchOpen(true);
      return;
    }
    const h = routeToHash(r);
    const before = window.location.href;
    window.location.hash = h;
    if (window.location.href === before) {
      applyRoute(r);
    }
  };

  React.useEffect(() => {
    if (!loaded) return;
    const onHash = () => applyRoute(hashToRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [loaded]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  // Apply theme classes to body
  React.useEffect(() => {
    const bodyClass = `dir-${t.direction} theme-${t.dark ? 'dark' : 'light'} density-${t.density}`;
    document.body.className = bodyClass;
    return () => { document.body.className = ''; };
  }, [t.direction, t.dark, t.density]);

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <Topbar
        onOpenSearch={() => setSearchOpen(true)}
        onToggleNav={() => setNavOpen(o => !o)}
        route={route}
        go={go}
      />
      <Sidebar route={route} go={go} />
      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}

      <main className="main">
        {!loaded && <LoadingState />}
        {loaded && route.name === 'home' && <HomeScreen go={go} style={t.homeStyle} />}
        {loaded && route.name === 'section' && <SectionScreen section={route.section} go={go} />}
        {loaded && route.name === 'subsection' && <SubsectionScreen section={route.section} subsection={route.subsection} go={go} />}
        {loaded && route.name === 'article' && <ArticleScreen slug={route.slug} go={go} layout={t.articleLayout} />}
        {loaded && route.name === 'recent' && <RecentScreen go={go} />}
        {loaded && route.name === 'starred' && <StarredScreen go={go} />}
        {loaded && route.name === 'settings' && <SettingsScreen go={go} t={t} setTweak={setTweak} />}
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} go={go} />

      <TweaksPanel>
        <TweakSection label="Aesthetic Theme" />
        <TweakRadio
          label="Direction"
          value={t.direction}
          options={['operative', 'nexus', 'redteam', 'minimal']}
          onChange={v => setTweak('direction', v)}
        />
        <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />

        <TweakSection label="Layout & Density" />
        <TweakRadio
          label="Homepage style"
          value={t.homeStyle}
          options={['dashboard', 'editorial', 'index']}
          onChange={v => setTweak('homeStyle', v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={v => setTweak('density', v)}
        />
        <TweakRadio
          label="Article layout"
          value={t.articleLayout}
          options={['sidebar', 'centered']}
          onChange={v => setTweak('articleLayout', v)}
        />

        <TweakSection label="Quick Jump" />
        <button className="btn" style={{ width: '100%', fontSize: 11 }} onClick={() => go({ name: 'home' })}>
          🏠 Home
        </button>
        <button className="btn" style={{ width: '100%', fontSize: 11 }} onClick={() => setSearchOpen(true)}>
          🔍 Search (⌘K)
        </button>
        <button className="btn" style={{ width: '100%', fontSize: 11 }} onClick={() => go({ name: 'settings' })}>
          ⚙ Settings
        </button>
      </TweaksPanel>
    </div>
  );
}

// Mount application
(function mount() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
    return;
  }
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(<App />);
  }
})();
