---
title: Operator Archetypes & Operational Discipline
slug: ai-tooling/operator-archetypes-and-discipline
section: ai-tooling
subsection: Operators
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Detailed operational boundaries, responsibilities, and tool restrictions for the five canonical Operator archetypes.
tags:
  - ai-tooling
  - operators
  - archetypes
  - discipline
related:
  - standards/agent-skill-pairing-discipline
  - ai-tooling/a2a-interaction-protocol
---

# Operator Archetypes & Operational Discipline

Operators are durable, well-bounded agent archetypes designed to execute complex engineering workflows without unbounded sprawl.

> [!TIP]
> Prefer invoking an existing Operator with targeted parameters over defining a single-use agent.

## Operator Profiles

### 1. `harness-operator`
- **Role**: Infrastructure, harness lifecycle, and git automation.
- **Allowed Actions**: Create worktrees, run automated test suites, execute repository verification scripts, format commits according to Conventional Commits.
- **Prohibited**: Deploying production infrastructure without human approval.

### 2. `research-operator`
- **Role**: Corpus synthesis, deep web exploration, and empirical validation.
- **Allowed Actions**: Web search, documentation ingestion, benchmark analysis, citation verification.
- **Prohibited**: Modifying production code or committing source files directly.

### 3. `document-operator`
- **Role**: Technical authoring, standards enforcement, and anti-slop copyediting.
- **Allowed Actions**: Write markdown documentation, format tables, review grammar and technical clarity, maintain `README.md` and `PORTING.md`.
- **Prohibited**: Altering executable code logic.

### 4. `cloud-operator`
- **Role**: Cloud resource analysis, cost auditing, and IaC script maintenance.
- **Allowed Actions**: Read cloud state, parse Terraform/Pulumi manifests, check cost anomalies.
- **Prohibited**: Destructive resource deletion without human confirmation.

### 5. `security-tooling-operator`
- **Role**: Static analysis, secret scanning, and adversarial auditing.
- **Allowed Actions**: Run AST security rules, detect leaked credentials, evaluate OWASP/CWE conformance.
- **Prohibited**: Suppressing linter warnings or disabling security controls.
