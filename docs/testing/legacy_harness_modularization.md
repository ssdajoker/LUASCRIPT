# Legacy Harness Modularization Notes

**Owner:** QA Guild (Farah) with Runtime Engineering Support  
**Target Completion:** Week 5 Day 6

## Goals

- Split the monolithic `npm run test:legacy` harness into focused suites so CI can run them in parallel.
- Preserve coverage parity with the unified runner while reducing wall-clock duration per check.
- Provide clear documentation for QA and runtime engineers coordinating the effort.

## Suite Breakdown

| Suite | Entry Script | Covered Areas | Typical Duration* |
| --- | --- | --- | --- |
| Parser | `npm run test:legacy:parser` | `testBasicTranspilation`, `testAdvancedFeatures` | < 1 s |
| Runtime | `npm run test:legacy:runtime` | `testRuntimeExecution`, `testPerformanceTools` | ~1.5 s |
| Transpiler | `npm run test:legacy:transpiler` | `testFullPipeline`, `testVictoryValidation` | ~2 s |

\* Durations captured from local Linux run on Oct 12, 2025.

## CI Parallelization Guidance

1. Add three independent jobs (parser/runtime/transpiler) to the Week 5 pipeline template.
2. Ensure artifacts capture the `console.log` output for each suite (used by QA for regression triage).
3. Gate Phase 1C deployments on all three suites passing; retain the `test:legacy` aggregate as a convenient preflight locally.

## Command Summary

```bash
# Full legacy sweep (serial)
npm run test:legacy

# Focused suites for parallel workers
npm run test:legacy:parser
npm run test:legacy:runtime
npm run test:legacy:transpiler
```

## Follow-Up Tasks

- [ ] Add GitHub Actions matrix job definitions (blocked on pipeline PR #217).
- [ ] Rebaseline historical runtime for each suite once GC tuning (RT-101/RT-102) lands.
- [ ] Explore caching fixture downloads between suites to shave another ~300 ms per job.

Last updated: Oct 12, 2025
