---
title: Worktree Isolation CLI Tooling Guide
slug: supporting/worktree-isolation-cli-tooling
section: supporting
subsection: Tooling
severity: medium
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Technical implementation guide for building and operating Git worktree management CLI tools, featuring pre-creation branch checks, PR state validation, and non-destructive post-merge archiving.
tags:
  - supporting
  - cli
  - worktree
  - git-tooling
  - automation
related:
  - standards/worktree-isolation-and-branch-lifecycle
  - architecture/harness-engine-overview
---

# Worktree Isolation CLI Tooling Guide

Directly invoking raw `git worktree` commands inside autonomous agent loops is fraught with danger: agents can inadvertently overwrite active worktrees, delete uncommitted code, create branch naming collisions, or force-remove worktrees before upstream PRs are merged.

The **Worktree Isolation CLI Tooling** pattern wraps low-level Git plumbing with strict safety gates, pre-creation validations, automated GitHub PR state checks, and non-destructive archival protocols.

> [!NOTE]
> All mutating agents interact with worktrees through the harness CLI (`scripts/routing/spawn_worktree.py` and `scripts/cli/harness.py`). Direct calls to `git worktree remove --force` are prohibited by repository policy.

---

## Tooling Subsystem Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Harness Agent Invocation             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         CLI Entry Point: spawn_worktree.py             │
├────────────────────────────────────────────────────────┤
│ 1. Git Common Dir Resolution                           │
│    `git rev-parse --git-common-dir`                    │
│ 2. Primary Root Health Check                           │
│    Verifies clean working directory                    │
│ 3. Slug Sanitization & Branch Format Validation        │
│    Enforces `^[a-z0-9]+(?:-[a-z0-9]+)*$`               │
└───────────────────────────┬────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
           ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│   Action: create        │       │   Action: clean / prune  │
├─────────────────────────┤       ├──────────────────────────┤
│ • Fetch latest main     │       │ • Inspect GitHub PR state│
│ • Branch: codex/<slug>  │       │ • Check unmerged commits │
│ • Add worktree to       │       │ • Non-destructive copy   │
│   scratch/worktrees/    │       │   to worktree-archives/  │
│ • Emit JSON descriptor  │       │ • Unregister worktree    │
└─────────────────────────┘       └──────────────────────────┘
```

---

## CLI Command Reference

### 1. Spawning a Worktree (`create`)
Creates an isolated worktree rooted at `scratch/worktrees/<slug>` checked out on branch `codex/<slug>`:

```bash
python scripts/routing/spawn_worktree.py create --slug fix-token-overflow
```

| Flag | Type | Description | Safety Gate |
| :--- | :--- | :--- | :--- |
| `--slug` | `string` (Required) | Kebab-case identifier for task. | Regex validated: `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `--base` | `string` (Optional) | Base commit/branch (default: `origin/main`). | Verified to exist in remote refs. |
| `--json` | `flag` (Optional) | Emits structured JSON for subagent consumption. | Validates machine-readable output. |

### 2. Listing Active Worktrees (`list`)
Parses porcelain Git worktree data to identify active workspaces, registered branches, and HEAD commit hashes:

```bash
python scripts/routing/spawn_worktree.py list --json
```

### 3. Safe Post-Merge Archiving & Cleanup (`clean`)
Inspects the associated pull request and performs safe, non-destructive archiving:

```bash
# Phase 1: Dry-run preview of pending cleanup
python scripts/cli/harness.py clean --pr 142

# Phase 2: Execute non-destructive archive and unregistration
python scripts/cli/harness.py clean --pr 142 --apply
```

> [!IMPORTANT]
> The `--apply` flag will fail with an error if GitHub reports that the PR is still `OPEN` or `DRAFT`. Deletion is only permitted when state is confirmed as `MERGED`.

---

## Technical Implementation Blueprint

The following Python reference implementation demonstrates the essential safety gates:

