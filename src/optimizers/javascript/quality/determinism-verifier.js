#!/usr/bin/env node

/**
 * DETERMINISM VERIFIER - JavaScript Quality Assurance Phase 3.6
 *
 * Runs a target function multiple times, hashes normalized output,
 * and reports variance across runs.
 */

const crypto = require("crypto");
const { performance } = require("perf_hooks");

function stableStringify(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (seen.has(value)) return "\"[Circular]\"";
  seen.add(value);

  // Handle Map
  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v, seen)}`)
      .join(",");
    return `{Map:${entries}}`;
  }

  // Handle Set
  if (value instanceof Set) {
    const items = Array.from(value)
      .map(item => stableStringify(item, seen))
      .sort()
      .join(",");
    return `{Set:[${items}]}`;
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item, seen)).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  const entries = keys.map(key => {
    const v = stableStringify(value[key], seen);
    return `${JSON.stringify(key)}:${v}`;
  });
  return `{${entries.join(",")}}`;
}

function hashOutput(output) {
  const payload = stableStringify(output);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function verifyDeterminism({ run, runs = 10, normalize, label = "run" }) {
  if (typeof run !== "function") {
    return {
      success: false,
      error: "Missing run() function",
      summary: null
    };
  }

  const start = performance.now();
  const hashes = [];
  const errors = [];

  for (let i = 0; i < runs; i++) {
    try {
      const output = run(i);
      const normalized = normalize ? normalize(output) : output;
      const hash = hashOutput(normalized);
      hashes.push(hash);
    } catch (err) {
      errors.push({ index: i, message: err && err.message ? err.message : String(err) });
    }
  }

  const hashCounts = hashes.reduce((acc, hash) => {
    acc[hash] = (acc[hash] || 0) + 1;
    return acc;
  }, {});

  const uniqueHashes = Object.keys(hashCounts);
  const durationMs = performance.now() - start;

  return {
    success: errors.length === 0 && uniqueHashes.length === 1,
    label,
    runs,
    uniqueHashes,
    hashCounts,
    errors,
    durationMs
  };
}

module.exports = {
  verifyDeterminism,
  stableStringify,
  hashOutput
};
