---
title: Cost Layers & Context Reduction Standard
slug: standards/cost-layer-and-context-reduction-standard
section: standards
subsection: Cost
severity: high
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Standardized four-layer context reduction architecture enforcing AST structural exploration, semantic markdown discovery, output compression, and prompt caching invariants.
tags:
  - standards
  - cost-layers
  - tokens
  - prompt-caching
  - ast-grep
related:
  - architecture/context-firebreaks-and-prompt-caching
  - supporting/ast-grep-symbol-exploration-pattern
  - supporting/headroom-token-compression-guide
  - supporting/qmd-markdown-discovery-pattern
---

# Cost Layers & Context Reduction Standard

In autonomous agent harnesses, indiscriminate ingestion of raw source code, voluminous build traces, and redundant chat histories degrades model reasoning, triggers the "needle-in-a-haystack" attention collapse, and dramatically inflates inference costs.

The **Cost Layers & Context Reduction Standard** mandates an operational defense-in-depth architecture. All file exploration, documentation lookup, command execution, and subagent dispatching must pass through four standardized context-reduction layers.

> [!IMPORTANT]
> **Normative Directive**: Agents MUST NOT perform unconstrained full-file reads or dump large terminal outputs into the context window. File inspection must follow an Outline-First strategy, and command outputs exceeding 2,000 characters must undergo deterministic compression.

---

## The Four Cost Layers

The harness organizes context filtering into four distinct stages:

```
┌────────────────────────────────────────────────────────┐
│                   File & Knowledge Discovery           │
├───────────────────────────┬────────────────────────────┤
│ Layer 1: Markdown Search  │ Layer 2: Structural Code   │
│ - QMD Vector/BM25 Index   │ - ast-grep Outline First   │
│ - Sectional Extraction    │ - Line-Bounded Reads       │
└───────────────────────────┴────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Command Execution                    │
├────────────────────────────────────────────────────────┤
│ Layer 3: Output Stream Compression (Headroom)          │
│ - Head/Tail preservation of failure traces             │
│ - Elimination of repetitive progress spinners & logs   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Subagent Dispatch                    │
├────────────────────────────────────────────────────────┤
│ Layer 4: Deterministic Prompt Caching                  │
│ - Static prefix anchoring (immutable rules)            │
│ - Clean-slate spawn boundaries (`fork_turns: "none"`)  │
└────────────────────────────────────────────────────────┘
```

---

## Layer Specifications & Token Reduction Targets

| Layer | Primary Tooling | Content Type | Typical Token Reduction | Mandatory Rule / Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Layer 1: Markdown Discovery** | QMD (`qmd search`, `qmd get`) | Documentation, standards, reference manuals | 80% – 95% | Never dump entire markdown manuals. Extract only the targeted section or paragraph. |
| **Layer 2: AST Structural Exploration** | `ast-grep outline`, `ast-grep scan` | Source code files (.py, .ts, .go, .rs) | 75% – 90% | Run `ast-grep outline` first. Inspect symbol signatures, then use line-bounded reads (`StartLine`/`EndLine`). |
| **Layer 3: Output Stream Compression** | Headroom, `tool_output.py` | Build logs, test outputs, package installations | 85% – 98% | Compress outputs exceeding 2,000 characters. Preserve exit code, assertion, and root cause trace. |
| **Layer 4: Prompt Caching & Firebreaks** | Native KV caching, `fork_turns: "none"` | System prompts, subagent task delegations | 60% – 85% | Anchor immutable root directives in prompt prefix. Never propagate parent conversation turn history to subagents. |

---

## Operational Protocols

### Protocol 1: Outline-First Code Exploration
When investigating code behavior, agents must not dump the entire target file. Instead, the agent follows a two-step pattern:

```bash
# Step 1: Extract structural symbols (functions, classes, methods)
ast-grep outline --format json src/services/auth.py

# Step 2: Read strictly the lines containing the target implementation
# (e.g. StartLine: 142, EndLine: 185)
```

### Protocol 2: Sectional Subtree Extraction for Markdown
When searching documentation, agents query the QMD index rather than loading entire specification files:

```bash
# Step 1: Search index for target topic
qmd search "worktree archive retention policy"

# Step 2: Ingest only the specific anchor or heading
qmd get standards/worktree-isolation-and-branch-lifecycle.md#non-destructive-post-merge-archiving
```

### Protocol 3: Streamlined Command Output Wrapping
Commands executed by agents must be wrapped with automated token estimation and compression logic:

```python
def format_command_output(stdout: str, stderr: str, exit_code: int) -> dict:
    combined = f"{stdout}\n{stderr}".strip()
    est_tokens = len(combined) // 4
    
    if est_tokens <= 500:
        return {"output": combined, "compressed": False, "est_tokens": est_tokens}
    
    # Compress bulky outputs: retain head (setup), tail (errors), and exit status
    head = combined[:800]
    tail = combined[-1200:]
    compressed_text = (
        f"{head}\n\n[... {len(combined) - 2000} characters compressed by Headroom ...]\n\n{tail}"
        f"\n\n[Exit Code: {exit_code}]"
    )
    return {
        "output": compressed_text,
        "compressed": True,
        "est_tokens": len(compressed_text) // 4,
    }
```

---

## Validation & Benchmarking

The harness includes an automated cost-layer validation pipeline (`validate_cost_layers.py`) that computes savings metrics across test suites and repository operations:

```bash
python scripts/cost-layers/validate_cost_layers.py --dry-run
```

The pipeline outputs structured JSON recording raw versus compressed token usage, validating that reduction thresholds meet or exceed 80%.

> [!TIP]
> Periodically run cost-layer benchmarks before and after updating agent prompts to identify regression in prompt caching efficiency or accidental context bloat.

---

## Anti-Patterns & Gate Rules

- **Zero Full-Dump Policy**: Initiating a file read on a file larger than 300 lines without a preceding symbol search or line bound violates harness policy.
- **No Recursive Transcripts**: Passing full conversation histories into subagents defeats prompt caching and forces models to pay quadratic input token costs.
- **No Unfiltered Test Runs**: Running full test suites without `--quiet` or tool output compression quickly floods parent context with passing test names.

---

## Related Documentation

- [Context Firebreaks & Prompt Caching](architecture/context-firebreaks-and-prompt-caching)
- [ast-grep Symbol Exploration Pattern](supporting/ast-grep-symbol-exploration-pattern)
- [Headroom Token Compression Guide](supporting/headroom-token-compression-guide)
- [QMD Markdown Discovery Pattern](supporting/qmd-markdown-discovery-pattern)
- [Cost Layer Validation Pipeline](supporting/cost-layer-validation-pipeline)
