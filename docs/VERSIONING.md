# Canonical IR Versioning Policy

Canonical URL for the JSON Schema:

- Latest (v1): [canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/heads/main/docs/canonical_ir.schema.json)
- Frozen release: [1.0.0 canonical_ir.schema.json](https://raw.githubusercontent.com/ssdajoker/LUASCRIPT/refs/heads/main/docs/schema/1.0.0/canonical_ir.schema.json)

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
  - For each release, copy the schema into docs/schema/\<version\>/ and update $id.
  - Update docs/canonical_ir_spec.md Status and Schema links on every release.
