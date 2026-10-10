// docs/tweaks-panel.jsx — Floating live design controls for rapid UX customization.

function useTweaks(defaults) {
  const STORAGE_KEY = 'core_harness_wiki_tweaks';
  const [tweaks, setTweaksState] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const setTweak = (key, value) => {
    setTweaksState(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  };

  return [tweaks, setTweak];
}

function TweaksPanel({ children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            color: 'var(--fg)',
            padding: '6px 12px',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🎨</span>
          <span>Customize</span>
        </button>
      ) : (
        <div
          style={{
            width: 280,
            maxHeight: 'calc(100vh - 40px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Wiki Design Controls</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function TweakSection({ label }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginTop: 8 }}>
      {label}
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', padding: 3, borderRadius: 6 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '4px 6px',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              background: value === opt ? 'var(--accent)' : 'transparent',
              color: value === opt ? 'var(--bg)' : 'var(--fg)',
              fontWeight: value === opt ? 600 : 400,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          padding: '4px 10px',
          border: '1px solid var(--line)',
          background: value ? 'var(--accent-soft)' : 'var(--bg-surface)',
          color: value ? 'var(--accent)' : 'var(--muted)',
          borderRadius: 4,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
