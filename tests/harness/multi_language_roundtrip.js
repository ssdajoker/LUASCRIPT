"use strict";

/**
 * Multi-Language Roundtrip Test Harness
 * Validates parse → IR → emit → reparse consistency
 * 
 * Purpose: Ensure deterministic roundtrip for all languages
 * through parse → IR → emit → reparse cycle
 */

const crypto = require('crypto');

class MultiLanguageRoundtripHarness {
  constructor(options = {}) {
    this.options = options;
    this.testResults = [];
    this.irHashes = new Map();
    this.regressions = [];
  }

  /**
   * Run roundtrip test for code sample
   * @param {string} sourceCode - Original source code
   * @param {string} language - Source language
   * @param {object} parser - Parser instance
   * @param {object} emitter - Emitter instance
   * @returns {object} Roundtrip result
   */
  async runRoundtrip(sourceCode, language, parser, emitter) {
    const result = {
      language,
      sourceLength: sourceCode.length,
      stages: {},
      success: false,
      errors: [],
    };

    try {
      // Stage 1: Parse source to AST
      result.stages.parse = {
        start: process.hrtime.bigint(),
      };
      const ast = parser.parse(sourceCode);
      result.stages.parse.end = process.hrtime.bigint();
      result.stages.parse.durationNs = Number(result.stages.parse.end - result.stages.parse.start);
      result.stages.parse.astHash = this.hashAST(ast);

      // Stage 2: AST to IR
      result.stages.astToIR = {
        start: process.hrtime.bigint(),
      };
      const ir = parser.toIR(ast);
      result.stages.astToIR.end = process.hrtime.bigint();
      result.stages.astToIR.durationNs = Number(result.stages.astToIR.end - result.stages.astToIR.start);
      result.stages.astToIR.irHash = this.hashIR(ir);

      // Stage 3: IR to target code
      result.stages.irToTarget = {
        start: process.hrtime.bigint(),
      };
      const targetCode = emitter.emit(ir);
      result.stages.irToTarget.end = process.hrtime.bigint();
      result.stages.irToTarget.durationNs = Number(result.stages.irToTarget.end - result.stages.irToTarget.start);
      result.stages.irToTarget.targetHash = this.hashCode(targetCode);

      // Stage 4: Reparse target code
      result.stages.reparsing = {
        start: process.hrtime.bigint(),
      };
      const reprParsed = parser.parse(targetCode);
      result.stages.reparsing.end = process.hrtime.bigint();
      result.stages.reparsing.durationNs = Number(result.stages.reparsing.end - result.stages.reparsing.start);
      result.stages.reparsing.astHash = this.hashAST(reprParsed);

      // Stage 5: Reparse AST to IR
      result.stages.reprAstToIR = {
        start: process.hrtime.bigint(),
      };
      const reprIR = parser.toIR(reprParsed);
      result.stages.reprAstToIR.end = process.hrtime.bigint();
      result.stages.reprAstToIR.durationNs = Number(result.stages.reprAstToIR.end - result.stages.reprAstToIR.start);
      result.stages.reprAstToIR.irHash = this.hashIR(reprIR);

      // Verify consistency
      const irConsistent = result.stages.astToIR.irHash === result.stages.reprAstToIR.irHash;
      result.irConsistent = irConsistent;

      if (!irConsistent) {
        result.errors.push('IR hash mismatch between first and second parse');
      }

      result.success = result.errors.length === 0;

      // Store IR hash for determinism verification
      this.irHashes.set(`${language}-${sourceCode.substring(0, 20)}`, result.stages.astToIR.irHash);

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    this.testResults.push(result);
    return result;
  }

  /**
   * Verify determinism across multiple runs
   * @param {string} sourceCode - Source code
   * @param {string} language - Language
   * @param {object} parser - Parser instance
   * @param {object} emitter - Emitter instance
   * @param {number} runs - Number of runs (default 10)
   * @returns {object} Determinism result
   */
  async verifyDeterminism(sourceCode, language, parser, emitter, runs = 10) {
    const hashes = [];
    const timings = [];

    for (let i = 0; i < runs; i++) {
      const result = await this.runRoundtrip(sourceCode, language, parser, emitter);
      if (result.success) {
        hashes.push(result.stages.astToIR.irHash);
        timings.push({
          parse: result.stages.parse.durationNs,
          astToIR: result.stages.astToIR.durationNs,
          irToTarget: result.stages.irToTarget.durationNs,
          reparsing: result.stages.reparsing.durationNs,
        });
      }
    }

    const uniqueHashes = new Set(hashes);
    const isDeterministic = uniqueHashes.size === 1;

    return {
      language,
      runs,
      isDeterministic,
      uniqueHashes: uniqueHashes.size,
      hashes: Array.from(uniqueHashes),
      timingStats: this.calculateTimingStats(timings),
    };
  }

  /**
   * Verify cross-language semantic equivalence
   * @param {object} sourceMap - Map of language -> source code
   * @param {object} parsers - Map of language -> parser
   * @param {object} emitters - Map of language -> emitter
   * @returns {object} Equivalence result
   */
  async verifyCrossLanguageEquivalence(sourceMap, parsers, emitters) {
    const irMap = new Map();
    const hashes = [];

    for (const [language, source] of Object.entries(sourceMap)) {
      try {
        const parser = parsers[language];
        const ast = parser.parse(source);
        const ir = parser.toIR(ast);
        const hash = this.hashIR(ir);
        irMap.set(language, { ir, hash });
        hashes.push(hash);
      } catch (error) {
        irMap.set(language, { error: error.message });
      }
    }

    const uniqueHashes = new Set(hashes);
    const isEquivalent = uniqueHashes.size === 1;

    return {
      languages: Object.keys(sourceMap),
      isEquivalent,
      uniqueHashes: uniqueHashes.size,
      irMap: Object.fromEntries(
        Array.from(irMap.entries()).map(([lang, data]) => [lang, data.hash || data.error])
      ),
    };
  }

  /**
   * Calculate statistics for timing data
   */
  calculateTimingStats(timings) {
    if (timings.length === 0) return null;

    const phases = ['parse', 'astToIR', 'irToTarget', 'reparsing'];
    const stats = {};

    for (const phase of phases) {
      const values = timings.map(t => t[phase]);
      const sorted = values.sort((a, b) => a - b);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      stats[phase] = {
        mean: Math.round(mean / 1000), // Convert to microseconds
        median: Math.round(median / 1000),
        min: Math.round(min / 1000),
        max: Math.round(max / 1000),
        stdDev: Math.round(Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
        ) / 1000),
      };
    }

    return stats;
  }

