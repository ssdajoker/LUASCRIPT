# Observability toggles

## Logging controls
- `LOG_LEVEL` (default: `info`): Sets the minimum level emitted by `src/utils/logger.js`. Supported values are `error`, `warn`, `info`, and `debug`.
- `LOG_SILENT=1`: Completely disables log emission from the wrappers.
- `LOG_NAMESPACES`: Comma-separated allowlist of logger namespaces (for example, `runtime,memory`). When set, only matching namespaces are emitted.

Use `createLogger(namespace)` from `src/utils/logger.js` to standardize log formatting and future filtering without touching existing console calls.

## Metrics and timers
- `PERF_ENABLE=1` (or `PERF=1`): Enables lightweight counters, timers, and event snapshots in `src/utils/metrics.js`.
- `PERF_OUT` (default: `reports/perf`): Output directory for captured metric snapshots.

Hot-path runtime metrics (heap allocations, garbage collection, and interpreter runs) are gated behind `PERF_ENABLE` so they remain inexpensive by default.
