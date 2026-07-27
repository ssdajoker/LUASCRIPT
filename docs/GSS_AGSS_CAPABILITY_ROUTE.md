# GSS, AGSS, and Canon Agent Bridge Capability Route

This document is the current evidence boundary for the Gaussian graphics
prototype. It does not promote the prototype into LUASCRIPT 1.0, the browser
runtime, WebGPU, WASM, or ray tracing.

## Current executable slices

- `gss/` contains the LuaJIT reference implementation: grammar, AST, semantic
  analysis, kernel graph, Gaussian/ramp/iso/blend runtimes, and AGSS bounded
  parameter search.
- `ide/gaussian-blobs-demo.html` is a browser Canvas visual prototype. Its
  small `gaussian_blob` parser is intentionally separate from the Lua GSS
  parser and is labeled that way in the page.
- `npm run clarity:dogfood:gaussian` runs the dedicated evidence lane and
  writes `artifacts/gss/gss-dogfood-report.json`.
- `npm run gss:runtime-check` reports Lua/LuaJIT/LPEG availability and gives
  the next setup action without converting a missing optional parser dependency
  into a false pass.
- The parser lane reports `setup-blocked` when LuaJIT LPEG is unavailable;
  that state is not converted into a parser pass.

## Canon Agent Bridge v1

The bridge in `src/agents/canon-agent-bridge.js` defines a small, transport-
neutral job/receipt boundary:

1. A job names a capability, inputs, trial budget, authority, mutation policy,
   and required evidence.
2. A running job records actions without granting implicit mutation authority.
3. Completion produces a receipt containing tests, artifacts, failures, missing
   evidence, promotion eligibility, a receipt ID, and consumed action budget.
4. Promotion is false whenever failures or required evidence are missing.

The existing MCP work queue may transport these jobs, but it remains advisory.
This bridge does not claim durable queue leasing, heartbeats, resumability, or
unattended code mutation. Those are later routes.

## Graphics accession route

1. LuaJIT Gaussian field reference and Canvas showcase — current.
2. Shared browser GSS parser/runtime — future.
3. Real WASM backend with parity evidence — future.
4. WebGPU backend with capability detection and CPU/WASM fallback — future.
5. Gaussian splatting and field-composition showcase — future.
6. Ray tracing or differentiable rendering experiments — research-only until
   the preceding backend contracts are implemented and tested.

## Browser contract seed

`ide/gss-capability-contract.json` is the shared browser-facing capability
vocabulary for this stage. The page may demonstrate Canvas output, but it must
continue to identify the Lua GSS runtime as authoritative and keep WASM,
WebGPU, and ray tracing at their current planned/unimplemented boundaries until
parity evidence exists.
