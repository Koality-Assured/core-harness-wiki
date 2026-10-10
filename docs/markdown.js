// docs/markdown.js — zero-dependency Markdown & YAML frontmatter parser.
// Supports headings (h1-h4), bold, italic, code spans, strikethrough, links, images,
// task lists, GitHub alerts (> [!NOTE]), callouts (::: tone), tables, and fenced code blocks.

(function () {
  function parseYamlLite(src) {
    const out = {};
    const lines = src.split('\n');
    let currentKey = null;
    let multiline = false;
    let multilineBuf = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      if (multiline) {
        if (line.startsWith('  ') || line.startsWith('\t')) {
          multilineBuf.push(line.trim());
          continue;
        } else {
          out[currentKey] = multilineBuf.join(' ').trim();
          multiline = false;
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
        multiline = true;
        multilineBuf = [];
        continue;
      }

      let val;
      if (raw.startsWith('[') && raw.endsWith(']')) {
        const inner = raw.slice(1, -1).trim();
        val = inner
          ? inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s => {
            const t = s.trim();
            return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))
              ? t.slice(1, -1) : t;
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

    if (multiline && currentKey) {
      out[currentKey] = multilineBuf.join(' ').trim();
    }

    return out;
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Tokenize inline markdown: links, images, bold, italic, code, strikethrough
  function parseInlineTokens(text) {
    const src = String(text || '');
    const tokens = [];

    // Comprehensive inline regex matching:
    // 1: Image: !\[(.*?)\]\((.*?)\)
    // 2: Link: \[(.*?)\]\((.*?)\)
    // 3: Code span: `([^`]+)`
    // 4: Bold: \*\*([^*]+)\*\* or __([^_]+)__
    // 5: Italic: \*([^*]+)\* or _([^_]+)_
    // 6: Strikethrough: ~~([^~]+)~~
    const inlineRegex = /(!?\[([^\]]*)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)|(~~([^~]+)~~)/g;

    let lastIdx = 0;
    let match;

    while ((match = inlineRegex.exec(src)) !== null) {
      if (match.index > lastIdx) {
        tokens.push({ type: 'text', text: src.slice(lastIdx, match.index) });
      }

      if (match[1]) {
        // Link or Image
        const isImage = match[1].startsWith('!');
        const altOrText = match[2];
        const href = match[3].trim();
        if (isImage) {
          tokens.push({ type: 'image', alt: altOrText, src: href });
        } else {
          tokens.push({ type: 'link', text: altOrText, href });
        }
      } else if (match[4]) {
        // Code span
        tokens.push({ type: 'code', text: match[5] });
      } else if (match[6]) {
        // Bold
        tokens.push({ type: 'bold', text: match[7] || match[8] });
      } else if (match[9]) {
        // Italic
        tokens.push({ type: 'italic', text: match[10] || match[11] });
      } else if (match[12]) {
        // Strikethrough
        tokens.push({ type: 'strike', text: match[13] });
      }

      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < src.length) {
      tokens.push({ type: 'text', text: src.slice(lastIdx) });
    }

    return tokens.length ? tokens : [{ type: 'text', text: src }];
  }

  function parseMarkdown(src) {
    let fm = {};
    let body = src;
    const fmMatch = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (fmMatch) {
      fm = parseYamlLite(fmMatch[1]);
      body = src.slice(fmMatch[0].length);
    }

    const lines = body.split(/\r?\n/);
    const blocks = [];
    let i = 0;
    let sawFirstQuote = false;

    while (i < lines.length) {
      const startI = i;
      const line = lines[i];
      const trimmed = line.trim();

      // Blank line
      if (!trimmed) {
        i++;
        continue;
      }

      // Horizontal Rule: ---, ***, ___
      if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
        blocks.push({ type: 'hr' });
        i++;
        continue;
      }

      // Headings: #, ##, ###, #### with optional {#custom-id}
      const hMatch = trimmed.match(/^(#{1,4})\s+(.+?)(\s*\{#([a-z0-9\-]+)\})?\s*$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = hMatch[2].trim();
        const id = hMatch[4] || slugify(text);
        blocks.push({ type: 'h', level, id, text });
        i++;
        continue;
      }

      // GitHub Alert: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
      const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
      if (alertMatch) {
        const toneMap = {
          note: 'info',
          tip: 'low',
          important: 'med',
          warning: 'warn',
          caution: 'crit',
        };
        const alertType = alertMatch[1].toLowerCase();
        const tone = toneMap[alertType] || 'info';
        const title = alertMatch[1].toUpperCase();
        i++;
        const buf = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({ type: 'callout', tone, title, text: buf.join(' ').trim() });
        continue;
      }

      // Standard Blockquote -> lead (first one) or info callout
      if (line.startsWith('>')) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        const text = buf.join(' ').trim();
        if (!sawFirstQuote) {
          blocks.push({ type: 'lead', text });
          sawFirstQuote = true;
        } else {
          blocks.push({ type: 'callout', tone: 'info', title: null, text });
        }
        continue;
      }

      // Custom Callout ::: tone Title
      const cMatch = trimmed.match(/^:::\s*([a-z]+)?\s*(.*)$/);
      if (cMatch && cMatch[1]) {
        const tone = cMatch[1];
        const title = cMatch[2].trim() || null;
        i++;
        const buf = [];
        while (i < lines.length && lines[i].trim() !== ':::') {
          buf.push(lines[i]);
          i++;
        }
        i++; // consume closing :::
        blocks.push({ type: 'callout', tone, title, text: buf.join(' ').trim() });
        continue;
      }

      // Fenced code block ```lang
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        i++;
        const buf = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          buf.push(lines[i]);
          i++;
        }
        i++; // consume closing ```
        blocks.push({ type: 'code', lang: lang || 'text', text: buf.join('\n') });
        continue;
      }

      // Task list or standard list
      if (/^\s*[-*]\s+\[([ xX])\]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+\[([ xX])\]\s+/.test(lines[i])) {
          const m = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
          items.push({ checked: m[1].toLowerCase() === 'x', text: m[2].trim() });
          i++;
        }
        blocks.push({ type: 'tasklist', items });
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
          i++;
        }
        blocks.push({ type: 'ol', items });
        continue;
      }

      // Unordered list
      if (/^\s*[-*]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && !/^\s*[-*]\s+\[([ xX])\]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
          i++;
        }
        blocks.push({ type: 'ul', items });
        continue;
      }

      // Tables (header row + separator row)
      if (trimmed.startsWith('|') && lines[i + 1] && /^\|[\s\-:|]+\|\s*$/.test(lines[i + 1].trim())) {
        const splitRow = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
        const headers = splitRow(lines[i]);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      }

      // Paragraph
      const buf = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().match(/^#{1,4}\s/) &&
        !lines[i].startsWith('>') &&
        !lines[i].trim().startsWith(':::') &&
        !lines[i].trim().startsWith('```') &&
        !/^\s*\d+\.\s+/.test(lines[i].trim()) &&
        !/^\s*[-*]\s+/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith('|') &&
        !/^(?:---|\*\*\*|___)\s*$/.test(lines[i].trim())
      ) {
        buf.push(lines[i]);
        i++;
      }
      const text = buf.join(' ').trim();
      if (text) blocks.push({ type: 'p', text });

      if (i === startI) i++; // safety advance
    }

    // Derive TOC sections (h2 and h3)
    const sections = blocks
      .filter(b => b.type === 'h' && (b.level === 2 || b.level === 3))
      .map(b => ({ id: b.id, h: b.text, level: b.level }));

    return { frontmatter: fm, blocks, sections };
  }

  window.MD = {
    parseMarkdown,
    parseYamlLite,
    parseInlineTokens,
    slugify,
  };
})();
