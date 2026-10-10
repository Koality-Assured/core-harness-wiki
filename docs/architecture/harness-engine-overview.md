---
title: Harness Engine Architecture Overview
slug: architecture/harness-engine-overview
section: architecture
subsection: Engine
severity: info
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Architectural overview of the decoupled, bare-metal AI agent harness engine, covering layered AGENTS.md, context firebreaks, prompt caching boundaries, and sandboxed A2A execution.
tags:
  - architecture
  - harness-core
  - prompt-caching
  - context-firebreaks
related:
  - architecture/context-firebreaks-and-prompt-caching
  - architecture/layered-agents-and-directive-hierarchy
---

# Harness Engine Architecture Overview

The **Core Harness Engine** provides a decoupled, bare-metal architecture designed for multi-agent autonomous engineering. It eliminates the fragility of unconstrained LLM loops by enforcing strict context firebreaks, deterministic prompt caching layers, and a normative rule hierarchy.

> [!NOTE]
> The harness engine acts as an operating system kernel for AI coding assistants. It abstracts provider quirks, isolates mutating operations into disposable worktrees, and guarantees auditable changes.

## Core Design Principles

1. **Context Firebreaks**: Prevent context bloat by spawning subagents into clean-slate environments with bounded token budgets. Parent agents coordinate and validate; specialist subagents execute.
2. **Deterministic Prompt Caching**: Anchor system instructions and immutable rules into static prompt prefixes to maximize KV-cache reuse and reduce API latency by up to 80%.
3. **Layered AGENTS.md Hierarchy**: Scope directives from universal critical constraints (`AGENTS.md`) down to folder-level deltas (`routing/AGENTS.md`, area-specific `AGENTS.md`).
4. **Tool-Assisted Cost Layers**: Route file exploration through AST indexers (`ast-grep`), Markdown semantic search (`qmd`), and token compression (`Headroom`) before dumping raw files.

## Subsystem Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Human Operator                       │
└───────────────────────────┬────────────────────────────┘
                            │ Task Prompts / Approvals
┌───────────────────────────▼────────────────────────────┐
│              Parent Coordinator Agent                  │
│       (Layered AGENTS.md • Dispatch Matrix • Gate)      │
└─────────────┬───────────────────────────┬──────────────┘
              │ Spawn (clean slate)       │ Direct Read
┌─────────────▼──────────────┐ ┌──────────▼──────────────┐
│  Specialist Subagents       │ │   Cost & Retrieval     │
│  (Isolated Worktrees)      │ │   Layers (ast-grep,    │
│  - harness-operator        │ │    qmd, Headroom)      │
│  - research-operator       │ └─────────────────────────┘
│  - document-operator       │
└────────────────────────────┘
```

## The 12 Canonical Top-Level Areas

Every repository managed by the harness engine conforms to a strict 12-area directory taxonomy:

| Area | Purpose & Lifecycle | Permitted Contents |
| :--- | :--- | :--- |
| `projects/` | Initiative specifications and planning roadmaps | Slug folders with standard 10-section READMEs |
| `ai-tooling/` | Skills, specialist agents, A2A protocol, and memory scaffolds | Packaged skills and agent profiles |
| `docs/` | Protected normative corpus of record, security MUST, and playbooks | Standards and architectural guidance |
| `references/` | External framework captures and machine-readable catalogs | Advisory third-party specifications |
| `supporting/` | Workstation onboarding, tool patterns, CLI guides | Tool operational runbooks |
| `scripts/` | Tagged Python automation and validation utilities | Purpose-grouped executable scripts |
| `results/` | Immutable deliverables, audit reports, benchmarks | Non-ephemeral deliverables |
| `research/` | Topic deep-dives and technology spikes | Topic folders with primary-source citations |
| `scratch/` | Ephemeral scratchpad and isolated git worktrees | Disposable worktree directories |
| `change-history/` | Structured provenance log across quarters | Immutable quarterly history records |
| `actionable/` | Temporary intake drop zone for human requests | Ephemeral intake items |
| `routing/` | Generated next-step indexes and dispatch maps | Dispatch YAML and routing indexes |

## Related Documentation

- [Context Firebreaks and Prompt Caching](architecture/context-firebreaks-and-prompt-caching)
- [Layered AGENTS.md and Directive Hierarchy](architecture/layered-agents-and-directive-hierarchy)
- [Context Management Standard](standards/context-management-standard)
