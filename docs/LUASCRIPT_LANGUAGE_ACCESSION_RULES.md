# LUASCRIPT Language Depth Accession Rules

Status: active contract
Last updated: 2026-07-14
Track: Denali canonical `1.0`

This contract defines how LUASCRIPT broadens any language slice. An accession is a deliberate widening of a language row, fixture family, runtime claim, emitted-target claim, or support tier. It is not a release by itself and it does not promote broad language support by implication.

No accession may broaden a support claim unless every required row is `MET` or explicitly `EXCLUDED` with rationale.

## Required Accession Gates

| Gate | Required evidence before promotion |
| --- | --- |
| manifest | A current manifest names the slice, fixtures, expected output or diagnostic behavior, runtime mode, emitted targets, and report path. |
| parser coverage | Current parser evidence accepts every promoted positive fixture and rejects every promoted unsupported fixture with explicit diagnostics. |
| lowering | The source path lowers to the current canonical IR or declared bridge IR shape without target-only shortcuts hiding source semantics. |
| emitter | Every claimed target emits stable output for the slice, including same-language or emitted `.ls` only where those layers are claimed. |
| native runtime | A real native command runs through `language:<name>:bidirectional` when native support is claimed; setup-blocked lanes stay unpromoted. |
| target runtime | Every claimed emitted target either executes and compares behavior or is explicitly documented as emission-only evidence. |
| docs | README, `PROJECT_STATUS.md`, active reference docs, and language completion rules describe the exact slice and limitations. |
| support matrix | `docs/LANGUAGE_SUPPORT_MATRIX.md` names the tier, required evidence before further promotion, and current limitations. |
| claims check | `npm run claims:check` guards key wording, manifest links, support rows, and conservative boundaries. |
| Denali ledger entry | `docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md` records intent, evidence, boundary, verification, and next route. |

## Accession Status Vocabulary

- `MET`: current live evidence satisfies the row for the proposed accession.
- `PARTIAL`: current evidence exists but is narrower than the proposed accession.
- `OPEN`: required evidence or docs are not present yet.
- `EXCLUDED`: deliberately outside the proposed accession, with rationale.

Promotion requires all rows to be `MET` or explicitly `EXCLUDED`. A `PARTIAL` row can describe present footholds, but it blocks promotion until the remaining evidence lands or the accession scope is reduced.

## Checklist Template

Copy this template into the accession issue, route note, or Denali ledger entry before broadening a language slice.

| Item | Required evidence | Status | Evidence / action |
| --- | --- | --- | --- |
| manifest | Slice name, fixtures, expected outputs/diagnostics, runtime mode, targets, report path | `OPEN` | Add or update `tests/language_completion/manifests/<language>.json`. |
| parser coverage | Positive fixtures parse; unsupported fixtures fail with explicit diagnostics | `OPEN` | Name parser entrypoint and diagnostic fixtures. |
| lowering | Source lowers into current canonical IR or declared bridge IR without hidden target-only behavior | `OPEN` | Name lowerer path and IR evidence. |
| emitter | Claimed targets emit deterministic code for the slice | `OPEN` | Name target emitters and emitted-output assertions. |
| native runtime | Claimed native support uses the real runtime command through the bidirectional gate | `OPEN` | Name command, version/setup note, and passing gate. |
| target runtime | Claimed emitted targets execute or are explicitly emission-only | `OPEN` | Name target runtime reports or exclusions. |
| docs | Active docs describe exact scope and limitations | `OPEN` | Patch README, `PROJECT_STATUS.md`, completion rules, and reference docs as needed. |
| support matrix | Support row names tier, evidence, and remaining limits | `OPEN` | Patch `docs/LANGUAGE_SUPPORT_MATRIX.md`. |
| claims check | Claims guard key wording and block overclaim drift | `OPEN` | Patch `scripts/claims_check.js` and run `npm run claims:check`. |
| Denali ledger entry | Ledger records intent, findings, boundary, verification, and next route | `OPEN` | Patch `docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md`. |

## Candidate Checklist: TypeScript V0.25 To V0.30 Typed-JS Depth

Candidate status: not promoted.

Intent: broaden the current TypeScript V0.25 typed-JS small-program slice only after the accession gates prove a deeper, still-scoped TypeScript profile. This is a planning checklist, not a support-matrix promotion.

| Item | Required evidence | Status | Evidence / action |
| --- | --- | --- | --- |
| manifest | Current manifest plus a proposed V0.30 fixture expansion | `PARTIAL` | Current foothold: `tests/language_completion/manifests/typescript.json` names `typescript-v0.25-typed-js-small-programs` with 7 positive fixtures and 4 unsupported diagnostics. Add V0.30 fixtures only when the scope is chosen. |
| parser coverage | TypeScript compiler API accepts every promoted positive fixture and rejects unsupported syntax clearly | `PARTIAL` | Current V0.25 accepts typed locals/functions, arrays, interface/type-alias annotations used as runtime-neutral shapes, object mutation, loops, break/continue, string length/indexing, and boolean short-circuit behavior. V0.30 must decide interfaces, generics, classes, imports, enums, type assertions, optional fields, and modules as supported or explicitly diagnostic. |
| lowering | Runtime-neutral TypeScript syntax lowers through the declared typed-JS erasure path into canonical IR | `PARTIAL` | Current path lowers V0.25 typed-JS fixtures after erasure. V0.30 needs IR evidence for every new syntax family and must not hide semantics in target-only output. |
| emitter | Lua, JavaScript, supported `.ls`, and Python outputs stay deterministic for the claimed slice | `PARTIAL` | Current V0.25 gate emits those targets. V0.30 must add emitted-output assertions for each new positive fixture and explicit diagnostic fixtures for unsupported TypeScript features. |
| native runtime | Claimed native TypeScript behavior runs through `npm run language:typescript:bidirectional` | `PARTIAL` | Current gate executes the supported TypeScript slice through the language-completion harness. V0.30 promotion requires a fresh passing report from `npm run language:typescript:bidirectional`. |
| target runtime | Every emitted target claimed by V0.30 executes or is marked emission-only | `PARTIAL` | Current V0.25 compares behavior across the named targets. V0.30 must keep runtime-output checks for each promoted target or document a narrower emitted-only claim. |
| docs | Active docs describe the exact V0.30 TypeScript boundary | `OPEN` | Patch README, `PROJECT_STATUS.md`, `docs/LANGUAGE_COMPLETION_RULES.md`, and active reference docs only after fixtures/gates prove the broader slice. |
| support matrix | TypeScript row names V0.30 only after evidence lands | `OPEN` | Keep the current support row at partial V0.25 until the accession is proven. |
| claims check | Claim guards prevent broad TypeScript wording | `OPEN` | Add checks for V0.30 wording, manifest fixture names, unsupported diagnostics, and no broad TypeScript claim before promotion. |
| Denali ledger entry | Denali records implementation evidence and verification seal | `OPEN` | Add a separate Denali entry when the V0.30 implementation route lands. This accession-rules entry only records the candidate checklist. |

## Required Verification Before Promotion

```bash
npm run language:typescript:bidirectional
npm run clarity:languages
npm run test:roundtrip-probe
npm run status:check
npm run claims:check
npm run stubs:check
npm run archive:audit
```

If the accession changes IR semantics, emitted-target semantics, or bidirectionality layers, also run the relevant conformance and round-trip gates before updating the support tier.
