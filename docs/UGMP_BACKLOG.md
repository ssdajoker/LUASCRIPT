# UGMP Issues Backlog (Epics → Stories → Tasks)

This backlog is derived from docs/UGMP.md. Each item includes owner placeholders and evidence links back to audit artifacts.

## Epic A: Canonical IR

- Story A1: JSON Schema + validator (Owner: IR Lead)
  - [ ] Task A1.1: Author `docs/canonical_ir.schema.json` and validate draft IR — Evidence: docs/canonical_ir_spec.md
  - [ ] Task A1.2: Integrate AJV validator; CI job `ir:validate` — Evidence: audit/quality_report.md
  - [ ] Task A1.3: Golden IR snapshots in `tests/golden_ir/*.json` — Evidence: docs/UGMP.md §5, §13

- Story A2: IR Builder API (Owner: IR Lead)
  - [ ] Task A2.1: Balanced‑ternary id generator and utilities — Evidence: tests/ir/builder.test.js
  - [ ] Task A2.2: Span propagation and immutable nodes — Evidence: docs/canonical_ir_spec.md (Base Node Contract)
  - [ ] Task A2.3: Error messages and docs with examples — Evidence: docs/README.md

## Epic B: Parser → IR Lowering

- Story B1: ESTree AST generation (Owner: Parser Lead)
  - [ ] Task B1.1: Parser normalization (scopes, comments) — Evidence: docs/UGMP.md §6
  - [ ] Task B1.2: Establish deterministic ordering guarantees — Evidence: docs/canonical_ir_spec.md

- Story B2: Deterministic lowering (Owner: Parser Lead)
  - [ ] Task B2.1: Lowering rules coverage map — Evidence: audit/implementation_map.json
  - [ ] Task B2.2: Wire CFG references in IR meta — Evidence: docs/canonical_ir_spec.md (CFG)

## Epic C: Emitters & Parity

- Story C1: Lua emitter consumption (Owner: Runtime Lead)
  - [ ] Task C1.1: Map IR nodes to Lua constructs — Evidence: docs/canonical_ir_spec.md
  - [ ] Task C1.2: Golden diff parity tests vs WASM — Evidence: docs/UGMP.md §9

- Story C2: WASM emitter consumption (Owner: Systems Lead)
  - [ ] Task C2.1: WASM backend harness — Evidence: ../luascript_upstream/src/wasm_backend.js
  - [ ] Task C2.2: Differential parity tests — Evidence: ../luascript_upstream/audit_upstream/tests_report.md

## Epic D: Optimization & QA

- Story D1: Core passes (Owner: Perf Lead)
  - [ ] Task D1.1: Constant folding and DCE — Evidence: docs/UGMP.md §7
  - [ ] Task D1.2: Inlining thresholds and loop opts — Evidence: docs/UGMP.md §7

- Story D2: Golden snapshots + diff harness (Owner: QA Lead)
  - [ ] Task D2.1: Snapshot diff tool and CI gate — Evidence: docs/UGMP.md §13
  - [ ] Task D2.2: Reproducibility job for determinism — Evidence: docs/UGMP.md §14

## ADRs & Governance

- [ ] Task G1: Mirror ADR 0001/0002 upstream (Owner: Architecture) — Evidence: audit/adr_index.csv, audit/diff_upstream_report.md
- [ ] Task G2: Add policy for schema version bumps (Owner: Architecture) — Evidence: docs/canonical_ir_spec.md (Validation Strategy)

## Risks & Mitigations

- [ ] Task R1: CI license scanning for dependencies — Evidence: audit/deps_report.md
- [ ] Task R2: Perf budget alerts in CI — Evidence: docs/UGMP.md §13

Owners to be filled: Parser Lead (TBD), IR Lead (TBD), Runtime Lead (TBD), Systems Lead (TBD), Perf Lead (TBD), QA Lead (TBD), Architecture (TBD).
