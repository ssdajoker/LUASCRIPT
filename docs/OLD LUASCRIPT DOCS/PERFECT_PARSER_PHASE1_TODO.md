# Perfect Parser Initiative — Phase 1: Foundation & Reliability

This document captures the audit and action plan to fully realize Phase 1 for the LUASCRIPT parser and transpiler. It reflects what exists in the repo (including the `perfect-parser/phase1` branch lineage) and what’s still missing or inconsistent across modules.

Audit date: 2025-10-13

## Current state (from code + tests)

- Branch/PR lineage
  - Remote branch `origin/perfect-parser/phase1` exists. Many of its assets are present on `main`, but the Phase 1 test file `test/test_perfect_parser_phase1.js` was removed in `main`.
- Transpiler
  - `src/enhanced_transpiler.js` has robust operator ordering, string-literal protection, improved string concatenation fix, object/array conversions, and basic input/output validation (warnings-only for some checks).
  - `src/transpiler.js` retains a simpler regex-based approach and legacy pipeline, with basic concatenation conversion that can still misconvert numeric addition in ambiguous cases.
  - Canonical IR pipeline is present via `src/ir/pipeline.js` and `emitLuaFromIR`; `unified_luascript.js` orchestrates multiple paths.
- Parser & Memory
  - `src/parser.js` defines a `MemoryManager` with PS2/PS3-like pools, but doesn’t include all Phase 1 leak-detection and stats (e.g., `allocationHistory`, `nodeTypeStats`, `peakMemoryUsage` as described in the initiative notes).
  - `src/phase1_core_parser.js` is a more feature-complete parser with error recovery, structured AST, and broader grammar coverage, but the canonical IR pipeline currently imports `../parser` (i.e., `src/parser.js`), not the `phase1_core_*` components.
  - Runtime memory management exists in `src/runtime_system.js` with GC thresholds, adaptive behavior, and stats; tests pass.
- Tests
  - Core tests pass (`npm test`): unified system basics and memory management suite are green.
  - Enhanced transpiler test suite exists: `test/test_enhanced_transpiler.js` with PR #7 fixes (concat, etc.). It’s not wired into the default `npm test` script.
  - The Perfect Parser Phase 1 test suite (from the branch) was deleted on `main` and should be reinstated (with updates if needed).

## High-priority goals

- Unify parser strategy and memory behavior across modules (Parser, IR pipeline, Transpiler).
- Make runtime validation comprehensive and consistent with well-defined error codes (e.g., `LUASCRIPT_VALIDATION_ERROR`, `LUASCRIPT_OUTPUT_VALIDATION_ERROR`, `LUASCRIPT_MEMORY_ERROR`).
- Ensure string concatenation fixes are context-aware and avoid breaking numeric addition across all transpilation paths.
- Reinstate/expand tests to cover all Phase 1 acceptance criteria.

## TODOs by area

### 1) Transpiler: Validation + Operators + Data structures

- Input validation
  - [ ] Implement strict input validation in `src/transpiler.js` to mirror `enhanced_transpiler` parity:
    - [ ] Type must be string; enforce 1MB default limit (configurable).
    - [ ] Detect unsupported JS features: `eval`, `with`, `debugger` → throw `LUASCRIPT_VALIDATION_ERROR`.
    - [ ] Balanced syntax check (brackets/braces/quotes) with actionable messages.
  - [ ] Align error code taxonomy (`LUASCRIPT_VALIDATION_ERROR`, `LUASCRIPT_INTERNAL_ERROR`).
- Output validation
  - [ ] Block invalid Lua tokens: `++`, `===`, `!==`, `||`, `&&`, stray `--` not denoting comments → throw `LUASCRIPT_OUTPUT_VALIDATION_ERROR`.
  - [ ] Enforce runtime injection when `includeRuntime !== false` and validate presence of `require('runtime.runtime')`.
  - [ ] Add Lua-specific balance validation (function/if/for/do vs `end`).
- Operators & ordering
  - [ ] Adopt the safe, ordered pipeline used in `src/enhanced_transpiler.js` (protect strings → control structures → declarations → operators → data structures → cleanup → restore strings → concat fix → runtime injection).
  - [ ] Replace the simplistic `fixStringConcatenation` in `src/transpiler.js` with the context-aware approach (or share a common implementation) to avoid numeric-addition breakage.
  - [ ] Ensure `fixLogicalOperators` correctly handles `!` vs `!=` and parenthesized expressions.
- Data structures
  - [ ] Update object conversion to preserve colons inside strings (do not convert `"Value: "` to `"Value = "`).
  - [ ] Ensure array literal conversion excludes array indexing and non-literal brackets.

### 2) Parser strategy alignment (consistency + recovery)

- [ ] Introduce a clear `parsingStrategy` config in `src/parser.js` (or adopt `phase1_core_parser` as the default):
  - strictMode: boolean, allowRecovery: boolean, maxErrorsBeforeAbort: number, trackSourceLocations: boolean.
  - [ ] Implement `validateParsingStrategy()`.
  - [ ] Add `errors`/`warnings` arrays with source locations on the returned Program node (copy from the initiative spec).
  - [ ] Centralize `handleParsingError()` with structured error shape and `recoverToNextStatement()` that skips to statement boundaries.
