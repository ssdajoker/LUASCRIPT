"use strict";

/**
 * Determinism Verifier
 * Ensures reproducible IR generation across multiple runs
 * 
 * Purpose: Detect non-deterministic behavior that could mask bugs
 * or cause unreliable test results
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class DeterminismVerifier {
  constructor(options = {}) {
    this.options = options;
    this.runs = new Map();
    this.snapshots = new Map();
    this.violations = [];
    this.runCount = options.runs || 10;
    this.hashMethod = options.hashMethod || 'sha256';
  }

  /**
   * Verify determinism of parser
   * @param {string} sourceCode - Source code to parse
   * @param {object} parser - Parser instance
   * @param {number} runs - Number of runs
   * @returns {object} Determinism verification result
   */
  verifyParserDeterminism(sourceCode, parser, runs = this.runCount) {
    const asts = [];
    const hashes = [];
    const timings = [];

    for (let i = 0; i < runs; i++) {
      const startTime = process.hrtime.bigint();
      const ast = parser.parse(sourceCode);
      const endTime = process.hrtime.bigint();

      const normalized = this.normalizeForHashing(ast);
      const hash = this.hash(normalized);

      asts.push(ast);
      hashes.push(hash);
      timings.push(Number(endTime - startTime));
    }

    return this.analyzeResults(hashes, timings, 'parser', sourceCode);
  }

  /**
   * Verify determinism of IR lowering
   * @param {object} ast - AST to lower
   * @param {object} lowerer - Lowerer instance
   * @param {number} runs - Number of runs
   * @returns {object} Determinism verification result
   */
  verifyLowererDeterminism(ast, lowerer, runs = this.runCount) {
    const irs = [];
    const hashes = [];
    const timings = [];

    for (let i = 0; i < runs; i++) {
      const startTime = process.hrtime.bigint();
      const ir = lowerer.lower(ast);
      const endTime = process.hrtime.bigint();

      const normalized = this.normalizeForHashing(ir);
      const hash = this.hash(normalized);

      irs.push(ir);
      hashes.push(hash);
      timings.push(Number(endTime - startTime));
    }

    return this.analyzeResults(hashes, timings, 'lowerer', ast);
  }

  /**
   * Verify determinism of code emission
   * @param {object} ir - IR to emit
   * @param {object} emitter - Emitter instance
   * @param {number} runs - Number of runs
   * @returns {object} Determinism verification result
   */
  verifyEmitterDeterminism(ir, emitter, runs = this.runCount) {
    const codes = [];
    const hashes = [];
    const timings = [];

    for (let i = 0; i < runs; i++) {
      const startTime = process.hrtime.bigint();
      const code = emitter.emit(ir);
      const endTime = process.hrtime.bigint();

      const hash = this.hash(code);

      codes.push(code);
      hashes.push(hash);
      timings.push(Number(endTime - startTime));
    }

    return this.analyzeResults(hashes, timings, 'emitter', ir);
  }

  /**
   * Verify full pipeline determinism
   * @param {string} sourceCode - Source code
   * @param {object} parser - Parser instance
   * @param {object} lowerer - Lowerer instance
   * @param {object} emitter - Emitter instance
   * @param {number} runs - Number of runs
   * @returns {object} Determinism verification result
   */
  verifyFullPipelineDeterminism(sourceCode, parser, lowerer, emitter, runs = this.runCount) {
    const results = [];
    const irHashes = [];
    const codeHashes = [];
    const timings = [];

    for (let i = 0; i < runs; i++) {
      const pipelineStart = process.hrtime.bigint();

      // Parse
      const ast = parser.parse(sourceCode);

      // Lower
      const ir = lowerer.lower(ast);
      const irHash = this.hash(this.normalizeForHashing(ir));

      // Emit
      const code = emitter.emit(ir);
      const codeHash = this.hash(code);

      const pipelineEnd = process.hrtime.bigint();

      irHashes.push(irHash);
      codeHashes.push(codeHash);
      timings.push(Number(pipelineEnd - pipelineStart));

      results.push({
        run: i + 1,
        irHash,
        codeHash,
        duration: Number(pipelineEnd - pipelineStart),
      });
    }

    return {
      stage: 'full-pipeline',
      runs,
      irConsistent: new Set(irHashes).size === 1,
      codeConsistent: new Set(codeHashes).size === 1,
      irHashes: Array.from(new Set(irHashes)),
      codeHashes: Array.from(new Set(codeHashes)),
      results,
      timingStats: this.calculateStats(timings),
      violations: this.detectViolations(irHashes, codeHashes),
    };
  }

  /**
   * Analyze results for non-determinism
   */
  analyzeResults(hashes, timings, stage, input) {
    const uniqueHashes = new Set(hashes);
    const isDeterministic = uniqueHashes.size === 1;

    if (!isDeterministic) {
      this.violations.push({
        stage,
        inputHash: this.hash(this.normalizeForHashing(input)),
        uniqueOutputs: uniqueHashes.size,
        hashes: Array.from(uniqueHashes),
      });
    }

    return {
      stage,
      isDeterministic,
      runs: hashes.length,
      uniqueOutputs: uniqueHashes.size,
      hashes: Array.from(uniqueHashes),
      timingStats: this.calculateStats(timings),
    };
  }

  /**
   * Detect determinism violations
   */
  detectViolations(irHashes, codeHashes) {
    const violations = [];

    const irSet = new Set(irHashes);
    const codeSet = new Set(codeHashes);

    if (irSet.size > 1) {
      violations.push({
        type: 'IR_NONDETERMINISTIC',
        details: `IR varies: ${irSet.size} unique outputs`,
      });
    }

    if (codeSet.size > 1) {
      violations.push({
        type: 'CODE_NONDETERMINISTIC',
        details: `Code varies: ${codeSet.size} unique outputs`,
      });
    }

    return violations;
  }

  /**
   * Calculate statistics from timing data
   */
  calculateStats(timings) {
    if (timings.length === 0) return null;

    const sorted = timings.sort((a, b) => a - b);
    const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timings.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: Math.round(mean),
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.round(stdDev),
      stdDevPercent: Math.round((stdDev / mean) * 100),
      variance,
    };
  }

  /**
   * Hash value for comparison
   */
  hash(value) {
    let input;
    if (typeof value === 'string') {
      input = value;
    } else {
      input = JSON.stringify(value);
    }
    return crypto.createHash(this.hashMethod).update(input).digest('hex');
  }

  /**
   * Normalize data structure for hashing (remove non-deterministic info)
   */
  normalizeForHashing(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeForHashing(item));
    }

    const normalized = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      // Skip non-deterministic fields
      if (this.isNonDeterministicField(key)) continue;
      normalized[key] = this.normalizeForHashing(obj[key]);
    }

    return normalized;
  }

  /**
   * Check if field is non-deterministic
   */
  isNonDeterministicField(fieldName) {
    const nonDeterministicFields = [
      'timestamp',
      'date',
      'time',
      'random',
      'id',
      'uid',
      'uuid',
      'hash',
      'memory',
      'address',
      'pointer',
      'location',
      'line',
      'column',
      'pos',
      'loc',
    ];

    const lowerName = fieldName.toLowerCase();
    return nonDeterministicFields.some(field => lowerName.includes(field));
  }

  /**
   * Compare two pipeline executions for regressions
   */
  comparePipelineExecutions(before, after) {
    const regressions = [];

    if (before.irConsistent && !after.irConsistent) {
      regressions.push('IR consistency LOST');
    }
    if (before.codeConsistent && !after.codeConsistent) {
      regressions.push('Code consistency LOST');
    }

    const beforeAvgTime = before.timingStats.mean;
    const afterAvgTime = after.timingStats.mean;
    const timeRatio = afterAvgTime / beforeAvgTime;

    if (timeRatio > 1.2) {
      regressions.push(`Performance degradation: ${Math.round((timeRatio - 1) * 100)}% slower`);
    }

    return {
      hasRegressions: regressions.length > 0,
      regressions,
      timingChange: Math.round((timeRatio - 1) * 100),
    };
  }

  /**
   * Save snapshot for future comparison
   */
  saveSnapshot(name, data) {
    this.snapshots.set(name, {
      timestamp: Date.now(),
      data: this.normalizeForHashing(data),
      hash: this.hash(this.normalizeForHashing(data)),
    });
  }

  /**
   * Load snapshot and compare
   */
  compareSnapshot(name, data) {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      return { error: `Snapshot ${name} not found` };
    }

    const currentHash = this.hash(this.normalizeForHashing(data));
    const matches = snapshot.hash === currentHash;

    return {
      name,
      matches,
      previousHash: snapshot.hash,
      currentHash,
      timestamp: snapshot.timestamp,
    };
  }

  /**
   * Generate determinism report
   */
  generateReport() {
    return {
      totalRuns: this.runCount,
      violations: this.violations,
      violationCount: this.violations.length,
      isDeterministic: this.violations.length === 0,
      stages: Array.from(new Set(this.violations.map(v => v.stage))),
    };
  }

  /**
   * Export violations to file
   */
  exportViolations(filepath) {
    const report = {
      timestamp: new Date().toISOString(),
      violations: this.violations,
      summary: this.generateReport(),
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }
}

module.exports = DeterminismVerifier;
