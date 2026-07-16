# LUASCRIPT Beta v0.1 Release Handoff

Status: active
Track: scoped non-strict pre-production beta v0.1
Release seal date: 2026-06-19 local evidence; reports refreshed in UTC artifacts on 2026-06-20

This is the best single handoff artifact for the LUASCRIPT beta. It packages the Denali ledger's current route: seal the useful concept beta honestly, then climb toward canonical `1.0` without pretending the remaining native-runtime limits are gone.

## Release Seal

The beta handoff is scoped and non-strict. It says the named implemented lanes, current docs, examples, and local beta gates agree. It does not say LUASCRIPT is production-ready, strict-native complete, full-language complete, or canonical `1.0`.

Current evidence:

- `npm run beta:readiness` passes with 17/17 implemented lanes beta-ready.
- `npm run beta:preflight` passes with 3/3 batches and 0 failed scripts.
- `npm run beta:full` passes with 4/4 batches and 0 failed scripts.
- `npm run status:check`, `npm run claims:check`, and `npm run stubs:check` pass after the release-seal docs.

Evidence artifacts:

- `artifacts/beta_readiness.json`
- `artifacts/beta_gates/preflight-report.json`
- `artifacts/beta_gates/full-report.json`

## Handoff Commands

Run this path for a local beta handoff:

```bash
npm install
npm run beta:readiness
npm run beta:preflight
npm run beta:full
```

Use `npm ci` instead of `npm install` only when a lockfile-exact automation flow is preferred.

## Recommended First Examples

Start with examples that match the beta claim:

- small JavaScript programs
- small LUASCRIPT `.ls` programs
- `tests/actual_programs/fixtures/`
- `examples/supported_math_showcase.ls`
- `examples/mathematical_notation_core.ls`
- `examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls`

Avoid broad multi-language demos or the full Unicode mathematical DSL as first validation targets unless a current gate names and verifies the exact slice.

## Release Notes

Added for the beta seal:

- Scoped beta v0.1 public messaging in `README.md` and `PROJECT_STATUS.md`.
- A compact beta quick-start centered on `beta:readiness`, `beta:preflight`, and `beta:full`.
- This handoff artifact as the exact release-seal document.
- Denali-led post-beta routing for strict-native closure and the first `1.0` canon pass.

Confirmed:

- Implemented beta lanes are ready under the non-strict beta profile.
- Target-runtime IR lanes are useful where named, but do not count as native runtime qualification.
- Active status, claims, and stub gates remain green.
- Strict-native completion remains a separate route after the beta handoff.

Not changed:

- No compiler API change.
- No runtime API change.
- No language syntax change.
- No package version bump.
- No tag, publish, or GitHub release action.

## Known Limitations

Strict-native completion remained outside the original beta handoff scope. Post-beta strict-native closure for the current named slices was completed on 2026-07-13: `kotlinc`, `elm`, and `gleam` are now available locally, and Kotlin, Elm, and Gleam native gates pass alongside Java, Rust, Ruby, PHP, Dart, and Go. The beta claim is still about named passing slices and target-runtime/native evidence, not "everything in every language."

Other boundaries:

- `.ls` is not yet a canonical `1.0` language specification.
- Broad C#/C/C++ support beyond named slices remains out of scope.
- Broad symbolic math claims must continue to advance only through executable, tested slices.
- Historical docs remain archive evidence unless linked by the active docs map.

## Post-Beta Route

The post-beta route is limitation removal, not limitation normalization:

1. Keep the current strict-native narrow-slice gates green.
2. Keep any future setup-blocked lane labeled until its native gate passes.
3. Promote broader language support only after parsing, lowering, emission, runtime execution, docs, and reports agree.
4. Define the canonical `1.0` exit criteria: stable `.ls` identity, supported profiles, package/runtime expectations, examples, release-quality docs, and support boundaries.
5. Keep `beta:preflight` and `beta:full` green while the broader-language and `1.0` routes advance.

The first package/runtime expectation slice is now named for that route, with the full contract draft in [LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md](LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md): package identity stays `luascript` at `0.1.0-beta.0`, `src/unified_luascript.js` remains the entrypoint, `npm install` is the default setup path, `npm ci` is the lockfile-exact automation path, `npm run build` is a readiness smoke, and native-runtime claims require real runtime commands plus passing `language:<name>:bidirectional` gates. Target-runtime IR lanes remain emitted-behavior evidence, not native qualification.

## Handoff Decision

The beta handoff artifact is this document, backed by `PROJECT_STATUS.md`, the Denali ledger, and the generated beta gate reports. The beta should be handed off as a scoped non-strict release candidate package of evidence and docs, not as a tag or publish action unless that action is explicitly requested.
