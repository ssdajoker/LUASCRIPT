# Timeline / Journey
**Status**: ACTIVE
**Phase**: Doc alignment + CI/quality prep (see PROJECT_STATUS.md)
**Last updated**: 2025-01-XX

Phases and milestones from early foundation to current automation. Link deprecated plans to current equivalents.

## Project Phases

### Phase 1: Baseline Pipeline (Operational with gaps)
- **Goal**: JavaScript → IR → Lua transpilation working
- **Status**: Core pipeline operational and passing harness/parity smoke, but Phase1 parser lacks pattern/destructuring support (handled only in enhanced pipeline)
- **Completion**: Core path running; pattern gap remains open
- **Docs**: [PROJECT_STATUS.md](../../PROJECT_STATUS.md)

### Phase 2: Static Warnings & Lint Gates (In progress)
- **Goal**: Reduce static warnings and enforce lint/format gates
- **Status**: Backlog tracked in `static_warnings*.txt`; lint/format is not yet CI-blocking
- **Next**: Make lint/format enforcement part of CI once warning burn-down is complete
- **Docs**: [PROJECT_STATUS.md](../../PROJECT_STATUS.md)

### Phase 3: Doc Alignment + Pipeline Hardening (Current focus)
- **Goal**: Align all docs to PROJECT_STATUS and prepare CI/quality gates for enhanced pipeline parity
- **Key work (from PROJECT_STATUS.md)**:
  - [ ] Doc alignment to PROJECT_STATUS.md
  - [ ] Burn down static warnings; add lint/format gates
  - [ ] Consolidate IR builder patterns and determinism hooks
  - [ ] Implement documented feature gaps with harness/parity coverage
  - [ ] Harden CI with determinism/fuzz/parity/coverage gates
- **Docs**: [PROJECT_STATUS.md](../../PROJECT_STATUS.md), [PHASE3_EXECUTION_PLAN.md](../../PHASE3_EXECUTION_PLAN.md)

### Phase 4+: Feature Implementation & Roadmap
- **Planned**: Finish feature gaps from enhanced roadmap (array/control-flow/function expression edges) and extend coverage/performance gates
- **Details**: See [PROJECT_STATUS.md](../../PROJECT_STATUS.md)

## Legacy Phases (Archived Context)
These represent early planning and are preserved for context only. Refer to current phases above.

- Phase 2-4 Foundation — [PHASE_PLAN.md](../deprecated/PHASE_PLAN.md)
- Phase 5-6: IR integration — [PHASE5_6_PLAN.md](../deprecated/PHASE5_6_PLAN.md)
- Phase 8: Refinement — [PHASE8_A6_COMPLETE.md](../deprecated/PHASE8_A6_COMPLETE.md)
- Phase 9: Production readiness — [PHASE9_COMPLETE.md](../deprecated/PHASE9_COMPLETE.md)

## Canonical Status
For current health, gaps, and priorities, see [PROJECT_STATUS.md](../../PROJECT_STATUS.md) (updated 2025-01-XX).

---
**Navigation**: ← Home | ↑ Index | Next →

