---
title: Operational Memory & Recovery Checkpoints
slug: ai-tooling/operational-memory-and-recovery-checkpoints
section: ai-tooling
subsection: Memory
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Operational engineering standard and markdown schema for recording agent failure modes, environment quirks, and recovery strategies in operational memory checkpoints.
tags:
  - ai-tooling
  - memory-schemas
  - recovery
  - checkpoints
  - troubleshooting
related:
  - architecture/three-tier-agent-memory-architecture
  - ai-tooling/operator-archetypes-and-discipline
  - standards/context-management-standard
---

# Operational Memory & Recovery Checkpoints

When autonomous agents encounter tool crashes, shell encoding traps, filesystem lock contention, or obscure compiler warnings, standard conversational agents repeat the same exploratory debugging loops across every new session.

The **Operational Memory & Recovery Checkpoints** standard establishes a deterministic schema and operational workflow for capturing empirically validated problem-solution pairs. By committing these checkpoints directly to the repository under `ai-tooling/memory/agent/<owner_agent_id>/`, the entire multi-agent fleet gains institutional memory.

> [!NOTE]
> Operational memory is reserved for non-obvious, platform-dependent, or recurring environmental failures. It does not replace code comments, test assertions, or architecture documents.

---

## Standard Checkpoint Schema

Every operational memory checkpoint file must conform to the following four-section Markdown schema:

```markdown
# <Domain or Subsystem Name> Operational Memory

- **Owner agent:** <owner_agent_id>
- **Status:** Active
- **Last updated:** YYYY-MM-DD
- **Scope:** Operational knowledge, common pitfalls, environment quirks, and recovery strategies for <owner_agent_id>.

## Common Failure Modes & Pitfalls
- [Problem]: Precise description of the failure condition and root cause.
- [Prevention]: Specific pre-flight validation steps or flags to avoid the failure.

## Environment Quirks & Tooling Gotchas
- [Quirk]: Concrete OS, terminal, shell, or CLI utility behavioral idiosyncrasy.
- [Workaround/Fix]: The exact command pattern, flag, or configuration override required.

## Learned Recovery Strategies
- [Symptom]: Observable error message, stderr signature, or unexpected non-zero exit code.
- [Fix Procedure]: Step-by-step diagnostic and remediation commands verified by the agent.

## Critical Success Factors
- List of non-negotiable operational invariants required for repeatable execution.
```

---

## Authoring Rules & Invariants

To keep operational memory high-density, maintainable, and safe:

1. **Empirical Verification Required**: An agent MUST NOT record a recovery strategy unless the procedure was executed, verified to succeed, and confirmed not to cause side effects. Speculative fixes are forbidden.
2. **Root-Cause Resolution**: Fixes must resolve genuine underlying root causes. Documenting superficial workarounds (such as disabling lint rules, adding unbounded timeouts, or silencing stderr) is strictly prohibited.
3. **Zero Sensitive Data Gate**: Checkpoints must NEVER contain private keys, authentication tokens, real internal hostnames, or employee email addresses. Use generic synthetic placeholders (`example.com`, `account-prod`).
4. **Token Budget Cap**: Checkpoint files should remain under 120 lines. When a checkpoint grows too long, obsolete or resolved issues must be pruned during quarterly reviews.

---

## Concrete Checkpoint Implementations

### Example 1: Git Subsystem & Filesystem Lock Checkpoint

```markdown
# Git Subsystem Operational Memory

- **Owner agent:** harness-operator
- **Status:** Active
- **Last updated:** 2026-10-10
- **Scope:** Git worktree operations, lockfile contention, and cross-platform path handling.

## Common Failure Modes & Pitfalls
- [Problem]: Creating a worktree fails with `fatal: '<path>' already exists` when a prior crashed session left a detached directory.
- [Prevention]: Run `git worktree list --porcelain` to check registration, and run `git worktree prune` before creating new paths.

## Environment Quirks & Tooling Gotchas
- [Quirk]: On Windows NTFS, background file indexers hold open handles on newly created `.git` worktree pointers, causing transient `PermissionError` on immediate cleanup.
- [Workaround/Fix]: Wrap worktree deletion in an exponential retry backoff (3 attempts, 200ms initial interval) or invoke `git worktree remove` via subprocess rather than manual `os.rmdir`.

## Learned Recovery Strategies
- [Symptom]: `fatal: Unable to create '.git/index.lock': File exists`.
- [Fix Procedure]:
  1. Inspect running background tasks for active git child processes.
  2. Verify timestamp of `.git/index.lock` is older than 300 seconds.
  3. Safely delete the stale `.git/index.lock` file and re-run command.

## Critical Success Factors
- Always invoke git commands with explicit UTF-8 encoding and surrogateescape error handling.
```

### Example 2: CLI Subshell Encoding Checkpoint

```markdown
# Subshell Execution Operational Memory

- **Owner agent:** research-operator
- **Status:** Active
- **Last updated:** 2026-10-10
- **Scope:** Python subprocess execution, cross-platform terminal pipelines, and output buffering.

## Common Failure Modes & Pitfalls
- [Problem]: Subprocess hangs indefinitely when executing external tools that wait for stdin EOF.
- [Prevention]: Always pass `stdin=subprocess.DEVNULL` for non-interactive automated subshell commands.

## Environment Quirks & Tooling Gotchas
- [Quirk]: PowerShell defaults stdout encoding to Windows-1252 or UTF-16LE, corrupting Unicode symbols like `✓` or `⚠`.
- [Workaround/Fix]: Execute python scripts with `PYTHONIOENCODING=utf-8` or invoke commands directly via Python `subprocess.run` rather than intermediate PowerShell wrappers.

## Learned Recovery Strategies
- [Symptom]: `UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d in position ...`
- [Fix Procedure]: Pass `encoding="utf-8", errors="replace"` to `subprocess.run` to guarantee non-crashing stream reads.

## Critical Success Factors
- Keep stdout and stderr separated in capture pipelines to preserve structured error traces.
```

---

## Checkpoint Lifecycle Workflow

```
[Agent Execution Error / Tool Gotcha]
                  │
                  ▼
[Conduct Root-Cause Diagnostics]
                  │
                  ▼
[Test Resolution Script in Scratch Workspace]
                  │
                  ▼
[Did the Resolution Fix the Problem?]
         ├── NO ──► Surface failure to human operator
         │
         └── YES ─► Update ai-tooling/memory/agent/<id>/<topic>.md
                  │
                  ▼
[Commit Checkpoint with Final Solution PR]
```

---

## Related Documentation

- [Three-Tier Persistent Agent Memory Architecture](architecture/three-tier-agent-memory-architecture)
- [Operator Archetypes & Operational Discipline](ai-tooling/operator-archetypes-and-discipline)
- [Context Management Standard](standards/context-management-standard)
- [Worktree Isolation CLI Tooling Guide](supporting/worktree-isolation-cli-tooling)
