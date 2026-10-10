---
title: Headroom Token Compression Guide
slug: supporting/headroom-token-compression-guide
section: supporting
subsection: Tools
severity: info
owner: core-harness-team
updated: 2026-10-10
reviewed: 2026-10-10
summary: >-
  Using Headroom and tool output summarization to compress bulky CLI outputs, test logs, and build traces before feeding into parent context.
tags:
  - supporting
  - headroom
  - compression
  - token-budget
related:
  - standards/context-management-standard
  - architecture/context-firebreaks-and-prompt-caching
---

# Headroom Token Compression Guide

`Headroom` is an output compression layer that intercepts verbose command output (test runners, compilation logs, linting results) and eliminates redundant repetition while preserving error messages, exit codes, and stack traces.

> [!TIP]
> Pipe long command outputs into Headroom or use `scripts/_lib/tool_output.py` to prevent filling context windows with thousands of lines of passing test logs.

## Usage Examples

### 1. Test Suite Execution
```bash
pytest tests/ | headroom --preserve-errors
```

### 2. Python Script Integration
```python
from _lib.tool_output import compress_output

raw_log = run_test_suite()
compressed = compress_output(raw_log, max_lines=40)
print(compressed)
```

## Key Benefits

- Reduces test log token weight by 70% to 95%.
- Guarantees error lines and stack traces are highlighted.
- Keeps parent agent context clean for strategic decisions.
