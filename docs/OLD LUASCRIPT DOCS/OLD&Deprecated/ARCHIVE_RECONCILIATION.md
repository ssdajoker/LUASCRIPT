# Archive Reconciliation

Generated: 2026-04-29

This note explains the cleanup pass after the archive move left a large dirty worktree.

## Result

- 271 tracked files are deleted from their old active locations.
- 270 of those deleted files now have preserved copies under `docs/OLD&Deprecated/`.
- 244 preserve their original relative path directly under the archive.
- 26 Clarity/Super Canon report-era files are intentionally grouped under `docs/OLD&Deprecated/clarity-canon/`.
- The remaining deleted active-path file is `examples/mathematical_showcase.ls`, which is preserved as `examples/experimental/mathematical_showcase.ls` because it is quarantined experimental source, not deprecated documentation.

## Additional Cleanup

- Recovered deleted root-level historical/debug test scripts into `docs/OLD&Deprecated/`.
- Moved untracked phase-report and forensic root scripts into `docs/OLD&Deprecated/`.
- Added local/runtime generated debris to `.gitignore`: repo-root `Python/`, empty `Files`, `context_memory/`, `sessions/`, `artifacts/language_completion/`, and `tests/ir/artifacts/`.

## Current Rule

Archived files are preserved as historical evidence only. Current implementation truth lives in `PROJECT_STATUS.md`, `docs/LUASCRIPT_MEGA_PLAN.md`, `docs/LANGUAGE_SUPPORT_MATRIX.md`, and the strict npm gates.
