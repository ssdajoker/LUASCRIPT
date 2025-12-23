# Artifacts layout

Generated outputs are collected under `artifacts/` to keep the workspace clean and make CI uploads consistent:

- `artifacts/coverage/` — coverage reports from `npm run test:coverage`/`npm run coverage:full` (JSON, LCOV, HTML).
- `artifacts/.nyc_output/` — temporary coverage data used while generating reports.
- `artifacts/test/` — structured test outputs such as `harness_results.json` (mirrors the legacy `artifacts/harness_results.json`).
- `artifacts/lint/` — optional lint logs collected by CI steps.
- `artifacts/tmp/` — scratch space for ad-hoc runs; safe to delete.

Use `npm run clean:artifacts` to remove generated artifact directories without touching the curated files in this folder.
