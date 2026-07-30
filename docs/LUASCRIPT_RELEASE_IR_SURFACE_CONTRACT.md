# LUASCRIPT Release IR Surface Contract

Status: chosen internal Denali RC contract; not a package release or public API
Contract version: `1.0.0-rc.1`
Last updated: 2026-07-29
Track: Denali canonical `1.0`, criterion `1.0-IR-SEMANTICS`

## Decision

Denali uses a versioned one-way dual-surface transition:

| Role | Surface | Version | Release meaning |
| --- | --- | --- | --- |
| Operational compiler/emitter authority | `legacy-object-tree-program` | `v0` | `CoreLanguageBridge.compileToIR` continues to return `{ kind: "Program", body: [...] }`; current emitters continue to consume this tree |
| Canonical evidence/serialization projection | `canonical-ir-schema` | `1.0.0` | The internal bridge derives a schema-valid artifact for conformance, inspection, hashing, and release evidence |
| Transition contract | `versioned-one-way-dual-surface-transition` | `1.0.0-rc.1` | Maps legacy Program IR to the canonical artifact with explicit aliases, deltas, versions, validation, migration, and deprecation rules |

This is a deliberate compatibility choice. Replacing the live Program tree before every current emitter and language gate has equivalent canonical-artifact coverage would create avoidable breakage. Treating the derived artifact as a lossless replacement would overclaim what the bridge proves. Therefore:

- legacy Program IR remains the LUASCRIPT 1.x operational surface;
- canonical artifact `1.0.0` is the versioned evidence/serialization surface;
- conversion is `legacy-to-canonical` only;
- canonical-to-legacy conversion is not provided or claimed;
- semantic equivalence and source preservation are not implied by schema validity;
- neither surface is exported from the package root by this bearing.

The machine-readable policy is `src/ir/release_ir_surface_contract.js`. The mapper and validators are `src/ir/schema_artifact_bridge.js`.

## Schema Registry

The contract binds these paths:

- latest candidate: `docs/canonical_ir.schema.json`;
- pinned Denali `1.0.0` RC snapshot: `docs/schema/1.0.0/canonical_ir.schema.json`;
- current major alias: `docs/schema/1.x/canonical_ir.schema.json`.

Before this contract was chosen, the pinned file had an unresolvable `kind` reference and had drifted behind the latest schema. Because canonical package `1.0` has not shipped, the pinned file was corrected as a pre-release RC snapshot. The gate now requires latest and pinned schemas to be semantically identical except for `$id`, compiles both with AJV, resolves the `1.x` alias against the pinned schema, and validates every derived positive fixture against all three routes.

After explicit release authorization, a versioned schema snapshot becomes immutable. Later compatible additions require a schema `MINOR`; incompatible shape or semantic changes require a schema `MAJOR`.

## Declared Kind Compatibility Encodings

These are bridge encodings, not canonical authoring equivalences:

| Legacy kind | Canonical artifact kind | Encoding and delta |
| --- | --- | --- |
| `Parameter` | `Identifier` | Retains the name in `binding`; parameter position comes from the owning function `params` list |
| `VariableDeclarator` | `VariableDeclaration` | Creates one declaration envelope; legacy declaration grouping is not reconstructed |
| `SwitchCase` | `BlockStatement` | Retains `test` and consequent `statements`; the schema has no dedicated case authoring kind |
| `UnaryExpression` | `BinaryExpression` | Prefixes `operator` with `unary:` and stores the operand as `argument`; this must not be authored or interpreted as an ordinary binary expression |

Every encoding is marked `reversible: false`. Adding, removing, or changing an encoding requires a transition-contract version change, migration note, claims update, and compatibility evidence.

## Declared Field Encodings

| Legacy field | Canonical field | Scope |
| --- | --- | --- |
| `varKind` | `declarationKind` | variable declarators |
| `parameters` | `params` | function declarations |
| `value` | `argument` | return statements |
| `condition` | `test` | if, for, while, do-while, and conditional expressions |
| `operand` | `argument` | unary-expression compatibility encoding |
| `args` | `arguments` | calls |

The mapper fails closed if code attempts to record an undeclared field alias or if a kind alias targets a kind absent from the active schema enum.

## Validation Contract

`npm run test:ir-compatibility-bridge` proves the following for the current conformance manifest:

Current seal: 21/21 positive mappings, 168/168 base invariants, 10/10 static contract rules, 147/147 mapping-contract rules, 21/21 deterministic artifacts, 1/1 supplemental DoWhile shape proof, 12/12 malformed-shape negatives, 5/5 malformed-source rejections, and 11 expected diagnostics.

- all positive fixtures retain legacy root kind `Program`;
- derived artifacts validate against latest, pinned `1.0.0`, and the resolved `1.x` alias;
- node IDs and references resolve;
- no mapped kind is undeclared;
- transition version/surface markers are present;
- every emitted alias belongs to the exact policy registry;
- each currently promoted original kind satisfies an original-kind-aware required-field policy;
- repeated conversion of identical input and options produces identical artifact bytes;
- malformed BinaryExpression, Parameter, VariableDeclarator, SwitchCase, UnaryExpression, and unknown-original-kind cases fail the release-shape validator;
- low-level bridge helpers and the contract remain absent from the package root exports.

The JSON Schema remains intentionally broader than the original-kind-aware release projection validator. Passing AJV alone is not sufficient evidence for semantic validity. The combined schema, reference, alias, shape, determinism, and negative checks are the scoped Denali RC gate for current fixtures; they are not a universal IR validator.

## Migration

Existing compiler, emitter, and package consumers require no migration:

- continue using `CoreLanguageBridge.compileToIR` and existing emitters with legacy Program IR;
- do not reinterpret existing transpilation result `.ir` fields;
- internal evidence tooling may call `legacyProgramToSchemaArtifact` to obtain the canonical projection;
- new artifact consumers must read `schemaVersion`, transition metadata, and declared alias deltas;
- no consumer should expect automatic canonical-to-legacy conversion.

Unsupported original kinds fail the release-shape contract until an explicit mapping and shape policy are added.

## Deprecation

Legacy Program IR is not deprecated for LUASCRIPT `1.0` and remains supported throughout package `1.x`. It cannot be removed before package `2.0.0`, and removal additionally requires:

1. canonical-artifact consumer and emitter coverage for every promoted node;
2. migration tooling and release notes;
3. compatibility evidence for all supported language slices;
4. explicit operator authorization for a breaking release.

No runtime deprecation warning is added by this contract.

## Boundaries And Remaining Work

This bearing does not:

- change `CoreLanguageBridge.compileToIR` output;
- change compiler or emitter behavior outside correcting the derived conditional-expression projection;
- expose a package-root IR API or repair unrelated `src/ir/index.js` deep-import issues;
- provide reverse conversion;
- prove arbitrary caller-authored artifacts, broad semantic equivalence, or source preservation;
- bump `luascript@0.1.0-beta.0`, tag, publish, or release anything.

`1.0-IR-SEMANTICS` remains open for broader value/error semantics, target delta tables, and release-blocking policy. The release-IR surface choice itself is closed by this contract, subject to the current gate and explicit release authorization.
