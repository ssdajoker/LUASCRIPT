# Benchmark Verification Addendum — Week 5 Day 6

**Source Data**: `reports/cross_platform/2025-10-12-linux/benchmark.json` (micro-benchmark harness, 100 iterations)  
**Audience**: META Oversight & Runtime Engineering

## Expected vs. Actual

| Metric | Goal (Phase 1D target) | Actual (Oct 12 run) | Delta | Notes |
| --- | --- | --- | --- | --- |
| Mean latency | ≤ 6.5 ms | 6.26 ms | ✅ -0.24 ms | Within tolerance; no regression compared to Week 4 (6.44 ms). |
| Median latency | ≤ 6.5 ms | 6.32 ms | ✅ -0.18 ms | Stable variance. |
| p95 latency | ≤ 12.5 ms | 11.97 ms | ✅ -0.53 ms | High-percentile spikes trimmed after GC tuning. |
| p99 latency | ≤ 30 ms | 29.07 ms | ✅ -0.93 ms | Single warm-up spike; acceptable until JIT cache preheat lands. |

## Observed Bottlenecks

1. **LuaJIT Warm-Up Spike** — First iteration still incurs 29 ms; recommend persisting parser cache across iterations to shave ~3 ms at p99.
2. **Console Bridge Serialization** — JSON instrumentation adds ~0.4 ms per run. Offload to optional flag once telemetry pipeline is stable.
3. **GC Back-Off Stall** — Adaptive GC pause triggered twice; peak stall 210 ms in non-measured background window (see `reports/cross_platform/2025-10-12-linux/segfault-sweep.log`). No direct impact on micro benchmark, but monitor during sustained loads.

## Actions & Sign-Off

- ✅ Benchmarks satisfy Week 5 success criteria; update reflected in `TODO.md`.
- 📌 Open follow-up ticket to explore parser cache persistence (assign to Runtime Pod during Week 6 planning).
- 📎 Attach this addendum to the META review packet; archive alongside raw JSON and GC sweep logs.

Last updated: October 12, 2025
