# ADR 0002: Runtime Memory Management Strategy

status: Accepted

date: 2025-10-13

decision: Use an adaptive GC threshold with depth/heap limits exposed via RuntimeMemoryManager, with GC hooks for low-yield sweeps.

context: Performance tests show dynamic workloads require adjustable GC behavior to prevent pauses.

consequences:
- Adaptive threshold responds to allocation rates.
- Depth and heap caps prevent runaway recursion and OOMs.
- Test coverage ensured in tests/test_memory_management.js.

ADR: Memory thresholds adapt between 60–70% based on sweep yield.

DECISION: Expose memory stats and GC triggers through public API for instrumentation.