- [ ] Decide and implement source of truth for Parser in IR pipeline:
  - Option A: Switch `src/ir/pipeline.js` to use `phase1_core_*` (lexer/parser/ast) and adapt normalizer/lowerer accordingly.
  - Option B: Port missing features from `phase1_core_parser.js` into `src/parser.js` and keep the current import.
- [ ] Ensure EOF token and token metadata requirements are enforced on parser construction.

### 3) Memory management (parser-time)

- [ ] Expand `src/parser.js` `MemoryManager` to include:
  - [ ] `nodeTypeStats` counting, `peakMemoryUsage`, and `allocationHistory` (cap e.g., last 1,000 allocations).
  - [ ] Leak detection pass on `exitScope()` at depth 0 to flag long-lived allocated nodes.
  - [ ] Better error messages for memory limit exceeded: include top node types and current usage (`LUASCRIPT_MEMORY_ERROR`).
  - [ ] `getDetailedStats()` with node breakdown and allocation rate.
- [ ] Ensure `enterScope()`/`exitScope()` keep `currentDepth` accurate and enforce `maxDepth` with a helpful message.
- [ ] Add thorough cleanup to remove debug fields and reset tracking maps.

### 4) Error handling & recovery

- [ ] Uniform error categorization and messages with suggestions and token context (line/column/value).
- [ ] Cap error recovery (`maxErrorsBeforeAbort`) and bubble an aggregate error with the first error snippet if exceeded.
- [ ] Add structured log points (optionally behind flags) for debugging parser recovery.

### 5) IR pipeline integration

- [ ] Confirm `parseAndLower` uses the intended Phase 1 parser semantics:
  - [ ] If switching to `phase1_core_parser`, validate AST compatibility with `normalizer` and `IRLowerer`.
  - [ ] Add tests to validate lowering from ternary, logical operators, loops, and arrow functions.
- [ ] Ensure string concatenation correctness is preserved post-IR emission (post-emit heuristics may still be needed).

### 6) Tests: Restore and expand Phase 1 coverage

- [ ] Reinstate “Perfect Parser Phase 1” tests (previously `test/test_perfect_parser_phase1.js`) with updates:
  - [ ] String concatenation: preserve numeric addition; convert string concatenations; chained cases; `"Value: "` colon preservation.
  - [ ] Runtime validation: invalid types, size limits, unsupported features, syntax balance.
  - [ ] Parser strategy: `validateParsingStrategy()`, error/warning arrays, source locations.
  - [ ] Memory management: limit enforcement, enhanced stats, cleanup.
  - [ ] Error handling: recovery behavior and abort threshold.
- [ ] Wire enhanced transpiler tests (`test/test_enhanced_transpiler.js`) into `npm test` or add a `test:enhanced` npm script and a meta `test:all`.
- [ ] Add negative tests for Lua output validation (e.g., detect stray `++`, `--` not comment, etc.).

### 7) Documentation

- [ ] Document the Phase 1 parser strategy flags, defaults, and runtime validation error codes.
- [ ] Add a troubleshooting guide for common validation failures.
- [ ] Update README and `docs/PARSER_RUNTIME_PARITY_PLAN.md` to reflect the unified approach and default paths.

### 8) Integration & runtime

- [ ] Verify runtime module resolution: ensure `require('runtime.runtime')` resolves in all environments (Node/packagers).
- [ ] Confirm `unified_luascript.js` chooses canonical path by default and falls back predictably (log summarizing which path ran).
- [ ] Ensure performance metrics and memory stats are accessible through public APIs for diagnostics.

### 9) Quality gates & CI

- [ ] Add a script `npm run test:all` to run core + enhanced + IR validation + memory.
- [ ] Add basic lint/type checks for TS/JS sources (eslint/tsc) in CI.
- [ ] Track PASS/FAIL for: build, lint, unit tests, integration tests.

### 10) Performance & safety edge cases

- [ ] Template literals/backticks: ensure protection in all transpilation paths; add tests.
- [ ] Comments handling: avoid misinterpreting `--` vs Lua comment; ensure no operator rewrites inside comments.
- [ ] Parentheses safety: maintain grouping around logical expressions when converting operators (`not`, `and`, `or`).
- [ ] Deeply nested constructs: ensure `maxDepth` and recovery remain stable with large inputs.

## Acceptance criteria (Phase 1)

- [ ] String concatenation fix is correct across all paths; no numeric addition breakage.
- [ ] Runtime validation enforces input code constraints and outputs structured error codes/messages.
- [ ] Parser strategy is consistent and validated; AST includes error/warning metadata.
- [ ] Memory manager has enhanced stats, leak detection, and error messages; cleanup resets all trackers.
- [ ] Error recovery is configurable and capped; parsing aborts cleanly with summary when limits reached.
- [ ] Tests cover the above; `npm run test:all` green locally and in CI.

## Notes

- We have two “transpilers” (legacy vs enhanced). The plan is to converge on a single, safe pipeline (prefer canonical IR + enhanced passes). During transition, share utilities (e.g., string protection and concat fixer) to reduce duplication and drift.
- The `phase1_core_*` stack is close to spec; decide whether to promote it to the default or port its missing features into `src/parser.js` to align with the existing IR pipeline.

---

Maintainer: Core Parser/Transpiler Team
File: `docs/PERFECT_PARSER_PHASE1_TODO.md`
