---
title: Repository Taxonomy & Subfolder Archetypes
slug: standards/repository-taxonomy-and-subfolder-archetypes
section: standards
subsection: Layout
severity: medium
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Structural rules for the 12 canonical top-level areas, permitted subfolder archetypes, promotion lifecycles, and data flow invariants.
tags:
  - standards
  - repository-taxonomy
  - folder-archetypes
  - layout
related:
  - architecture/harness-engine-overview
  - architecture/layered-agents-and-directive-hierarchy
---

# Repository Taxonomy & Subfolder Archetypes

To ensure interoperability across all repositories in the Core Harness ecosystem, every repository adheres to strict layout rules, allowed subfolder types, and directional data flows.

> [!IMPORTANT]
> Unregistered top-level directories are strictly prohibited. Adding a new top-level area requires updating `routing/areas.yaml` and re-generating dispatch indexes.

## Permitted Subfolder Archetypes by Area

| Area | Permitted Subfolder Archetypes | Lifecycle Rule |
| :--- | :--- | :--- |
| `projects/` | `projects/<slug>/`, `notes/`, `project-prompts/` | Multi-step specs stay until completed; notes promote to formal slugs. |
| `ai-tooling/` | `skills/<family>/<skill>/`, `agents/<agent>/`, `memory/{user,agent,model}/` | Skills categorized by functional family; memory partitioned by scope. |
| `docs/` | `standards/`, `guidance/` | Root `docs/` reserved for universal MUST and anti-slop rules; no ad-hoc subfolders. |
| `references/` | `<framework-family>/` | Exactly one subfolder per external framework (e.g. `conventional-commits/`). |
| `supporting/` | `<tool-or-capability>/` | Dedicated folder per external tool or CLI onboarded into the harness. |
| `scripts/` | `<functional-purpose>/` | Scripts grouped by operational purpose (`routing/`, `qmd/`, `sync/`, `_lib/`). |
| `results/` | `<category>/<topic>/<YYYY-MM-DD>/` | Immutable deliverables and benchmark reports; never mutated after publication. |
| `research/` | `<topic>/` | In-depth topic spikes with primary-source citations. |
| `scratch/` | `worktrees/<slug>/` | Ephemeral working data and isolated task worktrees; never durable SoT. |
| `change-history/` | `<YYYY>/Q<1-4>/` | Automated audit logs managed by script; never edited manually. |
| `actionable/` | Flat structure | Temporary intake drop zone; claimed, executed, and deleted. |
| `routing/` | Flat structure | Machine-generated navigation indexes and dispatch matrices. |

## Data Flow Invariants

```
actionable/ ────────► claim ────────► durable owning area

projects/ ──────────► supporting/ (strictly one-way)
projects/ ──────────► results/ (pointers only)

scratch/ ───────────► delete or promote

docs/ ──────────────► protected corpus of record (no inferred mutations)
```
