# LUASCRIPT Documentation Index

Status: active
Last updated: 2026-07-16

The root status source of truth is [PROJECT_STATUS.md](../PROJECT_STATUS.md). The beta release handoff artifact is [BETA_RELEASE_HANDOFF_V0_1.md](BETA_RELEASE_HANDOFF_V0_1.md). The original expedition guide is [LUASCRIPT_DENALI_SOLOIST_LEDGER.md](LUASCRIPT_DENALI_SOLOIST_LEDGER.md). The post-beta 1.0 route book is [LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md). The Big Remaining Climb master ledger is [LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md). The bidirectionality contract is [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md). Language depth accession rules are [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md). The public API/runtime contract is [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). The conformance evidence binder is [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md), and the release-shaped evidence bundle index is [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md). The detailed canonical roadmap and support-tier plan is [LUASCRIPT_MEGA_PLAN.md](LUASCRIPT_MEGA_PLAN.md).

This page is the canonical active-docs map. Everything else under `docs/` is deprecated unless it appears in the active list or support-reference list below. `npm run archive:audit` is expected to fail if the live docs surface drifts, and `npm run status:check` guards this map from disappearing out of README, project status, or the archive root.

## Start Here

- [Denali Soloist Ledger](LUASCRIPT_DENALI_SOLOIST_LEDGER.md)
- [Denali 1.0 Summit Ledger](LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md)
- [Big Remaining Climb Master Ledger](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md)
- [Canonical 1.0 Exit Criteria Charter](LUASCRIPT_1_0_EXIT_CRITERIA.md)
- [Bidirectionality Contract](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)
- [Canonical IR Semantics Inventory](LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)
- [Canonical IR Semantics Spec v0](LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)
- [Language Depth Accession Rules](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md)
- [Public API And Runtime Contract](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- [Conformance Evidence Binder](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)
- [Conformance Evidence Bundle Index](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md)
- [Beta Release Handoff v0.1](BETA_RELEASE_HANDOFF_V0_1.md)
- [Mega Plan](LUASCRIPT_MEGA_PLAN.md)
- [Project Status](../PROJECT_STATUS.md)
- [Quick Start](quick-start/README.md)
- [Architecture](architecture/README.md)
- [Reference](reference/README.md)
- [Language Support Matrix](LANGUAGE_SUPPORT_MATRIX.md)
- [Language Completion Rules](LANGUAGE_COMPLETION_RULES.md)
- [LuaScript Living Meta-Language](LUASCRIPT_LIVING_META_LANGUAGE.md)
- [LuaScript Meta-Language V0.16](LUASCRIPT_META_LANGUAGE_V0.md)
- [Mathematical Notation Core And Rehab V18](LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md)
- Public API/runtime contract: [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md) defines package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries for real `1.0`; its 2026-07-16 no-release freeze candidate records no package `exports` map, no npm `bin`, no global CLI, root-level `runtime/` outside package `files`, and no version bump or publish action.
- Conformance evidence binder: [LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md) organizes gates, reports, conformance suites, support matrix traceability, known unsupported areas, compatibility policy, release checklist, and reproducibility steps without claiming ISO certification.
- Conformance evidence bundle index: [LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md) cross-links beta gates, language gates, Clarity dogfood/canon/super-canon evidence, IR conformance, edge matrix, round-trip probe, source identity probe, unsupported diagnostics, actual programs, support matrix, compatibility policy, report paths, fixture/hash expectations, known unsupported areas, and reproducibility steps as certification-style evidence, not certification.
- Big Remaining Climb master ledger: [LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md) tracks language-depth coverage, formal IR semantics, edge-case expansion, source-preserving round-trip proof, public API/runtime stabilization, conformance tests, compatibility rules, and certification-grade evidence.
- Bidirectionality contract: [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) separates native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, and semantic equivalence.
- Live Clarity dogfood gate: `npm run clarity:dogfood`
- Strict local Clarity Canon gate: `npm run clarity:canon`
- Canonical IR conformance, value-semantics matrix, control-flow matrix, function/scope matrix, and data-structure matrix: `npm run test:ir-conformance`, using `tests/conformance/manifest.json`
- Edge-case matrix generator: `npm run test:edge-matrix`, using `tests/edge_matrix/manifest.json` for seeded value, control, scope, data, errors, target-specific behavior, and unsupported-diagnostic cases.
- Unsupported diagnostics certification: `npm run test:unsupported-diagnostics`, using `tests/ir/unsupported_diagnostics.test.js` for named JavaScript, `.ls`, Python, Lua, core-fallback, and target-emitter unsupported failures.
- Round-trip probe harness: `npm run test:roundtrip-probe`, using `tests/roundtrip/manifest.json` for tiny structural IR reparse and runtime-output equivalence checks.
- Experimental language qualification gate: `npm run clarity:languages`
- Implemented language gate refresh: `npm run language:implemented:bidirectional`
- Native language gates are listed in [Language Completion Rules](LANGUAGE_COMPLETION_RULES.md) and [Language Support Matrix](LANGUAGE_SUPPORT_MATRIX.md). Target-runtime IR lanes prove emitted behavior for named slices, but they do not substitute for native qualification.
- Language depth accession rules: [LUASCRIPT_LANGUAGE_ACCESSION_RULES.md](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md) requires manifest, parser coverage, lowering, emitter, native runtime, target runtime, docs, support matrix, claims check, and Denali ledger entry before a language slice broadens.

## Support References

- [Canonical IR Spec](canonical_ir_spec.md)
- [Canonical IR Semantics Inventory](LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)
- [Canonical IR Semantics Spec v0](LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)
- [Bidirectionality Contract](LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)
- [Language Depth Accession Rules](LUASCRIPT_LANGUAGE_ACCESSION_RULES.md)
- [Public API And Runtime Contract](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- [Conformance Evidence Binder](LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md)
- [Conformance Evidence Bundle Index](LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md)
- [Big Remaining Climb Master Ledger](LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md)
- [Versioning](VERSIONING.md)
- [IR Architecture](ir/ARCHITECTURE.md)
- [Canonical IR Usage Guide](ir/USAGE_GUIDE.md)

The `adr/`, `schema/`, and additional `ir/` files are support references for implementation history and schema compatibility. They are not independent status sources and cannot promote a feature or language claim without the active status, support matrix, and current gates agreeing.

## Archive

Historical, duplicate, deprecated, or contradicted docs now live under [OLD LUASCRIPT DOCS](<OLD LUASCRIPT DOCS/README.md>). Treat archived files as evidence, not current implementation status.
