# ADR 0001: Transpiler Architecture Choice

status: Accepted

date: 2025-10-13

decision: Adopt a modular transpiler with core, enhanced, and optimized layers, backed by a separate IR pipeline.

context: We require maintainable separation between core correctness and advanced optimizations.

consequences:
- Clear layering: core_transpiler.js (basics), enhanced_transpiler.js (syntax sugar), optimized_transpiler.js (performance).
- Easier testing and benchmarking per layer.

ADR: Transpiler layering defined as Core → Enhanced → Optimized.

DECISION: Keep IR transformations isolated under `src/ir/` and integrate via `src/ir/pipeline.js`.
