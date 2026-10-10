# Repository AGENTS

Canonical rules for AI agents modifying this repository. Ranked **critical → high → medium → low**.

## Critical

- **Zero External Build Step**: The static web application under `docs/` must remain zero-compilation (browser-native React 18 and Babel standalone). Do not introduce Webpack, Vite, or required npm dependencies.
- **Sensitive Data & Credential Gate**: Never commit real credentials, API tokens, employee names, or internal corporate data. All sample configurations must use synthetic placeholders.
- **Root-Cause Problem Solving**: Never bypass linter or validation failures. If `validate-content.mjs` fails, resolve the underlying frontmatter or slug issue.

## High

- **Manifest Sync Contract**: Every change to Markdown articles must be verified with:
  ```bash
  node docs/scripts/validate-content.mjs
  node docs/scripts/build-manifest.mjs
  node docs/scripts/sync-site-content.mjs
  ```
- **Markdown Integrity**: Frontmatter in Markdown articles must follow standard YAML schemas (`title`, `slug`, `section`, `severity`, `owner`, `updated`, `summary`).
- **Conventional Commits**: Commit messages must follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Medium

- Use kebab-case for all filenames and slugs.
- Prefer updating existing documentation over creating duplicates.
