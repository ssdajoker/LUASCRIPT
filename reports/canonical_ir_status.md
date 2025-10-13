# Canonical IR Status Report

**Date:** October 12, 2025  
**Author:** GitHub Copilot (Audit Follow-up)

## Executive Summary

- **Status:** ❌ Canonical intermediate representation (IR) not implemented in the active JavaScript → Lua transpilation pipelines.  
- **Impact:** Blocks reliable multi-target backends, prevents repeatable analysis passes, and contradicts requirement that the transpiler emit a canonical IR prior to Lua/codegen stages.  
- **Priority:** High – foundational architecture gap.

## Findings

1. **Transpiler Implementations Bypass IR**  
   - `src/transpiler.js`, `src/enhanced_transpiler.js`, `src/optimized_transpiler.js`, and `src/core_transpiler.js` perform regex-based rewrites directly from JavaScript source to Lua, with no intermediate canonical structure.  
   - None of these modules build or expose an AST/IR graph; transformations are order-dependent string replacements.

2. **Parser Assets Are Unwired**  
   - `src/parser.js` and the TypeScript `src/language/parser.ts` each construct rich AST nodes (with memory manager support and semantic metadata), but their outputs are not consumed by the transpilation pipeline.  
   - There is no bridge from these parsers to a canonical IR builder or to the Lua code generators.

3. **WASM Backend IR Is a Placeholder**  
   - `src/wasm_backend.js` defines `parseLuaToIR` and optimization stubs, but the "IR" is a minimal object that simply wraps the Lua source string.  
   - Optimization passes (`eliminateDeadCode`, `foldConstants`, `inlineFunctions`) return the input unchanged; no IR nodes or control/data flow are represented.

4. **Testing Does Not Exercise an IR Layer**  
   - Existing suites (`tests/test_arrow_functions.js`, `test_optimizations.js`, etc.) validate parser and runtime behavior, yet none assert the existence or integrity of a canonical IR artifact.  
   - No golden files, schema definitions, or serialization formats are present for an IR.

## Gaps & Risks

- **Architectural Misalignment:** The mandatory canonical IR stage is missing, leaving code generation brittle and order-sensitive.  
- **Extensibility Risk:** Without a normalized IR, adding new backends (e.g., WASM, bytecode) or analysis passes requires duplicating parsing logic across modules.  
- **Quality Gates Exposure:** Static analysis, optimization, and verification steps cannot be reliably chained without a standardized representation.  
- **Documentation Drift:** Project documents assert advanced phase completion, yet canonical IR support is absent, risking compliance and stakeholder trust.

## Recommended Next Steps

1. **Define Canonical IR Schema**  
   - Establish node types, control-flow constructs, and metadata required for Lua emission and future backends.  
   - Capture schema in-version (e.g., `docs/canonical_ir_spec.md`) with examples.

2. **Integrate Parser → IR Builder**  
   - Reuse `src/parser.js` (or the TypeScript parser) to produce AST nodes, then lower them into the canonical IR before any Lua transformation.  
   - Provide unit tests that snapshot IR output for representative programs.

3. **Refactor Transpilers to Consume IR**  
   - Replace regex stages with IR-driven code generation.  
   - Ensure Lua emitter, optimizers, and WASM backend all accept the same IR contract.

4. **Add IR Validation Pipeline**  
   - Implement schema validation plus smoke tests in CI to guard against regression.  
   - Extend `scripts/run_audit_round.sh` to include an IR structure audit once available.

5. **Update Status Artifacts**  
   - Reflect this gap in `PROJECT_STATUS.md` and upcoming QA reports until resolved.

## Ownership & Tracking

- **Proposed Owner:** Transpiler/Core Architecture leads (Tony Yoka + Phase 1-2 team).  
- **Audit Follow-up:** Keep this report referenced in future rounds until the canonical IR requirement is met and validated by tests + documentation.

## Progress Log (October 12, 2025)

- Drafted `docs/canonical_ir_spec.md`, capturing META-TEAM expectations for the canonical IR.
- Landed initial `src/ir/` scaffolding (`idGenerator`, `nodes`, `builder`, `validator`) with Knuth-approved balanced ternary identifiers.
- Added `tests/ir/builder.test.js` to exercise the builder and ensure balanced ternary encoding integrity.
