# LUASCRIPT Denali Release-Blocking Policy

Status: active no-release RC gate policy  
Last updated: 2026-07-29  
Authority: `scripts/denali_rc_preflight.js`

This policy defines the evidence that must be green before LUASCRIPT can be
called a Denali `1.0` release candidate. It does not authorize a version bump,
commit, tag, publish, push, pull request, GitHub release, changelog seal, or
artifact upload.

## One Authoritative Command

```bash
npm run denali:rc:preflight
```

To inspect the policy without running any gate:

```bash
npm run denali:rc:preflight:list
```

The orchestrator invokes commands with argument arrays and `shell: false`,
always from the repository root. It stops on the first exception, signal,
missing process status, or nonzero exit. Its final receipt is emitted to
stdout; the evidence bundle owns the durable release artifact.

## Required Order

| Step | Command | Release-blocking purpose |
| ---: | --- | --- |
| 1 | `npm run language:implemented:bidirectional` | Regenerate all 26 schema-v2 language reports and their live provenance |
| 2 | `npm run test:package-contract` | Pack, install, import, inspect, and execute the actual consumer package |
| 3 | `npm run clarity:dogfood` | Refresh active dogfood evidence |
| 4 | `npm run clarity:canon` | Refresh the strict local canon report |
| 5 | `npm run clarity:canon:super` | Refresh the required governed super-canon report |
| 6 | `npm run clarity:canon:languages` | Refresh the required language-canon report |
| 7 | `npm run clarity:languages:reports` | Validate the regenerated language reports without reclassifying support |
| 8 | `npm run test:actual-programs` | Refresh the 55-entry repository-local legacy behavior report |
| 9 | `npm run test:parser-ownership` | Refresh the parser-ownership assertion report |
| 10 | `npm run test:ir-conformance` | Refresh canonical IR conformance evidence |
| 11 | `npm run test:schema-artifact-map` | Refresh schema-artifact mapping evidence |
| 12 | `npm run test:ir-compatibility-bridge` | Refresh the versioned one-way release-IR compatibility report |
| 13 | `npm run test:edge-matrix` | Refresh the scoped edge-case matrix |
| 14 | `npm run test:roundtrip-probe` | Refresh structural-reparse/runtime-equivalence evidence |
| 15 | `npm run test:source-identity-probe` | Refresh named `.ls` normalized identity evidence |
| 16 | `npm run test:unsupported-diagnostics` | Refresh named fail-closed diagnostic evidence |
| 17 | `npm run test:compatibility-matrix` | Bind all owning reports to live package, runtime, schema, manifest, and doc truth |
| 18 | `npm run status:check` | Enforce the active status/docs graph |
| 19 | `npm run stubs:check` | Reject active fake implementation bodies |
| 20 | `npm run archive:audit` | Enforce active/archive boundaries |
| 21 | `npm run claims:check` | Reconcile executable evidence with protected claims and ledgers |
| 22 | `npm run verify` | Run the repository verification gate |
| 23 | `npm test` | Run the core/runtime baseline |
| 24 | `npm run test:performance` | Run the real performance readiness test |
| 25 | `npm run ci:gates` | Run the real CI completeness gate |
| 26 | `npm run evidence:release` | Generate and validate the deterministic evidence bundle last |

The order is contractual. In particular, the compatibility matrix runs after
every report it hash-binds, and release evidence generation runs after every
release-blocking producer and validator. Moving either earlier would permit a
later gate to stale its artifact.

Step 21 builds a read-only in-memory release-evidence candidate from the
current live report bytes and validates its schema, readiness, identities, and
all embedded and stored hash bindings. It does not read or write the previous
persisted bundle: steps 1 through 20 intentionally replace the reports that a
previous receipt bound. Step 26 independently rebuilds the same candidate with
`--require-ready` and is the sole writer of the authoritative final bundle.
This removes circular bootstrap without skipping or weakening live binding
validation.

## Evidence Bundle Policy

`npm run evidence:release` invokes
`node scripts/generate_release_evidence_bundle.js --require-ready` and writes
`artifacts/release_evidence/denali-release-evidence-bundle.json`. It is a
read-only inventory generator except for that exact output. It does not rerun a
gate or repair a stale report. The command exits nonzero whenever the generated
bundle says `releaseReady: false`, so stale or incomplete evidence cannot pass
step 26 merely because a truthful JSON file was written.

The bundle release-blocks:

- the four binder-defined Clarity reports: dogfood, canon, super canon, and
  language canon;
- all 26 language manifest/report pairs;
- actual-program and parser-ownership reports;
- package, compatibility, IR, edge, round-trip, source-identity, and
  unsupported-diagnostic reports;
- embedded live path/hash references, report summaries, environment metadata,
  and deterministic content identities.

Clarity fast, heavy, legacy, and setup-blocked variants are inventoried as
informational reports. Their presence, stale state, or diagnostic outcome is
reported but does not block a release because they are not part of the active
release contract.

The bundle has a timestamp-independent canonical identity. The top-level
generation timestamp is excluded from that identity, while timestamps inside
owned reports remain hash-bound evidence. Missing, stale, failing, malformed,
or unbound required evidence is a blocker, never an implicit skip.

## Example And Compatibility Boundary

- `examples/package/` is the only installed-package example surface and must
  execute after clean installation.
- `tests/actual_programs/` is a 55-entry repository-local legacy
  compiler/runtime suite. Its report explicitly sets
  `packageCompatibilityClaimed: false`.
- The wider `examples/` tree is repository-local evidence unless a future
  package contract deliberately promotes a path.
- The compatibility report proves the current Windows x64 host plus the
  separate Node `14.17.1` installed-consumer floor probe. It does not certify
  Linux, macOS, another architecture, or an untested toolchain.

## Release-Tooling Invariants

The release CLI delegates readiness to this authoritative preflight. Version
tooling accepts the live SemVer prerelease shape and calculates deliberate
stable promotion, but:

- a dirty worktree blocks release preparation;
- a requested version may not move backward;
- a tag may not be created unless `package.json` at `HEAD` contains the exact
  intended version;
- uncommitted package-version divergence blocks tagging;
- `--force` may not bypass the commit-before-tag invariant.

These safeguards make an authorized release safer. They do not supply the
authorization.

## Explicit Non-Goals

This local policy does not prove:

- universal or lossless bidirectional translation;
- full semantics for any language beyond its named manifest slice;
- broad source/token/comment/format identity;
- true omni-language 100%;
- cross-platform certification or third-party certification;
- npm ownership, package-name availability, signing keys, registry
  authentication, or network release access.

Those claims and external prerequisites remain separate. A zero-failure local
preflight is necessary for the Denali RC handoff, not sufficient permission to
release.
