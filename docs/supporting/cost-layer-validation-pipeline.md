---
title: Cost Layer Validation Pipeline & Token Metrics
slug: supporting/cost-layer-validation-pipeline
section: supporting
subsection: Tooling
severity: medium
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Operational guide for orchestrating automated cost-layer validation sweeps, measuring token reduction ratios across AST extraction, search index retrieval, and output compression.
tags:
  - supporting
  - cost-layers
  - dry-run
  - validation-pipeline
  - token-metrics
related:
  - standards/cost-layer-and-context-reduction-standard
  - supporting/headroom-token-compression-guide
  - supporting/ast-grep-symbol-exploration-pattern
---

# Cost Layer Validation Pipeline & Token Metrics

Without continuous empirical measurement, context reduction mechanisms silently degrade. A minor change to system prompts can invalidate prompt caching prefixes; an unescaped wildcard can turn an AST query into a multi-megabyte file dump; or a logging change can bypass output stream compression.

The **Cost Layer Validation Pipeline** (`validate_cost_layers.py`) automates end-to-end measurement sweeps across all four context layers, calculating exact token consumption, compression ratios, and cache hit rates.

> [!NOTE]
> The validation pipeline operates non-destructively in dry-run mode and writes immutable metric ledgers to `results/cost-layers/combined/<YYYY-MM-DD>/` during scheduled audits.

---

## Validation Pipeline Architecture

```
┌────────────────────────────────────────────────────────┐
│             Pipeline Runner: validate_cost_layers.py   │
└───────────────────────────┬────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│ ast-grep Sweep   │ │  QMD Search   │ │ Headroom Stream  │
│ - Parse syntax   │ │ - Vector/BM25 │ │ - CLI dump test  │
│ - Extract AST    │ │ - Section get │ │ - Trace truncate │
│   symbol outline │ │   chunks      │ │ - Exit-code keep │
└──────────┬───────┘ └───────┬───────┘ └────────┬─────────┘
           │                 │                  │
           └────────────────┼──────────────────┘
                            │ Raw vs. Compressed Token Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│             Token Aggregator & Ledger Builder          │
│ - Computes Token Reduction Ratio                       │
│ - Validates Information Preservation Invariants        │
│ - Prunes historical runs older than retention window   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Output Ledger: results/cost-layers/combined/<date>/    │
└────────────────────────────────────────────────────────┘
```

---

## Metric Formulas & Targets

The pipeline evaluates every cost layer against explicit mathematical thresholds:

### 1. Token Reduction Ratio ($R_{token}$)
Measures the percentage of token volume eliminated before ingestion into the parent context:

$$R_{token} = \left( 1 - \frac{T_{compressed}}{T_{raw}} \right) \times 100\%$$

- **Target Threshold**: $\ge 80\%$ reduction across code dumps and build traces.

### 2. Prompt Cache Hit Ratio ($R_{cache}$)
Measures the proportion of the input prompt successfully served from model KV-cache:

$$R_{cache} = \left( \frac{T_{cached}}{T_{prompt}} \right) \times 100\%$$

- **Target Threshold**: $\ge 75\%$ for multi-turn coordinator sessions.

### 3. Structural Information Fidelity ($F_{info}$)
Binary gate verifying that critical execution signals are preserved post-compression:
- Exit code ($0$ or non-zero) explicitly retained.
- Stack trace root cause and failing assertion present in tail slice.
- Top-level symbol signatures preserved during AST extraction.

---

## CLI Execution & Options

```bash
# Execute standard validation sweep in dry-run mode
python scripts/cost-layers/validate_cost_layers.py --dry-run

# Run full evaluation and write ledger to specific destination
python scripts/cost-layers/validate_cost_layers.py --out results/cost-layers/combined/2026-10-10/report.json

# Run sweep while retaining only the 3 most recent benchmark runs
python scripts/cost-layers/validate_cost_layers.py --retain 3
```

| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--dry-run` | Flag | `False` | Computes token metrics without committing ledger files to disk. |
| `--out` | Path | `results/cost-layers/...` | Output JSON file path for benchmark telemetry. |
| `--retain` | Integer | `3` | Number of previous daily baseline directories to retain before auto-pruning. |

---

## Benchmark Ledger Schema

The pipeline produces structured JSON reports enabling automated regression detection in CI/CD:

```json
{
  "timestamp": "2026-10-10T14:32:00Z",
  "harness_version": "2.4.0",
  "summary": {
    "total_raw_tokens": 142500,
    "total_compressed_tokens": 18200,
    "overall_reduction_pct": 87.23,
    "verdict": "PASS"
  },
  "layers": {
    "layer_1_qmd": {
      "raw_tokens": 42000,
      "retrieved_tokens": 3100,
      "reduction_pct": 92.62,
      "query_latency_ms": 42
    },
    "layer_2_ast_grep": {
      "raw_file_tokens": 68000,
      "outline_tokens": 7400,
      "reduction_pct": 89.12,
      "symbols_indexed": 128
    },
    "layer_3_headroom": {
      "raw_stdout_tokens": 32500,
      "compressed_tokens": 7700,
      "reduction_pct": 76.31,
      "trace_fidelity_verified": true
    }
  }
}
```

> [!TIP]
> Integrate the validation pipeline into pull request workflows. If an agent modification drops overall token reduction below 80%, the CI check fails automatically, preventing expensive context leaks from landing on `main`.

---

## Historical Baseline Pruning

To keep the repository clean and avoid accumulating megabytes of historical benchmark JSONs, the pipeline enforces a sliding window policy:

```python
def prune_old_baselines(combined_root: Path, retain_count: int = 3) -> list[str]:
    """Prune older dated run directories, retaining the most recent N."""
    if not combined_root.is_dir() or retain_count <= 0:
        return []
    dated_dirs = [
        d for d in combined_root.iterdir()
        if d.is_dir() and re.match(r"^\d{4}-\d{2}-\d{2}$", d.name)
    ]
    dated_dirs.sort(key=lambda p: p.name)
    removed = []
    if len(dated_dirs) > retain_count:
        for d in dated_dirs[:-retain_count]:
            shutil.rmtree(d, ignore_errors=True)
            removed.append(d.name)
    return removed
```

---

## Related Documentation

- [Cost Layers & Context Reduction Standard](standards/cost-layer-and-context-reduction-standard)
- [Headroom Token Compression Guide](supporting/headroom-token-compression-guide)
- [ast-grep Symbol Exploration Pattern](supporting/ast-grep-symbol-exploration-pattern)
- [Context Firebreaks & Prompt Caching](architecture/context-firebreaks-and-prompt-caching)
- [Multi-Agent Fleet Benchmarking Methodology](references/multi-agent-fleet-benchmarking-methodology)
