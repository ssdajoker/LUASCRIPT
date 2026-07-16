# Parser and Runtime Parity Roadmap

## Mission Alignment

- Deliver feature-complete canonical pipeline that faithfully represents modern JavaScript semantics.
- Close the gap between the canonical IR emitter and the legacy regex-based transpiler.
- Provide runtime shims so generated Lua behaves predictably across Node.js feature surface.

## Parser Expansion Priorities

1. **Template Literals**
   - Parse tagged and untagged templates into dedicated IR nodes.
   - Support embedded expressions with correct order of evaluation.
   - Emit helper calls for cooked/raw strings when tagged.
2. **Destructuring Assignments**
   - Handle object and array patterns in variable declarations and assignment expressions.
   - Lower patterns into sequence of temporary extractions to preserve side effects.
3. **Control Flow Enhancements**
   - Full support for `for...of`, `for...in`, and `switch` lowering.
   - Expand `try/catch/finally` representation in IR with structured exception nodes.
4. **Classes and Inheritance**
   - Parse class fields, constructors, and method definitions.
   - Lower into prototype tables plus metatables for inheritance semantics.
5. **Modules & Imports**
   - Normalize ES module syntax (`import` / `export`) into IR declarations.
   - Provide hooks to map into Lua require semantics or generated loaders.

## Runtime Compatibility Goals

1. **Standard Library Surface**
   - Flesh out `runtime/` helpers for `console`, `Math`, `Date`, `Promise`, and JSON fidelity.
   - Introduce polyfills for `setTimeout`, `setInterval`, and microtask queue scheduling.
2. **Memory & GC Strategy**
   - Instrument runtime with optional reference tracking to aid memory-management tests.
   - Provide diagnostics hooks consumed by `tests/test_memory_management.js`.
3. **Module Loader**
   - Implement lightweight module graph resolver to map ES module imports to Lua modules.
   - Cache module exports to mimic Node.js module caching behavior.
4. **Async Interop**
   - Provide coroutine-based executor that mirrors async/await semantics.
   - Ensure cancellation tokens propagate through Lua coroutines.

## Incremental Milestones

1. **Milestone A – Parser Baseline**
   - Implement template literals and destructuring support.
   - Add IR + emitter tests covering new constructs.
2. **Milestone B – Control Flow & Classes**
   - Deliver `switch`, `for...of/in`, and class lowering.
   - Introduce regression suite comparing legacy and canonical outputs.
3. **Milestone C – Runtime Foundations**
   - Ship enhanced runtime polyfills and module loader.
   - Integrate async coroutine bridge with targeted tests.
4. **Milestone D – Performance & Diagnostics**
   - Profile canonical pipeline, optimize hot emit paths (string builder pooling, memoized nodes).
   - Surface structured diagnostics (warnings, source maps) to IDE integration.

## Validation Strategy

- Expand `tests/ir/` harness with fixture-based comparisons capturing JavaScript → IR → Lua transformations.
- Mirror end-to-end flows through `test/test_unified_system.js` to ensure all subsystems pick up new capabilities.
- Track coverage of new syntax via `reports/` dashboards to ensure regression tests guard future refactors.

## Open Questions

- Determine story for JS built-ins that rely on dynamic evaluation (`eval`, `Function` constructor).
- Decide whether to expose type annotations in IR for future static analysis tooling.
- Evaluate need for pluggable backends beyond Lua (e.g., WebAssembly) once canonical IR stabilizes.
