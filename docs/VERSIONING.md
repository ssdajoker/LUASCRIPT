# Canonical IR Versioning Policy

Status: active IR schema support reference for the stable Denali contract. This policy governs `schemaVersion`; package semver remains governed by [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). Released consumer changes live in [LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md](LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md) and `CHANGELOG.md`. The frozen internal transition is [LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md](LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md).

Canonical URL for the JSON Schema:

- Latest (v1): [canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/heads/main/docs/canonical_ir.schema.json)
- Pinned immutable Denali snapshot: [1.0.0 canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/tags/v1.0.1/docs/schema/1.0.0/canonical_ir.schema.json)

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
  - The released `docs/schema/1.0.0/` snapshot is immutable.
  - After that freeze, never rewrite the versioned snapshot; compatible additions require a new MINOR/PATCH path and incompatible changes require a new MAJOR path.
  - Keep docs/schema/1.x/canonical_ir.schema.json pointing at the current supported pinned `1.x` snapshot and verify the reference resolves.
  - Update docs/canonical_ir_spec.md Status and Schema links on every release.

The existing `docs/schema/1.0.0/` file is the immutable Denali schema snapshot.
The RC transition gate corrected its previously unresolvable `kind` reference
and brought it to semantic parity before the snapshot was frozen by package
release `1.0.1`.
