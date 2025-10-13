# Phase 3 Lite Call Graph Exports

Profiler captures saved as JSON will land in this directory. Each file follows the schema emitted by `PerformanceTools.profile` and includes:

- `entryPoint`: Fully qualified method under test.
- `durationMs`: Total sampled time window.
- `nodes`: Array of call nodes with `selfTime`, `cumulativeTime`, and `children` references.

> NOTE: Initial exports generated on October 12, 2025 are stored externally while we finalize retention policy; drop updated files here once automation is wired.