  /**
   * Hash AST node for comparison
   */
  hashAST(ast) {
    const serialized = JSON.stringify(this.normalizeAST(ast));
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Normalize AST for hashing (remove non-semantic info)
   */
  normalizeAST(node) {
    if (!node) return null;
    if (Array.isArray(node)) return node.map(n => this.normalizeAST(n));
    if (typeof node !== 'object') return node;

    const normalized = {};
    for (const [key, value] of Object.entries(node)) {
      // Skip position/location info
      if (key === 'loc' || key === 'pos' || key === 'line' || key === 'column') continue;
      normalized[key] = this.normalizeAST(value);
    }
    return normalized;
  }

  /**
   * Hash IR for comparison
   */
  hashIR(ir) {
    const serialized = JSON.stringify(ir);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Hash source code
   */
  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Compare two roundtrip results for regressions
   */
  compareRoundtrips(before, after) {
    const regressions = [];

    if (before.irConsistent && !after.irConsistent) {
      regressions.push('Lost IR consistency');
    }
    if (!before.errors.length && after.errors.length) {
      regressions.push(`New errors: ${after.errors.join(', ')}`);
    }

    const beforeTime = before.stages.parse.durationNs + 
                       before.stages.astToIR.durationNs +
                       before.stages.irToTarget.durationNs;
    const afterTime = after.stages.parse.durationNs +
                      after.stages.astToIR.durationNs +
                      after.stages.irToTarget.durationNs;

    const timeIncrease = (afterTime - beforeTime) / beforeTime;
    if (timeIncrease > 0.1) { // 10% regression
      regressions.push(`Performance regression: +${Math.round(timeIncrease * 100)}%`);
    }

    return {
      hasRegressions: regressions.length > 0,
      regressions,
    };
  }

  /**
   * Generate roundtrip test report
   */
  generateReport() {
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    return {
      summary: {
        total,
        passed,
        failed,
        passRate: passed / total,
      },
      results: this.testResults,
      regressions: this.regressions,
    };
  }
}

module.exports = MultiLanguageRoundtripHarness;