```python
import json
import re
import subprocess
from pathlib import Path

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def resolve_primary_root() -> Path:
    """Resolve the common repository checkout, supporting nested worktrees."""
    res = subprocess.run(
        ["git", "rev-parse", "--git-common-dir"],
        capture_output=True,
        text=True,
        check=True,
    )
    common_git = Path(res.stdout.strip())
    return (common_git if common_git.is_absolute() else Path.cwd() / common_git).resolve().parent

def create_worktree(slug: str, base_ref: str = "origin/main") -> Path:
    if not SLUG_PATTERN.match(slug):
        raise ValueError(f"Invalid task slug format: {slug}")
        
    primary_root = resolve_primary_root()
    target_dir = primary_root / "scratch" / "worktrees" / slug
    branch_name = f"codex/{slug}"
    
    if target_dir.exists():
        raise FileExistsError(f"Worktree directory already exists: {target_dir}")
        
    # Verify primary working directory is clean
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=primary_root,
        capture_output=True,
        text=True,
        check=True,
    )
    if status.stdout.strip():
        raise RuntimeError("Primary root contains uncommitted changes. Stash or commit before spawning.")
        
    # Fetch base branch and spawn worktree
    subprocess.run(["git", "fetch", "origin", "main"], cwd=primary_root, check=True)
    subprocess.run(
        ["git", "worktree", "add", "-b", branch_name, str(target_dir), base_ref],
        cwd=primary_root,
        check=True,
    )
    return target_dir

def safe_clean_worktree(pr_number: int, slug: str, apply: bool = False) -> None:
    # 1. Query GitHub CLI for merge state
    gh_proc = subprocess.run(
        ["gh", "pr", "view", str(pr_number), "--json", "state,mergedAt"],
        capture_output=True,
        text=True,
        check=True,
    )
    pr_data = json.loads(gh_proc.stdout)
    if pr_data.get("state") != "MERGED":
        raise RuntimeError(f"PR #{pr_number} is {pr_data.get('state')}. Only MERGED PRs can be cleaned.")
        
    primary_root = resolve_primary_root()
    target_dir = primary_root / "scratch" / "worktrees" / slug
    archive_dir = primary_root / ".git" / "worktree-archives" / slug
    
    if not apply:
        print(f"[PREVIEW] Ready to archive {target_dir} -> {archive_dir} and unregister branch codex/{slug}")
        return
        
    # 2. Non-destructive backup of modified files
    archive_dir.parent.mkdir(parents=True, exist_ok=True)
    if target_dir.exists():
        import shutil
        shutil.copytree(target_dir, archive_dir, dirs_exist_ok=True)
        
    # 3. Unregister worktree from Git
    subprocess.run(["git", "worktree", "remove", str(target_dir)], cwd=primary_root, check=True)
    subprocess.run(["git", "branch", "-D", f"codex/{slug}"], cwd=primary_root, check=True)
    print(f"[APPLIED] Successfully archived and removed worktree {slug}")
```

---

## Common Failure Modes & Resolution

| Error / Failure | Root Cause | Remediation Protocol |
| :--- | :--- | :--- |
| `fatal: '<branch>' already exists` | A previous task aborted without cleaning its branch. | Run `git branch -D codex/<slug>` or select a unique task slug. |
| `fatal: '<path>' already registered` | Stale metadata in `.git/worktrees/`. | Run `git worktree prune` to clear dead references. |
| `gh: command not found` | GitHub CLI not installed on host. | Ensure `gh` is in system PATH and authenticated with `gh auth status`. |
| `PermissionError: [WinError 5]` | File handles held open by language server. | Terminate background compiler or IDE processes prior to running clean. |

---

## Related Documentation

- [Worktree Isolation & Branch Lifecycle Standard](standards/worktree-isolation-and-branch-lifecycle)
- [Harness Engine Architecture Overview](architecture/harness-engine-overview)
- [Operational Memory & Recovery Checkpoints](ai-tooling/operational-memory-and-recovery-checkpoints)
- [Conventional Commits Specification](references/conventional-commits-specification)
