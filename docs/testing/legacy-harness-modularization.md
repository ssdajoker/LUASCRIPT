# Legacy Harness Modularization Notes

**Author**: QA Guild (Farah) · **Support**: Runtime Engineering Pod · **Target**: Week 5 Day 6

## Objectives

- Split the monolithic `npm run test:legacy` flow into component-scoped suites so CI runners can execute them in parallel.
- Preserve compatibility with existing manual workflows by keeping an `all` mode (`node test/test_unified_system.js all`).
- Document ownership expectations and follow-up work for post-Week 5 hardening.

## Deliverables

| Item | Status | Notes |
| --- | --- | --- |
| Parser-focused suite | ✅ | `npm run test:legacy:parser` → exercises parsing + transformation checks (`testBasicTranspilation`, `testAdvancedFeatures`). |
| Runtime stability suite | ✅ | `npm run test:legacy:runtime` → smoke-tests execution + perf tooling (`testRuntimeExecution`, `testPerformanceTools`). |
| Transpiler & pipeline suite | ✅ | `npm run test:legacy:transpiler` → validates transpile/execute and victory metrics (`testFullPipeline`, `testVictoryValidation`). |
| Aggregated compatibility route | ✅ | `npm run test:legacy` chains the three suites sequentially for local runs. |

## Implementation Notes

- Added suite-specific runners in `test/test_unified_system.js` (`runParserSuite`, `runRuntimeSuite`, `runTranspilerSuite`).
- Each runner instantiates a fresh `UnifiedSystemTests` harness to avoid cross-suite state bleed and prints a scoped summary via existing reporting.
- CLI entry point now accepts an optional suite name argument: `node test/test_unified_system.js parser`.
- New shims placed in `test/legacy/` to act as npm script targets; they exit with the runner status to integrate with CI tooling.

## CI Integration Plan

1. Update CI workflows to spawn three parallel jobs, each invoking one of the new npm scripts. (Owner: Farah)
2. Capture per-suite artifacts (stdout, junit conversion optional) and surface them in the pipeline dashboard.
3. Track runtime of each suite over the next three runs; flag any suite consistently exceeding 5 minutes for profiling.

## Follow-Up Considerations

- **Test Coverage**: Evaluate whether parser suite needs dedicated AST fixtures once the new parser diagnostics land (Week 6).
- **Perf Harness**: Align `test:performance` with the modular layout by Week 6 to keep command semantics consistent.
- **Docs Sync**: Reflect the new scripts in onboarding materials (`docs/COMMUNITY.md`, `CONTRIBUTING.md`) during the next documentation sweep.

---
Last updated: October 12, 2025
