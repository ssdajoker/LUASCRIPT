# Harness Dashboard (stub)

This dashboard captures IR harness health over time. CI uploads `artifacts/harness_results.json` on harness runs; aggregate these per commit to track regressions.

## Suggested fields per entry
- commit: git SHA
- conclusion: success|failure
- slowest_case_ms: number
- cases: count
- timestamp: ISO8601
- run_url: link to workflow run

## How to update (CI-friendly)
1. After a harness run, parse `artifacts/harness_results.json`.
2. Append a line to this file (or another store) with the fields above.
3. Commit only curated history; artifacts remain untracked.

## Current status
- (populate via CI once available)
