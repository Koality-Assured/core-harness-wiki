---
title: Context Firebreaks & Prompt Caching
slug: architecture/context-firebreaks-and-prompt-caching
section: architecture
subsection: Optimization
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Technical breakdown of context firebreak boundaries, clean-slate subagent isolation, KV-cache prefix stability, and cost reduction strategies.
tags:
  - architecture
  - context-firebreaks
  - prompt-caching
  - token-budget
related:
  - architecture/harness-engine-overview
  - standards/context-management-standard
---

# Context Firebreaks & Prompt Caching

Context degradation and token explosion represent the two largest operational risks in autonomous coding assistant workflows. The Core Harness implements two complementary defenses: **Context Firebreaks** and **Deterministic Prompt Caching**.

> [!IMPORTANT]
> Uncontrolled conversation growth degrades reasoning performance. As context grows beyond 50k tokens, attention dilution causes models to overlook critical constraints.

## Context Firebreaks

A **Context Firebreak** is a hard boundary across which execution state is intentionally severed:

1. **Clean-Slate Subagent Spawning**:
   - Subagents invoked via `invoke_subagent` must execute with clean context.
   - Parent conversation turns, prior tool outputs, and historical trial-and-error are **never** inherited by child agents.
   - The spawn payload contains only:
     - Exact role and bounded prompt.
     - Target workspace path (isolated worktree).
     - Required facts, file pointers, and explicit approval.

2. **Parent as Coordinator / Validator**:
   - The parent agent coordinates high-level goals and validates subagent deliverables against acceptance criteria.
   - Mutating work occurs strictly within child agents operating in isolated worktrees (`scratch/worktrees/<slug>`).

```
Parent Context (Clean Coordinator)
  │
  ├─► [Spawn Firebreak] ──► Subagent 1 (ast-grep scan, exits)
  │                              └── Returns 3-line structured summary
  │
  ├─► [Spawn Firebreak] ──► Subagent 2 (mutates code in worktree)
  │                              └── Returns git diff + test results
  │
  └─► Parent validates diff, executes merge, and records checkpoint
```

## Deterministic Prompt Caching

Modern foundation models (such as Claude 3.5 Sonnet, Gemini 1.5/2.0 Pro) offer KV-cache discounts of 50% to 90% when consecutive prompt tokens match previously cached prefixes.

### Cache Prefix Stability Rules

To preserve prompt caching across turns:

- **Static Instructions First**: Universally binding instructions (`AGENTS.md`) sit at the very beginning of the system prompt.
- **Append-Only Dynamic State**: Session-specific context (such as active directory, timestamps, or tool definitions) must be placed after static anchors.
- **Sectional Subtree Reads**: When loading documentation, agents must extract only the relevant heading subtree rather than re-reading the entire file.

## Expected Cost & Latency Gains

| Metric | Without Firebreaks | With Harness Firebreaks |
| :--- | :--- | :--- |
| Average Turn Tokens | 45,000 - 120,000 | 4,000 - 12,000 |
| Cache Hit Ratio | < 25% | > 85% |
| Turn Latency | 18 - 45 seconds | 3 - 8 seconds |
| Hallucination Frequency | Moderate to High | Negligible |
