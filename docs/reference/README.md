# Reference Boundary

**Status**: ACTIVE  
**Track**: scoped beta v0.1 plus first canonical `1.0` boundary route  
**Last updated**: 2026-07-14

This reference page records the current public-facing contract boundary. It is not a complete API reference yet.

## Package And Runtime Contract

The full public API/runtime contract draft is [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). It is the active source for package entrypoints, root exports, CLI/API surface, runtime files, npm scripts, package files, semver policy, compatibility policy, and release-action boundaries.

- Package name: `luascript`.
- Current version: `0.1.0-beta.0`.
- Current entrypoint: `src/unified_luascript.js`.
- Current package file surface: `src/`, `test/`, `README.md`, and `LICENSE`.
- Default local setup: `npm install`.
- Lockfile-exact automation setup: `npm ci`.
- Current Node floor: `node >=14.0.0`.
- Build command status: `npm run build` is a readiness smoke, not a production bundle.

Native-runtime support requires a real runtime command and a passing `language:<name>:bidirectional` gate. Target-runtime IR lanes are emitted-behavior evidence for named slices only; they do not substitute for native qualification.

Bidirectionality follows [LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md](../LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md). A `bidirectional` script name is not a lossless round-trip or full semantic-equivalence guarantee unless that layer has explicit current evidence.

No tag, publish, GitHub release, or package version bump is part of the current docs route unless a release action is explicitly requested.

## Current Reference Links

- [Documentation Index](../INDEX.md)
- [Quick Start](../quick-start/README.md)
- [Architecture And Runtime Boundaries](../architecture/README.md)
- [Canonical 1.0 Exit Criteria Charter](../LUASCRIPT_1_0_EXIT_CRITERIA.md)
- [Bidirectionality Contract](../LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md)
- [Public API And Runtime Contract](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- [Canonical IR Semantics Inventory](../LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md)
- [Canonical IR Semantics Spec v0](../LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md)
- [Language Support Matrix](../LANGUAGE_SUPPORT_MATRIX.md)
- [Language Completion Rules](../LANGUAGE_COMPLETION_RULES.md)
- [LuaScript Meta-Language V0.16](../LUASCRIPT_META_LANGUAGE_V0.md)
- [Mathematical Notation Core And Rehab V18](../LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md)
- [Archive Root](<../OLD LUASCRIPT DOCS/README.md>)

## Not Yet Stable Reference Surface

- A final canonical `1.0` API reference.
- A finalized CLI contract beyond the current npm scripts and package entrypoint.
- A production package surface beyond the current beta file list.
- Broad multi-language support beyond named manifest slices.
- Full Unicode DSL, full symbolic algebra, or omni-language conformance claims.
