---
title: Multi-Agent Fleet Benchmarking Methodology
slug: references/multi-agent-fleet-benchmarking-methodology
section: references
subsection: Evaluation
severity: medium
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Empirical benchmarking methodology for evaluating multi-agent systems, measuring delegation contract integrity, tool utilization efficiency, retrieval accuracy, and simulated trajectory costs.
tags:
  - references
  - benchmarking
  - fleet-eval
  - cost-modeling
  - metrics
related:
  - architecture/harness-engine-overview
  - standards/agent-skill-pairing-discipline
  - supporting/cost-layer-validation-pipeline
---

# Multi-Agent Fleet Benchmarking Methodology

Standard artificial intelligence evaluation benchmarks (e.g. HumanEval, SWE-bench, MMLU) evaluate single-turn or single-agent task solving. However, enterprise software engineering harnesses operate as coordinated multi-agent fleets. In these environments, failures rarely stem from code generation syntax alone; instead, systems fail at delegation boundaries, through recursive token loops, via tool misuse, and through prompt cache invalidation.

The **Multi-Agent Fleet Benchmarking Methodology** establishes an empirical evaluation framework to measure multi-agent system performance across four foundational pillars: **Delegation Contract Integrity**, **Tool Utilization Efficiency**, **Retrieval Accuracy**, and **Simulated Trajectory Cost**.

> [!NOTE]
> All benchmarks in the Core Harness adhere to empirical proof-of-work validation: agent performance must be measured through deterministic test suites, dry runs, and sandbox telemetry rather than speculative self-reporting.

---

## The Four Evaluation Pillars

```
┌────────────────────────────────────────────────────────┐
│             Multi-Agent Fleet Evaluation Suite         │
└───────────────────────────┬────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│ Pillar 1:        │ │ Pillar 2:     │ │ Pillar 3:        │
│ Delegation       │ │ Tool          │ │ Retrieval & Cost │
│ Integrity (DCI)  │ │ Efficiency    │ │ Layers (RCA)     │
│ - Clean-slate    │ │ - Productive  │ │ - QMD precision  │
│   isolation      │ │   vs thrashing│ │ - ast-grep recall│
│ - Budget limits  │ │ - Retry rate  │ │ - Headroom ratio │
└──────────┬───────┘ └───────┬───────┘ └────────┬─────────┘
           │                 │                  │
           └────────────────┼──────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Pillar 4: Simulated Trajectory Cost (STC)              │
│ - Input / Output / Cached Token Totals                 │
│ - Financial Cost per Completed Ticket ($USD)           │
│ - Wall-Clock Latency & Parallelization Speedup         │
└────────────────────────────────────────────────────────┘
```

---

## Pillar Specifications & Mathematical Formulations

### 1. Delegation Contract Integrity (DCI)
Evaluates whether parent coordinators and subagents respect delegation boundaries:
- **Clean-Slate Compliance**: Verifies that subagents are spawned with empty history (`fork_turns: "none"`) without parent conversation leakage.
- **Exchange Budget Compliance**: Verifies that inter-agent conversations complete within the maximum exchange budget (default: 8 exchanges).
- **Domain Pairing Accuracy**: Ratio of tasks dispatched to canonical Operator archetypes versus illicit micro-agent creation.

$$\text{DCI} = \frac{\text{Compliant Delegations}}{\text{Total Delegations}} \times 100\%$$

### 2. Tool Utilization Efficiency (TUE)
Measures the operational density of tool execution. Non-productive actions include repetitive `ls` calls, unbounded full-file dumps, and speculative shell invocations:

$$\text{TUE} = \frac{N_{\text{productive\_actions}}}{N_{\text{total\_tool\_invocations}}}$$

*A task that performs 3 targeted AST scans and 1 patch application scores higher than a task that dumps 14 full files before attempting an edit.*

### 3. Retrieval & Cost-Layer Accuracy (RCA)
Measures the efficacy of localized search tools:
- **QMD Retrieval Hit Rate**: Percentage of documentation queries that locate the correct specification section in the top 3 hits.
- **ast-grep Outline Precision**: Precision of structural symbol extraction without reading unrelated file lines.
- **Headroom Compression Retention**: Retention of actionable failure signatures (exit code, stack trace) after log compression.

### 4. Simulated Trajectory Cost (STC)
Models the total economic expenditure of resolving a software issue across the multi-agent hierarchy:

$$C_{\text{traj}} = \sum_{t=1}^{T} \left( P_{\text{in}} \cdot K_{\text{in}}^{(t)} + P_{\text{out}} \cdot K_{\text{out}}^{(t)} + P_{\text{cached}} \cdot K_{\text{cached}}^{(t)} \right)$$

Where:
- $K_{\text{in}}$, $K_{\text{out}}$, $K_{\text{cached}}$ represent token volumes at turn $t$.
- $P_{\text{in}}$, $P_{\text{out}}$, $P_{\text{cached}}$ represent provider pricing per thousand tokens.

---

## Fleet Benchmark Scorecard

The benchmark evaluates fleets across representative real-world engineering tasks:

| Evaluation Metric | Baseline / Target | Failing Threshold | Detection Mechanism |
| :--- | :--- | :--- | :--- |
| **Clean-Slate Invariant** | 100% | < 100% | Audit of child agent spawn payload for parent message leakage |
| **Exchange Budget Adherence** | $\le 8$ turns | > 8 turns | A2A message exchange counter in harness telemetry |
| **Token Reduction Ratio** | $\ge 80\%$ | < 70% | Automated dry-run comparison via `validate_cost_layers.py` |
| **First-Pass Pass@1** | $\ge 75\%$ | < 50% | Automated unit test suite execution inside worktree |
| **Git Safety Gate** | 0 main branch commits | > 0 | Git hook inspection verifying execution in `scratch/worktrees/` |

---

## Trajectory Telemetry Ledger Format

During benchmarking sweeps, the harness captures execution trajectories in structured JSON:

```json
{
  "task_id": "BENCH-2026-0842",
  "task_class": "bug_fix_concurrency",
  "fleet_composition": {
    "coordinator": "harness-operator",
    "specialist": "security-tooling-operator"
  },
  "metrics": {
    "dci_score": 1.0,
    "tue_score": 0.88,
    "rca_compression_pct": 84.5,
    "trajectory_tokens": {
      "input_raw": 18400,
      "input_cached": 142000,
      "output": 3400
    },
    "cost_usd": 0.084,
    "wall_clock_seconds": 38.2,
    "verdict": "SUCCESS"
  }
}
```

---

## Common Multi-Agent Failure Modes

1. **Delegation Ping-Pong**: Coordinator and subagent repeatedly pass incomplete questions back and forth without executing work, exhausting the exchange budget.
2. **Context Thrashing**: An agent attempts multiple full-file reads in a loop after receiving ambiguous error messages, pushing earlier instructions out of KV-cache.
3. **Speculative Workaround Spiral**: Faced with a failing compiler assertion, the agent comments out tests or silences linter warnings instead of identifying root causes.
4. **Premature Completion Signaling**: A specialist signals task completion before verifying that test suites pass within the isolated worktree.

---

## Related Documentation

- [Harness Engine Architecture Overview](architecture/harness-engine-overview)
- [Agent-Skill Pairing Discipline & Operator Priority](standards/agent-skill-pairing-discipline)
- [Cost Layer Validation Pipeline](supporting/cost-layer-validation-pipeline)
- [Cost Layers & Context Reduction Standard](standards/cost-layer-and-context-reduction-standard)
