# Quick Start

**Status**: ACTIVE
**Track**: scoped non-strict pre-production beta v0.1
**Last updated**: 2026-07-29

Use this guide to validate the current LUASCRIPT beta surface without accidentally treating it as strict-native complete or canonical `1.0`.

The exact scoped beta release-seal artifact is [BETA_RELEASE_HANDOFF_V0_1.md](../BETA_RELEASE_HANDOFF_V0_1.md).

## What This Beta Means

LUASCRIPT has passing scoped beta evidence for its implemented lanes. On 2026-06-19:

- `npm run beta:readiness` passed with 17/17 implemented lanes beta-ready.
- `npm run beta:preflight` passed with 3/3 batches and 0 failed scripts.
- `npm run beta:full` passed with 4/4 batches and 0 failed scripts.

This is a scoped, non-strict beta handoff. It does not mean full-language completion, production readiness, or canonical `1.0`; the beta handoff itself did not claim strict-native completion.

Post-beta strict-native closure for the current named slices was completed on 2026-07-13. Ruby, PHP, Dart, Java, Go, Rust, Kotlin, Elm, and Gleam now have narrow native gates, but they remain limited slices rather than broad language support.

## Install And Validate

```bash
npm install
npm run beta:readiness
npm run beta:preflight
npm run beta:full
```

Use `npm ci` instead of `npm install` when you need lockfile-exact automation.

## Package And Runtime Contract

The full public API/runtime contract draft is [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md). This quick-start only summarizes the beta validation path.

The current package identity is `luascript@1.0.1` on the stable Denali track.
`src/unified_luascript.js` is the package entrypoint, and the package file
surface is `src/`, `test/`, `examples/package/`, `README.md`, and `LICENSE`.

The package declares consumer Node `>=14.17.0`, aligned with exact runtime TypeScript `5.9.3`. `npm run build` is a readiness smoke, not a production bundle; `npm run test:package-contract` packs, installs, imports, and smoke-tests the actual package on the current runtime and Node `14.17.1`. Native-runtime support is claimed only when the real runtime command is available and the matching `language:<name>:bidirectional` gate passes. Target-runtime IR lanes prove emitted behavior for named slices, but they do not substitute for native qualification.

The verified release build is under `builds/denali/v1.0.1/`; run
`npm run release:verify:denali` to validate its manifest and checksums.

## Good First Examples

Start with the passing scoped surface:

- installed-package consumers: `examples/package/transpile-js-to-lua.cjs` and `examples/package/minimal-system.cjs`
- small JavaScript programs that use variables, arithmetic, functions, conditionals, loops, arrays, objects, and console output
- small `.ls` programs in the verified JS-like and meta-language slices
- `tests/actual_programs/fixtures/`
- `examples/supported_math_showcase.ls`
- `examples/mathematical_notation_core.ls`
- `examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls`

Only the first bullet is a shipped installed-package example surface. The actual-program, mathematical, and wider example trees are repository-local evidence. Avoid using broad multi-language demos or the full Unicode mathematical DSL as beta proof; those are experimental unless a current manifest and gate names the exact slice.

## Useful Focused Gates

- Core/runtime baseline: `npm test`
- Status consistency: `npm run status:check`
- Full verification: `npm run verify`
- Claims audit: `npm run claims:check`
- Stub gate: `npm run stubs:check`
- Live dogfood: `npm run clarity:dogfood`
- Strict local canon: `npm run clarity:canon`
- Language qualification: `npm run clarity:languages`
- `.ls` meta-language: `npm run test:luascript-meta`
- Lua input V2: `npm run test:lua-input`
- Actual programs: `npm run test:actual-programs`

## Language Reality

The strongest current paths are the named JavaScript, LUASCRIPT `.ls`, Lua input, Python, C#, C, C++, TypeScript typed-JS, and target-runtime/native narrow slices documented in [LANGUAGE_SUPPORT_MATRIX.md](../LANGUAGE_SUPPORT_MATRIX.md).

Experimental target-runtime lanes exist for Ruby, PHP, Dart, Java, Go, Rust, Kotlin, Elm, and Gleam, and each has a matching narrow native gate. Broader promotion still requires expanded parser/lowering/runtime fixtures.

## After The Beta Handoff

The next documented route is:

1. keep the scoped beta release messaging and examples aligned with the passing gates
2. keep strict-native narrow-slice gates green as the language matrix expands
3. promote broader language support only after parser/lowering/runtime fixtures expand
4. start the `1.0` canon pass for stable `.ls` identity, supported profiles, package/runtime expectations, examples, docs, and support boundaries
5. keep this quick-start aligned with the package/runtime contract before any release action

## Navigation

- [Project Status](../../PROJECT_STATUS.md)
- [Documentation Index](../INDEX.md)
- [Public API And Runtime Contract](../LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md)
- [Denali Compatibility Matrix](../LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md)
- [Denali Release-Blocking Policy](../LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md)
- [Beta Release Handoff v0.1](../BETA_RELEASE_HANDOFF_V0_1.md)
- [Denali Soloist Ledger](../LUASCRIPT_DENALI_SOLOIST_LEDGER.md)
- [Mega Plan](../LUASCRIPT_MEGA_PLAN.md)
- [Architecture And Runtime Boundaries](../architecture/README.md)
- [Reference Boundary](../reference/README.md)
- [Language Support Matrix](../LANGUAGE_SUPPORT_MATRIX.md)
- [Language Completion Rules](../LANGUAGE_COMPLETION_RULES.md)
