---
title: Three-Tier Persistent Agent Memory Architecture
slug: architecture/three-tier-agent-memory-architecture
section: architecture
subsection: Memory
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Architectural specification of the three-tier persistent agent memory subsystem, partitioning operational learnings across user identity, specialist agent thread, and model capability dimensions.
tags:
  - architecture
  - memory
  - resumption
  - failure-recovery
  - agent-state
related:
  - architecture/harness-engine-overview
  - ai-tooling/operational-memory-and-recovery-checkpoints
  - standards/context-management-standard
---

# Three-Tier Persistent Agent Memory Architecture

Modern autonomous development harnesses cannot rely on ephemeral conversation windows or host-proprietary caches (e.g. IDE home directories, machine-locked local configs). When agents encounter subtle platform behaviors, compiler anomalies, or library regressions, those insights must persist across team members, CI environments, and multi-model fleets without polluting active token context.

The **Three-Tier Persistent Agent Memory Architecture** establishes a structured, repository-committed memory system that partitions operational knowledge into three distinct operational scopes: **User Workstation**, **Agent Operational**, and **Model Capability**.

> [!NOTE]
> Persistent memory in the Core Harness is NOT a general conversation log or scratchpad. It consists solely of curated, high-density, empirical lessons learned from failures, recovery procedures, and environment quirks.

---

## Architectural Taxonomy

The memory subsystem is laid out deterministically under `ai-tooling/memory/`:

```
ai-tooling/memory/
├── AGENTS.md                 # Universal memory maintenance rules
├── README.md                 # Subsystem overview and checkpoint schemas
├── user/
│   ├── AGENTS.md             # Ingestion rules for workstation tier
│   └── <git-identity>/       # Developer-specific environment checkpoints
│       └── workstation.md    # OS, shell, path overrides, hardware traits
├── agent/
│   ├── AGENTS.md             # Ingestion rules for operational tier
│   └── <owner_agent_id>/     # Agent-specific operational domain memory
│       ├── tooling-quirks.md # CLI gotchas and tool invocation limits
│       └── recovery-playbook.md # Empirically verified recovery routines
└── model/
    ├── AGENTS.md             # Ingestion rules for capability tier
    └── <model-family>.md     # Provider-specific reasoning quirks and syntax limits
```

---

## The Three Memory Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incoming Agent Session                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│     Tier 1: User    │ │    Tier 2: Agent    │ │    Tier 3: Model    │
│     Workstation     │ │     Operational     │ │     Capability      │
├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
│ • Git identity      │ │ • Specialist quirks │ │ • Provider limits   │
│ • Local tool paths  │ │ • Failure modes     │ │ • Prompt anomalies  │
│ • OS / shell quirks │ │ • Recovery steps    │ │ • JSON constraints  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │ JIT Ingestion
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Sanitized Context Invariant Assembly               │
└─────────────────────────────────────────────────────────────────┘
```

### 1. User Workstation Tier (`user/<git-identity>/`)
Captures developer-specific workstation topology without leaking secrets:
- Target OS variations (Windows PowerShell quoting rules, Linux POSIX flags, macOS BSD vs. GNU utilities).
- Absolute path bindings for system runtimes (e.g. customized SDK paths, container daemons).
- User interaction preferences and notification thresholds.

### 2. Agent Operational Tier (`agent/<owner_agent_id>/`)
Stores operational playbooks directly tied to specific specialist agents:
- **Common Failure Modes**: Detailed triggers for tooling failures (e.g. git rebase locking on background daemons).
- **Tooling Quirks**: Subtle behavior in CLI utilities (e.g. stdout buffering, encoding errors on non-UTF8 terminals).
- **Learned Recovery Strategies**: Deterministic step-by-step resolution scripts to recover from degraded states.
- **Critical Success Factors**: Invariants that guarantee successful runs without speculative looping.

### 3. Model Capability Tier (`model/<model-family>.md`)
Captures empirical behavior and failure boundaries for specific foundation models:
- Token threshold inflection points where instruction-following fidelity drops.
- Known JSON schema generation defects or tool-calling bracket issues.
- Prompt-caching prefix sensitivity to whitespace or dynamic timestamps.

---

## Memory Comparison Matrix

| Dimension | Tier 1: User Workstation | Tier 2: Agent Operational | Tier 3: Model Capability |
| :--- | :--- | :--- | :--- |
| **Storage Path** | `memory/user/<git-identity>/` | `memory/agent/<owner_id>/` | `memory/model/<model-family>.md` |
| **Ingestion Scope** | Ingested when running on target machine | Ingested JIT when specialist is dispatched | Ingested when running under designated model |
| **Volatility** | Low (changes on hardware/toolchain upgrades) | Medium (updated on novel failure modes) | Low (updated on provider API version shifts) |
| **Review Gate** | Author and team lead | Specialist domain owner | Harness core architecture team |
| **Sensitive Data Gate** | Zero real PII, synthetic paths preferred | No production secrets, sanitized logs only | Synthetic prompt reproduction cases only |

---

## The Durable Learning Loop

To ensure memory remains fresh without manual administrative drag, agents adhere to the **Durable Learning Loop** at session conclusion:

```
[Agent Encounters Novel Failure Mode]
                 │
                 ▼
[Root-Cause Analysis (No Workarounds Permitted)]
                 │
                 ▼
[Empirical Validation of Recovery Script]
                 │
                 ▼
[Write Checkpoint to ai-tooling/memory/<tier>/]
                 │
                 ▼
[Commit Checkpoint with Feature / Fix PR]
```

> [!CAUTION]
> Agents MUST NOT use memory files as a dumping ground for standard conversation logs, exploratory thoughts, or unverified speculations. Every checkpoint entry must describe an empirical failure and a proven recovery procedure.

---

## Memory Entry Schema Example

Operational memory files follow a strict markdown format to allow deterministic parsing:

```markdown
# Git Subsystem Operational Memory

- **Owner agent:** harness-operator
- **Status:** Active
- **Last updated:** 2026-10-10
- **Scope:** Git worktree creation, lock contention, and safe post-merge cleanup.

## Common Failure Modes & Pitfalls
- [Problem]: `git worktree add` fails with exit code 128 when target directory already exists.
- [Prevention]: Verify target path using `os.path.exists()` and invoke `git worktree prune` prior to creation.

## Environment Quirks & Tooling Gotchas
- [Quirk]: Windows file system locks index files when subagent terminals hold open handles.
- [Workaround/Fix]: Terminate background file-watchers before issuing `git worktree remove`.

## Learned Recovery Strategies
- [Symptom]: `fatal: Unable to create '.git/index.lock': File exists`.
- [Fix Procedure]: Check process table for stale git operations, verify lockfile age exceeds 300s, and remove stale lock.
```

---

## Related Documentation

- [Harness Engine Architecture Overview](architecture/harness-engine-overview)
- [Operational Memory & Recovery Checkpoints](ai-tooling/operational-memory-and-recovery-checkpoints)
- [Context Management Standard](standards/context-management-standard)
- [Worktree Isolation & Branch Lifecycle Standard](standards/worktree-isolation-and-branch-lifecycle)
