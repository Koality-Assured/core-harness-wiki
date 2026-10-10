---
title: QMD Markdown Discovery Pattern
slug: supporting/qmd-markdown-discovery-pattern
section: supporting
subsection: Tools
severity: info
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Operational pattern for searching, discovering, and retrieving markdown knowledge chunks via QMD without context bloating.
tags:
  - supporting
  - qmd
  - search
  - retrieval
related:
  - supporting/ast-grep-symbol-exploration-pattern
  - standards/context-management-standard
---

# QMD Markdown Discovery Pattern

`qmd` is a local markdown indexer and retrieval utility that provides fast vector and keyword search across repository documentation corpus.

> [!NOTE]
> QMD operations run against a dedicated index directory (`scratch/qmd-main`), keeping search indexes detached from active task worktrees.

## Standard Query Pattern

### 1. Keyword & Semantic Search
Search for relevant documentation topics:
```bash
qmd search "context firebreaks"
```

### 2. Targeted Chunk Retrieval
Retrieve only the relevant chunk or section without reading the full file:
```bash
qmd get "architecture/context-firebreaks-and-prompt-caching.md" --section "Context Firebreaks"
```

### 3. Updating Indexes
After pushing changes to main, update the QMD index:
```bash
python scripts/qmd/refresh_qmd_index.py
```
