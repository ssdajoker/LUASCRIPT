# Canonical IR Versioning Policy

Status: active IR schema support reference for the Denali RC contract. This policy governs `schemaVersion`; it is not a LUASCRIPT package release policy and does not change the package/runtime contract in [../PROJECT_STATUS.md](../PROJECT_STATUS.md). Package semver, public API, runtime, and release-action expectations live in [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md); unreleased package consumer changes live in [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md) and `CHANGELOG.md`. The chosen internal transition is [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md).

Canonical URL for the JSON Schema:

- Latest (v1): [canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/heads/main/docs/canonical_ir.schema.json)
- Pinned Denali RC snapshot: [1.0.0 canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/heads/main/docs/schema/1.0.0/canonical_ir.schema.json)

Policy:

- schemaVersion: MAJOR.MINOR.PATCH
  - MAJOR (v2.0.0): Backward-incompatible changes to the IR shape or semantics.
  - MINOR (v1.1.0): Backward-compatible additions (e.g., new node kinds/fields with defaults).
  - PATCH (v1.0.1): Bug fixes to schema or clarifications that do not change accepted IR.

- Bump rules:
  - Adding a new node kind → MINOR
  - Making a previously optional field required → MAJOR
  - Tightening numeric ranges or enum values → MAJOR
  - Allowing additional properties or documenting defaults → MINOR/PATCH

- Repository process:
  - Keep docs/canonical_ir.schema.json as the moving latest for the current MAJOR.
  - Before explicit release authorization, a versioned Denali RC snapshot may be corrected, but latest and pinned files must remain semantically identical except for `$id`, and the compatibility gate must compile and validate both.
  - On explicit schema/package release authorization, freeze the versioned snapshot immutably in docs/schema/\<version\>/ and update `$id`.
  - After that freeze, never rewrite the versioned snapshot; compatible additions require a new MINOR/PATCH path and incompatible changes require a new MAJOR path.
  - Keep docs/schema/1.x/canonical_ir.schema.json pointing at the current supported pinned `1.x` snapshot and verify the reference resolves.
  - Update docs/canonical_ir_spec.md Status and Schema links on every release.

The existing `docs/schema/1.0.0/` file is a pre-release Denali RC snapshot because LUASCRIPT canonical `1.0` has not been released. The `1.0.0-rc.1` transition gate corrected its previously unresolvable `kind` reference and brought it to semantic parity with the latest candidate. This correction is not a package version bump, tag, publish, or release.
