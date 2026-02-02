#!/usr/bin/env node

/**
 * SLO GATES - JavaScript Quality Assurance Phase 3.6
 *
 * Evaluates latency, memory, and throughput against configured thresholds.
 */

function evaluateSloGates({
  latencyMs,
  baselineMemoryBytes,
  currentMemoryBytes,
  throughputOpsPerSec,
  thresholds = {}
}) {
  const limits = {
    latencyMs: thresholds.latencyMs ?? 200,
    memoryRatio: thresholds.memoryRatio ?? 1.1,
    throughputOpsPerSec: thresholds.throughputOpsPerSec ?? 1000
  };

  const failures = [];
  const metrics = {
    latencyMs,
    memoryRatio: null,
    throughputOpsPerSec,
    limits
  };

  if (typeof latencyMs === "number" && latencyMs > limits.latencyMs) {
    failures.push(`Latency ${latencyMs.toFixed(2)}ms exceeds ${limits.latencyMs}ms`);
  }

  if (typeof baselineMemoryBytes === "number" && typeof currentMemoryBytes === "number") {
    metrics.memoryRatio = baselineMemoryBytes === 0
      ? null
      : currentMemoryBytes / baselineMemoryBytes;

    if (metrics.memoryRatio !== null && metrics.memoryRatio > limits.memoryRatio) {
      failures.push(`Memory ratio ${metrics.memoryRatio.toFixed(2)} exceeds ${limits.memoryRatio}`);
    }
  }

  if (typeof throughputOpsPerSec === "number" && throughputOpsPerSec < limits.throughputOpsPerSec) {
    failures.push(`Throughput ${throughputOpsPerSec.toFixed(2)} ops/sec below ${limits.throughputOpsPerSec}`);
  }

  return {
    success: failures.length === 0,
    failures,
    metrics
  };
}

module.exports = {
  evaluateSloGates
};
