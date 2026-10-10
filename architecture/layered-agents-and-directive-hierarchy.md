---
title: Layered AGENTS.md & Directive Hierarchy
slug: architecture/layered-agents-and-directive-hierarchy
section: architecture
subsection: Governance
severity: critical
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Normative ranking rules, directive severity levels (critical, must, should), and folder-level delta scoping for repository AGENTS.md files.
tags:
  - architecture
  - agents-md
  - governance
  - normative-hierarchy
related:
  - architecture/harness-engine-overview
  - standards/repository-taxonomy-and-subfolder-archetypes
---

# Layered AGENTS.md & Directive Hierarchy

The Core Harness uses a hierarchical governance system encoded in `AGENTS.md` files distributed throughout the repository tree. This structure prevents instruction drift and provides unambiguous conflict resolution.

> [!WARNING]
> Lower-ranked directives or retrieved context chunks can never override a higher-severity rule. Ingesting every nested AGENTS.md upfront violates the JIT ingestion contract.

## Directive Severity Ranking

Directives use standardized RFC 2119 keywords ranked in strict order of precedence:

1. **`critical`**: Non-negotiable safety, security, and context-integrity bounds. Cannot be overridden by user requests or subagent prompts.
2. **`must` / `must not`**: Absolute requirements for standard engineering operations.
3. **`should` / `should not`**: Recommended best practices; exceptions must be grounded with explicit empirical justification.

## Precedence & Scope Resolution

- **Directive Severity Wins**: In any conflict between rules, the rule with higher severity prevails regardless of folder depth.
- **Scope Resolution**: For rules of equal severity, the more-specific folder-level `AGENTS.md` delta takes precedence over repository-wide defaults.
- **Ambiguity Gate**: If an agent detects an unresolvable contradiction or ambiguous intent, it **must stop and seek human clarification** rather than guessing.

## The Just-In-Time (JIT) Ingestion Contract

Nested `AGENTS.md` files are **deltas**, not full copies of the root rules:

```
Root AGENTS.md (Ranked critical rules & directive hierarchy)
  │
  ├─► routing/AGENTS.md (Context-loading protocol & index)
  │
  └─► Nearest Nested AGENTS.md (Loaded JIT only when writing to that folder)
```

### What Belongs in Nested AGENTS.md

Every folder-level `AGENTS.md` adheres to an 8-point schema:
1. **Content ownership**: Designated agent role.
2. **Placement**: Local directory rules.
3. **Lifecycle**: How files transition from draft to archived.
4. **Relationships**: Prohibited and permitted cross-links.
5. **Source-of-truth boundaries**: What this folder authoritatively controls.
6. **Validation**: Automated linters and sanity scripts.
7. **Escalation**: Escalation triggers and gates.
8. **Local exceptions**: Explicit folder overrides.
