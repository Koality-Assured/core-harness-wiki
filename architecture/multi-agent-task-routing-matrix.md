---
title: Multi-Agent Task Routing Matrix & Dispatch Engine
slug: architecture/multi-agent-task-routing-matrix
section: architecture
subsection: Routing
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Architectural pattern for single-hop task-to-entrypoint resolution, intent classification, declarative area mapping, and coordinator-to-specialist dispatch boundaries in autonomous agent harnesses.
tags:
  - architecture
  - routing
  - task-matrix
  - dispatch
  - multi-agent
related:
  - architecture/harness-engine-overview
  - architecture/layered-agents-and-directive-hierarchy
  - standards/agent-skill-pairing-discipline
---

# Multi-Agent Task Routing Matrix & Dispatch Engine

Autonomous agent systems operating across complex enterprise repositories frequently suffer from routing degradation: coordinator agents wander through irrelevant subdirectories, speculate on appropriate tools, or spawn unnecessary subagent chains. The **Multi-Agent Task Routing Matrix** resolves this by establishing a deterministic, single-hop intent resolution engine that binds task intents directly to owning areas, designated specialist agents, and verification contracts.

> [!IMPORTANT]
> The parent coordinator agent is strictly a validator, planner, and dispatcher. When an incoming task requires mutating repository state or invoking deep domain skills, the coordinator MUST resolve the intent via the Routing Matrix, establish worktree isolation, and spawn a specialist under a clean-slate boundary.

---

## Architectural Principles

1. **Single-Hop Resolution**: Any distinct developer or operational intent must resolve to an exact entry area, owner agent, and skill within a single evaluation step.
2. **Just-In-Time (JIT) Progressive Disclosure**: Neither coordinator nor subagent preloads all repository rules. Agents ingest only the root normative hierarchy followed strictly JIT by the target area's `AGENTS.md`.
3. **Clean-Slate Spawn Boundary**: Subagents must be spawned with an empty conversational history (`fork_turns: "none"`). Only explicit task instructions, authorized scope, and relevant file pointers pass through the dispatch boundary.
4. **Parent Discovery Bound**: The moment an intent matches a cataloged skill or owner agent with material scope, exploratory file reads in the parent coordinator MUST terminate immediately.

---

## Dispatch Architecture Workflow

The following diagram illustrates the flow from user intent to isolated specialist execution:

```
┌────────────────────────────────────────────────────────┐
│                      User Intent                       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Parent Coordinator Agent                 │
│  - Ingests Root AGENTS.md                              │
│  - Evaluates Task Dispatch Matrix                      │
└─────────────┬───────────────────────────┬──────────────┘
              │ [Read-Only Query]         │ [Mutating Intent]
              ▼                           ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│ In-Parent Read / Cost    │ │ 1. Spawn Task Worktree   │
│ Layers (qmd, ast-grep)   │ │    (scratch/worktrees/)  │
└──────────────────────────┘ │ 2. Dispatch Specialist   │
                             │    (fork_turns: "none")  │
                             └────────────┬─────────────┘
                                          │
                             ┌────────────▼─────────────┐
                             │    Specialist Subagent   │
                             │  - Ingests Area Del-     │
                             │    tas Strictly JIT      │
                             │  - Executes Domain Skill │
                             │  - Commits to Worktree   │
                             └──────────────────────────┘
```

---

## Declarative Task Dispatch Matrix

The matrix governs deterministic routing across core repository operations:

| Task Intent | Target Area | Default Agent Archetype | Primary Skill | Mandatory Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Adversarial Security Audit** | `scratch/audits/` | `security-tooling-operator` | `antagonistic-review` | Fast structural validation & AST check |
| **Document / Standards Authoring** | `docs/standards/` | `document-operator` | `doc-builder` | `validate-content.mjs` & style lint |
| **AST Symbol Fact Extraction** | Codebase symbols | `harness-operator` | `ast-grep` | Structural grep outline inspection |
| **Semantic Knowledge Discovery** | Markdown corpus | `research-operator` | `qmd-retrieval` | QMD index cache query |
| **Worktree Lifecycle & Mutate** | `scratch/worktrees/` | `harness-operator` (in-parent) | `isolate-work` | Branch naming & clean-state pre-check |
| **External Dependency Audit** | `references/` | `security-tooling-operator` | `dependency-audit` | Lockfile checksum & CVE lookup |
| **Multi-Cloud Infrastructure** | `infra/` | `cloud-operator` | `terraform-plan` | Dry-run plan without remote mutation |
| **Fleet Performance Benchmark** | `results/benchmarks/` | `research-operator` | `fleet-eval` | Cost-layer metric ledger generation |

---

## Dispatch & Execution Protocol

When routing incoming requests, the harness engine executes a five-phase dispatch loop:

```python
# Conceptual implementation of harness dispatch evaluation
def resolve_and_dispatch(task_prompt: str, repo_root: Path) -> DispatchTarget:
    # 1. Classify intent against declarative matrix patterns
    intent = classify_intent(task_prompt, rules=ROUTING_MATRIX)
    
    # 2. Check mutation requirement
    if intent.requires_mutation:
        # Generate task slug and isolated git worktree
        slug = sanitize_slug(intent.short_name)
        worktree_path = spawn_worktree(slug=slug, base_branch="main")
        workspace_mode = "branch"
    else:
        worktree_path = repo_root
        workspace_mode = "inherit"

    # 3. Construct clean-slate dispatch payload
    payload = DispatchTarget(
        agent_id=intent.owner_agent,
        workspace_path=worktree_path,
        fork_turns="none",  # Enforce clean context boundary
        prompt=compose_specialist_prompt(
            task=task_prompt,
            area_delta_path=intent.target_area / "AGENTS.md",
            skill_path=intent.primary_skill_path,
        )
    )
    return payload
```

> [!TIP]
> Always pass file **paths** rather than file contents in the coordinator's dispatch prompt. The specialist will ingest the designated files directly into its own clean context window, preserving parent token capacity.

---

## Anti-Patterns & Gate Invariants

To avoid harness failures, enforce the following non-negotiable invariants:

- **No Deep Exploration in Coordinator**: Coordinator agents must never execute recursive directory searches or dump large code files once an intent match is confirmed.
- **No Direct Mutation on Default Branch**: All mutating operations must originate within an isolated disposable worktree created via `spawn_worktree`. Direct commits to `main` are strictly rejected.
- **No Chained Coordinator Chores**: The coordinator must not spawn subagents for trivial coordinator chores (e.g. running the worktree spawn CLI, formatting commit titles, or writing session-end change logs).
- **Audit User Request on Return**: When a subagent signals completion, the coordinator audits whether the original human goal has been fulfilled. It must not invent follow-on busywork.

---

## Related Documentation

- [Harness Engine Architecture Overview](architecture/harness-engine-overview)
- [Layered AGENTS.md & Directive Hierarchy](architecture/layered-agents-and-directive-hierarchy)
- [Agent-Skill Pairing Discipline & Operator Priority](standards/agent-skill-pairing-discipline)
- [Worktree Isolation & Branch Lifecycle Standard](standards/worktree-isolation-and-branch-lifecycle)
