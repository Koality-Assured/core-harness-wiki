---
title: ast-grep Symbol Exploration Pattern
slug: supporting/ast-grep-symbol-exploration-pattern
section: supporting
subsection: Tools
severity: info
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Operational guide for using ast-grep outline and structural pattern matching to inspect code symbols without reading entire files into context.
tags:
  - supporting
  - ast-grep
  - code-exploration
  - token-efficiency
related:
  - standards/context-management-standard
  - supporting/qmd-markdown-discovery-pattern
---

# ast-grep Symbol Exploration Pattern

`ast-grep` is an AST-based code search and linting tool that allows AI agents to explore structural syntax trees without loading thousands of lines of source code into active context.

> [!TIP]
> Always run `ast-grep outline` first to map function and class signatures before reading or modifying code.

## Key CLI Commands

### 1. File Outline Inspection
Inspect the top-level symbols (functions, classes, methods) in a file:
```bash
ast-grep outline path/to/file.py
```

### 2. Structural Pattern Search
Find specific method patterns across a codebase:
```bash
ast-grep -p 'def $METHOD($$$ARGS): $$$BODY' path/to/code/
```

### 3. Language-Specific Filtering
Target specific file extensions or AST nodes:
```bash
ast-grep -l python -p 'class $CLASS: $$$BODY'
```

## Workflow Integration

1. **Step 1**: Use `ast-grep outline` to find line numbers of the symbol to edit.
2. **Step 2**: Use line-bounded tools (`view_file` with `StartLine`/`EndLine` or `replace_file_content`) on only that range.
3. **Step 3**: Verify syntax after edits with `ast-grep scan`.
