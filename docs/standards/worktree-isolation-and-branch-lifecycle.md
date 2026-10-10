---
title: Worktree Isolation & Branch Lifecycle Standard
slug: standards/worktree-isolation-and-branch-lifecycle
section: standards
subsection: Isolation
severity: critical
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Normative standard governing isolated worktree environments, task-scoped disposable branches, zero-collision concurrency, and non-destructive post-merge cleanup protocols for mutating agents.
tags:
  - standards
  - isolation
  - worktrees
  - git
  - safety-gates
related:
  - architecture/harness-engine-overview
  - supporting/worktree-isolation-cli-tooling
  - references/conventional-commits-specification
---

# Worktree Isolation & Branch Lifecycle Standard

In multi-agent engineering harnesses, multiple autonomous agents frequently execute concurrent tasks across the same repository. Mutating files directly within the primary repository checkout introduces catastrophic race conditions, git index lock contention, dirty working trees, and cross-task context pollution.

This standard defines the **mandatory lifecycle for mutating agent work**: strict worktree isolation, task-scoped disposable branches, and non-destructive post-merge cleanup.

> [!IMPORTANT]
> **Normative Directive (CRITICAL)**: Agents MUST NOT mutate code, configuration, or documentation on the primary working tree or default branch (`main` / `master`). All file edits, test executions, and intermediate commits must take place inside an isolated Git worktree.

---

## The Worktree Lifecycle

Every mutating task transitions through five strictly ordered lifecycle phases:

```
┌────────────────────────────────────────────────────────┐
│ 1. Spawn Worktree                                      │
│    - Validate primary checkout clean                   │
│    - Branch: codex/<task-slug>                         │
│    - Path: scratch/worktrees/<task-slug>/              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 2. Mutating Execution                                  │
│    - Specialist agent executes in isolated workspace   │
│    - Commits follow Conventional Commits               │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 3. Pull Request Submission                             │
│    - Push branch to remote origin                      │
│    - Open pull request via `gh pr create`              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 4. Verification & Merge                                │
│    - Automated CI validation checks pass               │
│    - Human review and merge to main                    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 5. Safe Post-Merge Cleanup                             │
│    - Verify PR state == "MERGED"                       │
│    - Archive worktree state to safe backup             │
│    - Unregister worktree (never force-delete)          │
└────────────────────────────────────────────────────────┘
```

---

## Directory & Branch Taxonomy

To prevent collisions and enable automated tooling discovery, all worktrees and branches must strictly adhere to the following taxonomy:

| Attribute | Specification | Example / Pattern |
| :--- | :--- | :--- |
| **Location Root** | Must reside under `scratch/worktrees/` | `c:\repo\scratch\worktrees\` |
| **Directory Name** | Kebab-case alphanumeric slug matching task | `scratch/worktrees/fix-auth-tokens/` |
| **Branch Format** | Prefixed with `codex/` or `feat/` followed by slug | `codex/fix-auth-tokens` |
| **Base Ref** | Default upstream branch (`main`) fetched fresh | `origin/main` |
| **Archive Target** | Common Git directory worktree archive folder | `.git/worktree-archives/<task-slug>/` |

---

## Core Lifecycle Invariants

### 1. Pre-Creation Cleanliness Gate
Before spawning a new worktree, the harness CLI must inspect the primary repository state:
- The primary working tree must be clean (no uncommitted or untracked changes).
- The requested task slug must not collide with an existing worktree directory or branch.
- Upstream tracking references must be synchronized with `git fetch origin main`.

### 2. Isolated Mutation Invariant
When a specialist subagent is invoked, its working directory must be set exclusively to the root of the spawned worktree. The parent coordinator agent retains its working directory in the primary root to coordinate and monitor progress without locking Git indexes.

```bash
# Example harness worktree creation command
python scripts/routing/spawn_worktree.py create --slug fix-auth-tokens
```

### 3. Conventional Commit Discipline
Every commit created within the worktree must strictly adhere to the Conventional Commits specification (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Commits must include descriptive bodies and never commit raw credentials or sensitive logs.

### 4. Non-Destructive Post-Merge Archiving
Once a PR is merged, deleting worktrees with `rm -rf` or `git worktree remove --force` risks unrecoverable data loss in the event of partial sync or detached references. The harness mandates a two-stage removal process:

1. **Preview Gate**: Run `harness.py clean --pr <number>` without `--apply` to inspect PR merge state, git status, and unpushed commits.
2. **Archival & Unregistration**: With `--apply`, the tool copies modified worktree files into `.git/worktree-archives/<task-slug>/`, unregisters the worktree from Git (`git worktree remove`), and safely deletes the feature branch.

> [!CAUTION]
> NEVER invoke `git worktree remove --force` or manual recursive deletion on an active worktree. Always utilize the harness cleanup CLI to guarantee safe archive retention.

---

## Concurrency & Conflict Resolution Matrix

When multiple agents operate concurrently on disparate worktrees:

| Scenario | Risk | Harness Mitigation Rule |
| :--- | :--- | :--- |
| **Two agents touch separate areas** | Negligible | Full parallel execution allowed; branches merge independently. |
| **Two agents touch overlapping files** | Git merge conflict on PR | Standard Git merge review; second PR rebases on `main`. |
| **Subagent process crashes mid-task** | Stale lock or orphan branch | Primary root remains intact; worktree can be inspected or resumed. |
| **Worktree deletion attempted before PR merge** | Data loss | Tooling gate rejects deletion if `gh pr view` reports state != "MERGED". |

---

## Related Documentation

- [Harness Engine Architecture Overview](architecture/harness-engine-overview)
- [Worktree Isolation CLI Tooling Guide](supporting/worktree-isolation-cli-tooling)
- [Conventional Commits Specification](references/conventional-commits-specification)
- [Multi-Agent Task Routing Matrix](architecture/multi-agent-task-routing-matrix)
