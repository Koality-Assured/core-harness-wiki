---
title: Agent-Skill Pairing Discipline & Operator Priority
slug: standards/agent-skill-pairing-discipline
section: standards
subsection: Discipline
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Architectural rules governing when to map capabilities to existing Operators versus minting dedicated specialist agents, and strict isolation requirements.
tags:
  - standards
  - agent-pairing
  - operators
  - skills
related:
  - standards/context-management-standard
  - ai-tooling/operator-archetypes-and-discipline
---

# Agent-Skill Pairing Discipline & Operator Priority

A common anti-pattern in agentic engineering is the proliferation of disposable, hyperspecific micro-agents (e.g. creating a new agent for every sub-task or API endpoint). This practice leads to fragmented memory, duplicate routing tables, and inconsistent governance.

> [!NOTE]
> The Core Harness enforces **Operator-First Pairing**. New capabilities must be incorporated into established Operator archetypes before minting new specialist roles.

## The Five Canonical Operator Archetypes

All general-purpose development workflows map to five foundational operators:

1. **`harness-operator`**: Repository routing, worktree isolation, change-history provenance, test suites, and harness validation.
2. **`research-operator`**: Empirical investigations, primary source evaluation, RFC analysis, and structured research dossiers.
3. **`document-operator`**: Technical documentation, standards authoring, anti-slop copyediting, and humanizer passes.
4. **`cloud-operator`**: Multi-cloud infrastructure orchestration, cost optimization, Terraform/Pulumi scripts, and resource inventory.
5. **`security-tooling-operator`**: AST static analysis, dependency scanning, secret detection, and adversarial vulnerability reviews.

## Dedicated Specialist Threshold

A dedicated specialist agent may **only** be created when ALL of the following criteria are satisfied:

- **Disjoint Domain**: The domain requires deep contextual terminology entirely outside standard software engineering (e.g. game engine physics simulation, quantitative portfolio risk modeling, statutory legal citation parsing).
- **Unique Tool Access**: The specialist requires specialized tooling or credentials that must not be exposed to general-purpose agents.
- **Independent Adversarial Boundary**: The agent acts as an independent adversarial auditor whose judgments must not be influenced by author context.
