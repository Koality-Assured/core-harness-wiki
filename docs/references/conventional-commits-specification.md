---
title: Conventional Commits Specification
slug: references/conventional-commits-specification
section: references
subsection: Git
severity: info
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Standard commit message structure, allowable prefix types (feat, fix, docs, refactor, chore), and automated changelog compatibility.
tags:
  - references
  - git
  - conventional-commits
  - standards
related:
  - standards/repository-taxonomy-and-subfolder-archetypes
  - references/ai-safety-and-data-protection-boundaries
---

# Conventional Commits Specification

All commits and Pull Request titles within the Core Harness ecosystem must strictly conform to the **Conventional Commits v1.0.0** specification.

> [!NOTE]
> Consistent commit structure enables automated semantic versioning, deterministic changelog generation, and immediate readability across agent runs.

## Commit Message Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

## Permitted Types

- **`feat`**: Introduces a new feature or user-facing capability.
- **`fix`**: Patches a bug or resolves an unexpected failure mode.
- **`docs`**: Documentation changes only (`README.md`, `AGENTS.md`, wiki articles).
- **`refactor`**: Code change that neither fixes a bug nor adds a feature.
- **`test`**: Adding missing tests or correcting existing tests.
- **`chore`**: Maintenance tasks, dependencies, build configurations.
- **`perf`**: Performance optimization.
