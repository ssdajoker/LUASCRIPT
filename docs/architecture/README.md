# Architecture And Runtime Boundaries

**Status**: ACTIVE  
**Track**: scoped beta v0.1 plus first canonical `1.0` boundary route  
**Last updated**: 2026-07-14

This page is a map of the current LUASCRIPT architecture, not a broad production-readiness claim. The root truth source is [PROJECT_STATUS.md](../../PROJECT_STATUS.md), the active-docs map is [INDEX.md](../INDEX.md), the public API/runtime contract is [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md), and the post-beta route book is [LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md](../LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md).

## Package And Runtime Contract

The authoritative contract draft for package entrypoints, root exports, CLI/API surface, Node/runtime expectations, package files, semver policy, compatibility policy, and release-action boundaries is [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md).

The current package identity is `luascript` at `0.1.0-beta.0`. `src/unified_luascript.js` is the package entrypoint. The current package file surface is `src/`, `test/`, `README.md`, and `LICENSE`; treat that as the beta package surface until a deliberate publish-surface review changes it.

Local setup starts with `npm install`; `npm ci` is the lockfile-exact automation path. The package declares consumer Node `>=14.17.0`, aligned with exact runtime TypeScript `5.9.3`. `npm run build` is a readiness smoke, not a production bundle; `npm run test:package-contract` is the actual-tarball consumer gate.

Native-runtime support requires the real runtime command and a passing `language:<name>:bidirectional` gate. Target-runtime IR lanes prove emitted behavior for named slices, but they do not substitute for native qualification. No tag, publish, GitHub release, or package version bump is part of this route unless explicitly requested.

Bidirectionality is a layered evidence contract, not a broad architecture claim. [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](../LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md) separates native execution, source-to-IR, IR-to-target, target-runtime, emitted `.ls`, round-trip source identity, and semantic equivalence.

## Current Layers

- Package entrypoint: `src/unified_luascript.js`.
- Source parsers and bridges: active parser/lowering paths under `src/`, including `.ls`, JavaScript, Lua, Python, C-family, and the named experimental language slices.
- Canonical IR: schema, validation, golden checks, lowerers, and emitters tracked by [canonical_ir_spec.md](../canonical_ir_spec.md), [LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md](../LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md), [LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md](../LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md), [ir/ARCHITECTURE.md](../ir/ARCHITECTURE.md), and [ir/USAGE_GUIDE.md](../ir/USAGE_GUIDE.md).
- Runtime surface: Lua runtime helpers and target-specific emitted behavior, including mathematical notation helpers where current fixtures prove them.
- Verification harnesses: language completion manifests, actual-program fixtures, Clarity dogfood/canon, beta gates, claims checks, status checks, and stub inventory.
- Documentation authority: README, PROJECT_STATUS, the Denali ledgers, mega plan, support matrix, completion rules, meta-language docs, and this active docs map.

## Support Boundary

The architecture is slice-based. A path is supported only when parser/lowering, emitted output, runtime behavior, docs, and current gates agree. Broad all-language, full Unicode DSL, full symbolic algebra, and canonical omni-language claims remain outside the current architecture until they have manifests, conformance evidence, runtime gates, docs, and claims checks.

## Primary References

- [Project Status](../../PROJECT_STATUS.md)
- [Documentation Index](../INDEX.md)
- [Denali 1.0 Summit Ledger](../LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md)
- [Canonical 1.0 Exit Criteria Charter](../LUASCRIPT_1_0_EXIT_CRITERIA.md)
- [Bidirectionality Contract](../LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)
- [Public API And Runtime Contract](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- [Canonical IR Semantics Inventory](../LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)
- [Canonical IR Semantics Spec v0](../LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)
- [Mega Plan](../LUASCRIPT_MEGA_PLAN.md)
- [Reference Boundary](../reference/README.md)
- [Language Support Matrix](../LANGUAGE_SUPPORT_MATRIX.md)
- [Language Completion Rules](../LANGUAGE_COMPLETION_RULES.md)
- [LuaScript Meta-Language V0.16](../LUASCRIPT_META_LANGUAGE_V0.md)
- [Canonical IR Spec](../canonical_ir_spec.md)
