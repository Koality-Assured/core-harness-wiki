# Core Harness Wiki

[![Deploy to GitHub Pages](https://github.com/Koality-Assured/core-harness-wiki/actions/workflows/deploy.yml/badge.svg)](https://github.com/Koality-Assured/core-harness-wiki/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Zero Build Dependencies](https://img.shields.io/badge/Dependencies-0%20npm%20packages-00F0FF.svg)](#zero-dependency-architecture)

> **Universal, zero-dependency static documentation wiki and knowledge base engine for AI agent harnesses and multi-repo routers.**

---

## Overview

**Core Harness Wiki** turns any Markdown-based repository into a live, interactive, browsable single-page documentation portal deployed directly on **GitHub Pages** via standard GitHub Actions.

Built on an in-browser React and Babel architecture with zero npm build dependencies, it compiles Markdown frontmatter and git metadata into a fast manifest, providing lightning-fast search, dynamic dark/light theming, sticky table of contents, and clean intra-wiki linking.

```
┌────────────────────────────────────────────────────────────┐
│                    GitHub Pages Portal                     │
│  - Instant Hash Routing (mirroring repository directory)   │
│  - Live Search Palette (⌘K) with keyboard navigation       │
│  - 4 Cyber & Minimal Themes (Operative, Nexus, Red, Clean) │
│  - On-Demand Lazy Article Loading with Memory Caching      │
│  - Full Markdown: H1-H4, Tables, GitHub Alerts, Tasklists  │
│  - Interactive "Copy Code" & "Copy Link" Actions           │
└─────────────────────────────▲──────────────────────────────┘
                              │
               GitHub Actions (Zero Cost / Free Tier)
                 - node docs/scripts/validate-content.mjs
                 - node docs/scripts/build-manifest.mjs
                 - node docs/scripts/sync-site-content.mjs
                 - actions/deploy-pages@v4 (< 25 seconds)
```

---

## Key Improvements Over Legacy Wiki Implementations

This engine generalizes and significantly enhances the static wiki methodology previously utilized in corporate environments:

| Feature | Legacy Implementation | Core Harness Wiki |
| :--- | :--- | :--- |
| **Initial Page Load** | Mass eager fetching (`Promise.all` downloading hundreds of `.md` files at startup) | **On-demand lazy loading** with memory caching. Immediate startup. |
| **Markdown Support** | Only recognized `## Heading`; no inline bold/italic/code in body | **Full Markdown engine**: H1-H4, bold, italic, strikethrough, inline code, tables, images, task lists, dividers. |
| **Callout Syntax** | Proprietary `::: tone` only | Supports **GitHub Alerts** (`> [!NOTE]`, `> [!WARNING]`, etc.) + legacy callouts. |
| **Code Blocks** | Basic preformatted text | Formatted code blocks with language tags and **1-click Copy Code** button. |
| **Configuration** | Rigid hardcoded arrays in scripts | **Central `wiki.config.json`** with automatic section discovery fallback. |
| **Proprietary Bounds** | Contained internal URLs, corporate tags, hardcoded accounts | **100% clean, public-ready, open-source architecture**. |
| **CI / Deployment** | Custom runners or heavy build steps | **Zero-cost GitHub Actions** (< 25s run time on free tier). |

---

## Quickstart & Local Development

No `npm install` or compilation step required! Run locally using any standard static file server:

```bash
# 1. Validate markdown and build the manifest
node docs/scripts/build-manifest.mjs
node docs/scripts/sync-site-content.mjs

# 2. Start a local preview server
npx serve docs
# or
python -m http.server 8000 --directory docs
```

Open `http://localhost:3000` (or `http://localhost:8000`) in your browser.

---

## Configuration (`wiki.config.json`)

Customize the wiki brand, sections, and default theme at the repository root:

```json
{
  "name": "Core Harness Wiki",
  "tagline": "The Knowledge Base & Operating System for AI Agent Harnesses",
  "description": "Interactive documentation, architectural standards, tool patterns, and agent protocols.",
  "org": "Koality-Assured",
  "repo": "Koality-Assured/core-harness-wiki",
  "branch": "main",
  "sections": [
    {
      "id": "architecture",
      "name": "Architecture",
      "code": "ARCH",
      "desc": "Core harness architecture, context firebreaks, and memory subsystems.",
      "priority": "primary",
      "accent": "#00f0ff"
    },
    {
      "id": "standards",
      "name": "Standards",
      "code": "STND",
      "desc": "Normative standards, context management, repository taxonomy, and naming rules.",
      "priority": "primary",
      "accent": "#54d18a"
    }
  ],
  "defaultTheme": "operative"
}
```

---

## Enabling GitHub Pages (Zero Extra Cost)

1. In your GitHub repository, navigate to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` or trigger the **Deploy to GitHub Pages** workflow manually.
4. Your wiki is published at `https://<organization>.github.io/<repository>/` automatically!

---

## Integrating Into Other Repositories

To equip any router, agent harness, or repository with this wiki portal:

1. Copy the `docs/` folder into your repository.
2. Add `.github/workflows/deploy.yml` to your repository.
3. Add `wiki.config.json` defining your repository sections.
4. Run `node docs/scripts/build-manifest.mjs` to generate your first manifest!

---

## License

[MIT License](LICENSE) © 2026 Koality-Assured
