# LUASCRIPT Denali v1.0.1

Release date: 2026-07-30
Release track: stable Denali
Package identity: `luascript@1.0.1`

## Why v1.0.1

The repository already contains the historical `v1.0.0` tag. Denali preserves
that history and uses `v1.0.1` as the first release governed by the current
evidence-based contracts. The version does not endorse the older tag's broad
claims.

## What Denali Seals

- A versioned one-way dual-surface IR transition that keeps the working legacy
  IR intact while validating schema artifacts.
- The six-name root package export surface, `src/unified_luascript.js`
  entrypoint, no npm `bin`, no package `exports` map, Node `>=14.17.0`, exact
  `typescript@5.9.3` runtime dependency, and deliberate exclusion of root-level
  `runtime/`.
- A current-host compatibility matrix for 17 named native lanes and 317
  fixtures, plus 26 schema-v2 language reports covering 424 fixtures.
- The seven-fixture round-trip probe: five structural IR reparse cases and two
  runtime-equivalence cases.
- The 15-fixture source-identity probe: 12 normalized identity cases and three
  expected diagnostics.
- A deterministic, fail-closed 26-step release-candidate preflight and
  hash-bound release-evidence bundle.

## Boundaries

Denali is a stable release of the named, tested surfaces. It is not a claim of
lossless universal translation, broad source/token/comment identity,
cross-platform certification, third-party certification, or complete language
coverage beyond the named slices. Repository-local examples and actual-program
fixtures are evidence, not additional installed-package promises.

The npm registry package name was previously unpublished and this machine is
not authenticated to npm. Therefore this release is distributed through the
versioned local build and GitHub release; npm registry publication is
explicitly not claimed.

## Reproduce And Verify

```text
npm ci
npm run denali:rc:preflight
npm run release:verify:denali
```

The local release is written to `builds/denali/v1.0.1/`. Its
`release-manifest.json` binds the Git commit, tag, package, evidence identities,
and every payload artifact. `SHA256SUMS` independently verifies the copied
evidence, source archive, npm tarball, and release documentation.

## Migration

Read [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](../LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md)
before adopting Denali, especially if a consumer uses Node 14.0 through 14.16,
deep-imports implementation files, relies on root-level `runtime/`, or assumes
a global CLI.
