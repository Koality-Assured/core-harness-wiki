---
title: Context Management & Token Efficiency Standard
slug: standards/context-management-standard
section: standards
subsection: Core
severity: critical
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Normative standard for token budget enforcement, sectional subtree extraction, line-bounded reads, ast-grep outline inspection, and headroom compression.
tags:
  - standards
  - context-management
  - token-budget
  - ast-grep
  - qmd
related:
  - architecture/context-firebreaks-and-prompt-caching
  - supporting/ast-grep-symbol-exploration-pattern
---

# Context Management & Token Efficiency Standard

Autonomous coding agents must treat context window capacity as a strictly rationed, expensive computational asset. This standard defines non-negotiable operational requirements for managing tokens and exploring codebases.

> [!CAUTION]
> Agents must NEVER dump full file contents into conversation context when outline inspection, grep search, or line-bounded reads can extract the required information.

## Non-Negotiable Rules

1. **Outline-First Code Exploration**:
   - Before editing or reading an unknown code file, agents **must** inspect its structural shape using AST outline tools:
     ```bash
     ast-grep outline path/to/file.py
     ```
   - Only retrieve exact line ranges using bounded parameters (`StartLine` / `EndLine`).

2. **Sectional Subtree Extraction for Markdown**:
   - Never load large markdown corpus files or standards documents in full.
   - Use `qmd` or line-bounded readers to extract only the target heading and its immediate child section.

3. **Bulky Output Compression**:
   - Outputs exceeding 100 lines (e.g. test runs, linter dumps, build traces) must be piped through `Headroom` or summarized via `scripts/_lib/tool_output.py` before presenting to parent context.

4. **Task Worktree Isolation**:
   - All mutating work (code refactoring, file deletion, feature implementation) must occur in an isolated task worktree:
     ```bash
     python scripts/routing/spawn_worktree.py create --slug <feature-name>
     ```
   - Never mutate the primary branch working tree directly.

## Token Consumption Tiers

| Operation | Maximum Target Tokens | Allowed Tools |
| :--- | :--- | :--- |
| File Shape Discovery | < 300 tokens | `ast-grep outline` |
| Corpus / Doc Discovery | < 500 tokens | `qmd search`, `qmd get` |
| Code Modification Chunk | < 1,500 tokens | `replace_file_content` |
| Subagent Spawn Prompt | < 800 tokens | `invoke_subagent` |
| Test Failure Summary | < 600 tokens | Headroom / Truncator |
