# Cross-Platform Validation Plan – Phase 1A Stabilization

## Objective

Validate the LUASCRIPT runtime on Windows 11 and macOS 14 to confirm that the Phase 1A fixes (string memory tracking, recursion guards, path normalization) behave consistently across platforms.

## Test Matrix

| Platform | Node.js Version | Shell | Key Checks |
| --- | --- | --- | --- |
| Windows 11 (x64) | 18.19.x LTS | PowerShell 7 | `npm test` *(targeted suite)*, `node tests/test_memory_management.js`, manual heap snapshot, path normalization smoke test |
| macOS 14 (Apple Silicon) | 18.19.x LTS | zsh | `npm test` *(targeted suite)*, `node tests/test_memory_management.js`, manual heap snapshot, line-ending compatibility test |

## Pre-Flight Checklist

1. **Repository Sync** – `git pull --rebase origin main`
2. **Fresh Install** – `npm ci`
3. **Environment Variables** – Ensure `NODE_OPTIONS=--max-old-space-size=4096` for Windows PowerShell sessions.
4. **Line Ending Auto-Conversion** – Disable Git auto-conversion (`git config core.autocrlf false`) prior to cloning on Windows.

## Execution Steps

1. **Sanity Build**
   - `npm run build` (if available) or `npm run lint`
2. **Runtime Suite**
   - `node tests/test_memory_management.js`
3. **Targeted Test Harness**
   - `npm test` *(runs `npm run test:core` + `node tests/test_memory_management.js`)*
   - `npm run test:legacy` *(optional, legacy all-in-one harness; expect potential hang)
4. **Heap Snapshot (Optional but Recommended)**
   - Launch Node inspector: `node --inspect-brk tests/test_memory_management.js`
   - Capture snapshots before and after the string concatenation test section.
5. **Path & Line-Ending Smoke Test**
   - Transpile a JS sample residing in a path with mixed separators (e.g., `examples\\windows-path\\sample.js`).
   - Confirm generated Lua output uses `/` separators.

## Success Criteria

- All automated tests pass on both platforms without flaky failures.
- Heap utilization reported by the runtime returns to baseline after string concatenation cleanup.
- No `Out of memory` or `Stack overflow` errors when running the recursion guard tests.
- Transpiled output uses normalized `/` separators regardless of platform input.

## Platform Run Status (Oct 12, 2025)

| Platform | Owner | Status | Notes |
| --- | --- | --- | --- |
| Linux | Runtime POD (reference) | ✅ Completed | `node tests/test_memory_management.js`, `npm run test:core` (see `reports/cross_platform/2025-10-12-linux/summary.md`) |
| Windows 11 | Jamie (Team A) | ✅ Completed | `node tests/test_memory_management.js`, `npm run test:core` (see `reports/cross_platform/2025-10-12-windows/summary.md`) |
| macOS 14 | Priya (Team B) | ✅ Completed | `node tests/test_memory_management.js`, `npm run test:core` (see `reports/cross_platform/2025-10-12-macos/summary.md`) |

## Deliverables

- Update `PROJECT_STATUS.md` with a short summary of the cross-platform run.
- Archive console logs and heap snapshots in `reports/cross_platform/<date>/`.
- Maintain aggregated summary in `reports/cross_platform/PHASE1A-rollup.md` for META sign-off packets.
- Open issues for any discrepancies (attach logs, platform metadata, repro steps).

## Owners

- **Windows Lead**: Jamie (Team A)
- **macOS Lead**: Priya (Team B)
- **META Oversight**: Ada (quality gates) + Linus (runtime integrity)

## Schedule

- **Dry Run**: Next business day at 16:00 UTC
- **Official Sign-off**: Within 24 hours of dry run completion

## Post-Validation Follow-Up

1. **Consolidate Reports** – Once Windows and macOS summaries land, merge key findings into `reports/cross_platform/PHASE1A-rollup.md` and update the status grid in `PROJECT_STATUS.md` to reflect multi-platform completion.
2. **Benchmark Re-run** – Trigger the micro-benchmark harness (`npm run bench:micro` if available, else `node scripts/run_benchmarks.js`) on Linux reference hardware to confirm no regressions, then request platform leads to spot-check their fastest scenarios.
3. **Issue Triage** – Review any opened discrepancy tickets within 24 hours, assign remediation owners, and document workarounds in `docs/PHASE1A_RUNTIME_TICKETS.md`.
4. **Sign-off Package** – Prepare a short Phase 1A closure note summarizing validation metrics, attach heap snapshots/logs, and share with META oversight plus Week 6 planning distribution list.


---

Document owner: Runtime Stabilization POD · Last updated: October 12, 2025
