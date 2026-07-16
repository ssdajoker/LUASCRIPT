# Baseline Merge Review Manifest

Last updated: 2026-04-29

This manifest summarizes the current large cleanup and language-hardening worktree so the change set can be reviewed and merged without relying on stale root reports.

## Worktree Shape

- Visible changes before this manifest was added: 420.
- Visible changes after this manifest was added: 421.
- Modified tracked files: 52.
- Deleted tracked old active-path files: 271.
- Untracked files and directories: 97.
- No files were staged or committed as part of this pass.

## Archive Accounting

- Archive authorities:
  - `docs/OLD&Deprecated/ARCHIVE_MANIFEST.md`
  - `docs/OLD&Deprecated/ARCHIVE_RECONCILIATION.md`
- Deleted active-path files accounted for by archive reconciliation: 271.
- Preserved under `docs/OLD&Deprecated/`: 270.
- Intentional non-archive relocation: `examples/mathematical_showcase.ls` moved to `examples/experimental/mathematical_showcase.ls`.
- Current rule: active docs and package scripts must not point at archived content except through archive manifest or reconciliation references.

## Active Additions To Review

- Unified live Clarity Canon harness and reports:
  - `tests/clarity_canon/dogfood_harness.js`
  - `tests/clarity_canon/canon_harness.js`
  - `tests/clarity_canon/language_qualification_harness.js`
  - `tests/clarity_canon/runner_utils.js`
- Strict cleanup/accounting gates:
  - `scripts/archive_audit.js`
  - `scripts/stub_inventory.js`
  - `scripts/context_pack.js`
- Language completion harness and manifests:
  - `tests/language_completion/bidirectional_harness.js`
  - `tests/language_completion/manifests/*.json`
  - `tests/language_completion/fixtures/**`
- Lua and Python requalification work:
  - Lua input V1 tests and fixtures.
  - Python V1.2 bidirectional fixtures, emitters, diagnostics, and reverse fixtures.
- Baseline fixture work:
  - Actual-program fixtures.
  - Supported math showcase.
  - Mirror fixture rewrites used by `clarity:dogfood`.
- Package-script/reference repairs:
  - `tests/modern-js/modern.test.js`
  - `scripts/context_pack.js`

## Ignored Local Or Generated Debris

These are intentionally not treated as reviewable source:

- Repo-root `Python/`.
- Empty root `Files`.
- `context_memory/`.
- `sessions/`.
- `artifacts/language_completion/`.
- `tests/ir/artifacts/`.

## Ruby V1 Requalification Decision

Ruby remains experimental. The local runtime probe did not find `ruby` on `PATH`, so `language:ruby:bidirectional` must remain a setup-blocked strict failure instead of a skipped or fake-passing gate.

Next Ruby work starts only after a Ruby runtime is available locally. At that point the V1 manifest should add real native Ruby execution, canonical IR lowering, Lua/JavaScript/LUASCRIPT/Python or same-language output checks as applicable, and unsupported-feature diagnostics.

## Required Verification For Merge Review

- `npm run archive:audit`
- `npm run status:check`
- `npm run stubs:check`
- `npm run verify`
- `npm test`
- `npm run clarity:languages`
- `npm run clarity:dogfood`
- `npm run clarity:canon`

Expected setup-blocked check:

- `npm run language:ruby:bidirectional` fails nonzero with a Ruby runtime/setup diagnostic until Ruby is installed and real V1 fixtures are implemented.
