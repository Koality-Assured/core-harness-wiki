---
title: Skill Authoring & Dispatch Lifecycle
slug: ai-tooling/skill-authoring-and-dispatch-lifecycle
section: ai-tooling
subsection: Skills
severity: medium
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Standard structure of SKILL.md, metadata headers, helper scripts, progressive disclosure, and dispatch mapping via routing catalogs.
tags:
  - ai-tooling
  - skills
  - dispatch
  - skill-lifecycle
related:
  - ai-tooling/operator-archetypes-and-discipline
  - standards/agent-skill-pairing-discipline
---

# Skill Authoring & Dispatch Lifecycle

A **Skill** is a packaged, repeatable procedure that equips an AI agent with specialized domain capabilities, executable scripts, and guidance.

> [!NOTE]
> Skills encapsulate procedural execution. `AGENTS.md` states intent and MUST rules; skills provide step-by-step workflows.

## Skill Folder Layout

Skills are grouped into functional families under `ai-tooling/skills/<family>/<skill-slug>/`:

```
ai-tooling/skills/<family>/<skill-slug>/
├── SKILL.md                 # Primary instruction file with YAML frontmatter
├── scripts/                 # Tagged helper scripts and automation utilities
├── examples/                # Input/output examples and reference workflows
└── references/              # Advisory documentation and schema definitions
```

## `SKILL.md` Anatomy

Every `SKILL.md` file begins with standard YAML frontmatter:

```yaml
---
name: sample-skill
description: Brief one-line summary of what the skill does and when to invoke it.
owner_agent: harness-operator
tags: [lifecycle, build]
---
```

## Progressive Disclosure

To minimize token consumption:
1. **Catalog Visibility**: Only the skill name and description are visible in root indexes (`routing/skill-dispatch.md`).
2. **Just-In-Time Loading**: The full body of `SKILL.md` is loaded only after dispatching to the designated agent.
3. **Parent Non-Execution**: Parent coordinator agents must not load or execute specialist skill bodies directly.
