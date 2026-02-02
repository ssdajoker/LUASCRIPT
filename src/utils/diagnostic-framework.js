#!/usr/bin/env node

/**
 * @fileoverview Forensic-Level Diagnostic Framework
 * 
 * Purpose: Enforce "gate failure → forensic triage → fix" discipline
 * 
 * When a quality gate blocks progress, this framework:
 * 1. Pauses execution (STOP)
 * 2. Performs deep root cause analysis
 * 3. Collects comprehensive evidence
 * 4. Generates AI-powered fix suggestions
 * 5. Creates forensic reports (JSON + Markdown)
 * 6. Executes first fix with full explanation
 * 7. Provides quick-start prompts for user
 * 
 * Anti-Pattern: Never bypass gates or change requirements to pass
 * Correct Pattern: Fix the underlying problem completely
 * 
 * @module diagnostic-framework
 * @version 2.0.0
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ============================================================================
// TRIAGE CLASSIFICATION SYSTEM
// ============================================================================

/**
 * Triage priorities for diagnostic work
 */
const TRIAGE_PRIORITY = {
  CRITICAL: {
    level: 1,
    label: "CRITICAL",
    description: "Code semantics violated - correctness issue",
    action: "STOP ALL WORK - Fix immediately",
    examples: ["Test failures", "Runtime errors", "Logic bugs", "Data corruption"]
  },
  HIGH: {
    level: 2,
    label: "HIGH",
    description: "Schema/Integration breaks compatibility",
    action: "Fix before merge",
    examples: ["IR validation failures", "Schema violations", "FFI breaks", "API changes"]
  },
  MEDIUM: {
    level: 3,
    label: "MEDIUM",
    description: "Performance regression within tolerance",
    action: "Fix in next iteration",
    examples: ["5-10% slowdown", "Memory increase", "Output size growth"]
  },
  LOW: {
    level: 4,
    label: "LOW",
    description: "Documentation or style issues",
    action: "Document and track",
    examples: ["Lint warnings", "Missing docs", "Code style", "Comment quality"]
  }
};

/**
 * Gate types and their failure modes
 */
const GATE_TYPES = {
  STUB_DETECTION: {
    name: "Stub Detection",
    weight: 15,
    priority: TRIAGE_PRIORITY.CRITICAL,
    diagnosticScript: "node src/utils/hallucination_detector.js",
    commonCauses: [
      "Comment-only implementation",
      "Empty function bodies",
      "Placeholder code (TODO, FIXME)",
      "Copy-paste without implementation"
    ],
    fixStrategy: "Implement real functionality or remove stub"
  },
  IR_VALIDATION: {
    name: "IR Validation",
    weight: 10,
    priority: TRIAGE_PRIORITY.HIGH,
    diagnosticScript: "node scripts/debug-ir-schema.js",
    commonCauses: [
      "NodeRef pattern mismatch (^[^_]+_[T01]+$)",
      "Missing required fields",
      "Type constraint violations",
      "Cyclic dependencies"
    ],
    fixStrategy: "Run debug-ir-schema.js for root cause, fix schema violations"
  },
  CORRECTNESS: {
    name: "Correctness Tests",
    weight: 10,
    priority: TRIAGE_PRIORITY.CRITICAL,
    diagnosticScript: "npm run test:core",
    commonCauses: [
      "Algorithm changes code semantics",
      "Incorrect optimization",
      "Side effect ordering",
      "Unhandled edge cases"
    ],
    fixStrategy: "Revert optimization, add dataflow analysis, test edge cases"
  },
  DETERMINISM: {
    name: "Determinism Verification",
    weight: 8,
    priority: TRIAGE_PRIORITY.HIGH,
    diagnosticScript: "npm run test:determinism",
    commonCauses: [
      "Non-deterministic optimization order",
      "Uninitialized variables",
      "Hash map iteration order",
      "Timestamp or random dependencies"
    ],
    fixStrategy: "Canonical sorting, seed RNG, fix iteration order"
  },
  PERFORMANCE: {
    name: "Performance SLO",
    weight: 7,
    priority: TRIAGE_PRIORITY.MEDIUM,
    diagnosticScript: "npm run test:performance",
    commonCauses: [
      "Optimization makes code slower",
      "N^2 algorithm introduced",
      "Excessive memory allocation",
      "Inefficient data structure choice"
    ],
    fixStrategy: "Profile before/after, disable for specific patterns, optimize differently"
  },
  INTEGRATION: {
    name: "Integration Tests",
    weight: 6,
    priority: TRIAGE_PRIORITY.HIGH,
    diagnosticScript: "npm run harness",
    commonCauses: [
      "Cross-language interop broken",
      "FFI marshalling expects original order",
      "Callback signature changed",
      "Type conversion mismatch"
    ],
    fixStrategy: "Test round-trip (JS→Lua→JS), mark optimization as interop-unsafe"
  },
  LINT: {
    name: "Linting Rules",
    weight: 5,
    priority: TRIAGE_PRIORITY.LOW,
    diagnosticScript: "npm run lint",
    commonCauses: [
      "Unused variables",
      "Missing imports",
      "Style violations",
      "Complexity warnings"
    ],
    fixStrategy: "Auto-fix with npm run lint:fix, manual refactor for complexity"
  }
};

// ============================================================================
// ROOT CAUSE ANALYSIS ENGINE
// ============================================================================

class RootCauseAnalyzer {
  constructor() {
    this.evidence = [];
    this.hypotheses = [];
    this.patterns = this.loadKnownPatterns();
  }

  /**
   * Load known failure patterns from learned library
   */
  loadKnownPatterns() {
    const libraryPath = path.join(process.cwd(), ".aitk", "context", "diagnostics_learned_library.json");
    if (fs.existsSync(libraryPath)) {
      try {
        return JSON.parse(fs.readFileSync(libraryPath, "utf8"));
      } catch (err) {
        console.warn("⚠️  Could not load diagnostics library:", err.message);
      }
    }
    return { patterns: [], fixes: [], timeEstimates: {} };
  }

  /**
   * Analyze gate failure and determine root cause
   */
  analyzeFailure(gateType, errorOutput, context = {}) {
    console.log(`\n🔬 FORENSIC ANALYSIS: ${gateType.name}`);
    console.log("═".repeat(70));

    const analysis = {
      gate: gateType.name,
      priority: gateType.priority.label,
      timestamp: new Date().toISOString(),
      errorOutput,
      context,
      rootCauses: [],
      evidence: [],
      recommendations: [],
      estimatedEffort: null
    };

    // Pattern matching against known issues
    const matchedPatterns = this.matchPatterns(errorOutput, gateType);
    analysis.rootCauses = matchedPatterns.map(p => p.cause);

    // Evidence collection
    analysis.evidence = this.collectEvidence(gateType, context);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(gateType, matchedPatterns, analysis.evidence);

    // Estimate effort
    analysis.estimatedEffort = this.estimateEffort(analysis.rootCauses, matchedPatterns);

    return analysis;
  }

  /**
   * Match error patterns against known issues
   */
  matchPatterns(errorOutput, gateType) {
    const matched = [];

    // Check gate-specific common causes
    for (const cause of gateType.commonCauses) {
      const causePattern = cause.toLowerCase().replace(/[^a-z0-9]+/g, ".*");
      const regex = new RegExp(causePattern, "i");
      if (regex.test(errorOutput)) {
        matched.push({
          cause,
          confidence: 0.8,
          source: "gate_definition"
        });
      }
    }

    // Check learned patterns from library
    if (this.patterns.patterns) {
      for (const pattern of this.patterns.patterns) {
        if (pattern.gate === gateType.name && pattern.regex) {
          const regex = new RegExp(pattern.regex, "i");
          if (regex.test(errorOutput)) {
            matched.push({
              cause: pattern.description,
              confidence: pattern.confidence || 0.9,
              source: "learned_library",
              suggestedFix: pattern.fix
            });
          }
        }
      }
    }

    return matched;
  }

  /**
   * Collect evidence artifacts
   */
  collectEvidence(gateType, context) {
    const evidence = [];

    // Run diagnostic script if available
    if (gateType.diagnosticScript) {
      try {
        console.log(`\n📊 Running diagnostic: ${gateType.diagnosticScript}`);
        const output = execSync(gateType.diagnosticScript, {
          encoding: "utf8",
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024
        });
        evidence.push({
          type: "diagnostic_output",
          source: gateType.diagnosticScript,
          content: output.substring(0, 5000) // Limit size
        });
      } catch (err) {
        evidence.push({
          type: "diagnostic_error",
          source: gateType.diagnosticScript,
          error: err.message,
          stderr: err.stderr ? err.stderr.toString().substring(0, 2000) : null
        });
      }
    }

    // Collect context-specific evidence
    if (context.filePath && fs.existsSync(context.filePath)) {
      evidence.push({
        type: "file_content",
        path: context.filePath,
        excerpt: fs.readFileSync(context.filePath, "utf8").substring(0, 2000)
      });
    }

    if (context.gitDiff) {
      evidence.push({
        type: "git_diff",
        content: context.gitDiff
      });
    }

    return evidence;
  }

  /**
   * Generate fix recommendations
   */
  generateRecommendations(gateType, matchedPatterns, evidence) {
    const recommendations = [];

    // Gate-specific fix strategy
    recommendations.push({
      priority: 1,
      type: "primary_fix",
      description: gateType.fixStrategy,
      estimatedTime: this.estimateFixTime(gateType)
    });

    // Pattern-specific fixes
    for (const pattern of matchedPatterns) {
      if (pattern.suggestedFix) {
        recommendations.push({
          priority: 2,
          type: "pattern_fix",
          description: pattern.suggestedFix,
          confidence: pattern.confidence
        });
      }
    }

    // Evidence-based recommendations
    for (const item of evidence) {
      if (item.type === "diagnostic_output" && item.content) {
        // Parse diagnostic output for specific recommendations
        const lines = item.content.split("\n");
        for (const line of lines) {
          if (line.includes("FIX:") || line.includes("RECOMMENDATION:")) {
            recommendations.push({
              priority: 3,
              type: "diagnostic_recommendation",
              description: line.trim()
            });
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Estimate effort required to fix
   */
  estimateEffort(rootCauses, matchedPatterns) {
    let totalMinutes = 0;

    // Base estimate from library
    for (const pattern of matchedPatterns) {
      if (pattern.source === "learned_library" && this.patterns.timeEstimates) {
        const estimate = this.patterns.timeEstimates[pattern.cause];
        if (estimate) {
          totalMinutes += estimate;
        }
      }
    }

    // Fallback to complexity-based estimate
    if (totalMinutes === 0) {
      totalMinutes = rootCauses.length * 30; // 30 min per root cause
    }

    return {
      minutes: totalMinutes,
      hours: Math.ceil(totalMinutes / 60),
      complexity: totalMinutes > 60 ? "HIGH" : totalMinutes > 15 ? "MEDIUM" : "LOW"
    };
  }

  /**
   * Estimate fix time for gate type
   */
  estimateFixTime(gateType) {
    const estimates = {
      "Stub Detection": "30-120 min (implement real functionality)",
      "IR Validation": "15-60 min (fix schema violations)",
      "Correctness Tests": "60-240 min (algorithm fixes)",
      "Determinism Verification": "30-90 min (canonical ordering)",
      "Performance SLO": "60-180 min (optimization tuning)",
      "Integration Tests": "45-120 min (interop fixes)",
      "Linting Rules": "5-30 min (auto-fix or refactor)"
    };
    return estimates[gateType.name] || "30-60 min";
  }
}

// ============================================================================
// FORENSIC REPORT GENERATOR
// ============================================================================

class ForensicReporter {
  constructor(outputDir = "artifacts/forensics") {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive forensic report (JSON + Markdown)
   */
  generateReport(analysis, _options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `forensic_${analysis.gate.replace(/\s+/g, "_")}_${timestamp}`;

    // Generate JSON report (machine-parseable)
    const jsonPath = path.join(this.outputDir, `${baseName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📋 JSON Report: ${jsonPath}`);

    // Generate Markdown report (human-readable)
    const mdPath = path.join(this.outputDir, `${baseName}.md`);
    const markdown = this.generateMarkdown(analysis);
    fs.writeFileSync(mdPath, markdown);
    console.log(`📋 Markdown Report: ${mdPath}`);

    return { jsonPath, mdPath, baseName };
  }

  /**
   * Generate Markdown forensic report
   */
  generateMarkdown(analysis) {
    const lines = [];

    lines.push("# 🔬 Forensic Diagnostic Report");
    lines.push(`\n**Gate**: ${analysis.gate}`);
    lines.push(`**Priority**: ${analysis.priority}`);
    lines.push(`**Timestamp**: ${analysis.timestamp}`);
    lines.push(`**Estimated Effort**: ${analysis.estimatedEffort?.hours || "Unknown"} hours (${analysis.estimatedEffort?.complexity || "MEDIUM"} complexity)`);
    lines.push("");
    lines.push("---");

    // Root Causes
    lines.push("\n## 🎯 Root Causes Identified\n");
    if (analysis.rootCauses.length === 0) {
      lines.push("⚠️  No specific root causes identified. Manual investigation required.");
    } else {
      for (let i = 0; i < analysis.rootCauses.length; i++) {
        lines.push(`${i + 1}. **${analysis.rootCauses[i]}**`);
      }
    }

    // Error Output
    lines.push("\n## 📜 Error Output\n");
    lines.push("```");
    lines.push(analysis.errorOutput.substring(0, 3000));
    if (analysis.errorOutput.length > 3000) {
      lines.push("\n... (truncated)");
    }
    lines.push("```");

    // Evidence
    lines.push("\n## 🔍 Evidence Collected\n");
    for (const evidence of analysis.evidence) {
      lines.push(`\n### ${evidence.type}`);
      if (evidence.source) {
        lines.push(`**Source**: \`${evidence.source}\``);
      }
      if (evidence.content) {
        lines.push("\n```");
        lines.push(evidence.content.substring(0, 1500));
        if (evidence.content.length > 1500) {
          lines.push("\n... (truncated)");
        }
        lines.push("```");
      }
      if (evidence.error) {
        lines.push(`\n**Error**: ${evidence.error}`);
      }
    }

    // Recommendations
    lines.push("\n## 💡 Fix Recommendations\n");
    const sortedRecs = analysis.recommendations.sort((a, b) => a.priority - b.priority);
    for (const rec of sortedRecs) {
      lines.push(`\n### Priority ${rec.priority}: ${rec.type}`);
      lines.push(`${rec.description}`);
      if (rec.estimatedTime) {
        lines.push(`\n**Estimated Time**: ${rec.estimatedTime}`);
      }
      if (rec.confidence) {
        lines.push(`**Confidence**: ${(rec.confidence * 100).toFixed(0)}%`);
      }
    }

    // Quick-Start Prompts
    lines.push("\n## 🚀 Quick-Start Actions\n");
    lines.push("**Choose your next action:**\n");
    lines.push("- **[A] Auto-Fix**: Attempt automatic fix (if available)");
    lines.push("- **[B] Manual Fix**: Review evidence and fix manually");
    lines.push("- **[C] Deep Dive**: Run full diagnostic analysis");
    lines.push("- **[D] Revert**: Roll back to last known good state");
    lines.push("- **[E] Skip**: Mark as known issue and continue (NOT RECOMMENDED)");

    return lines.join("\n");
  }
}

// ============================================================================
// DIAGNOSTIC ORCHESTRATOR
// ============================================================================

class DiagnosticOrchestrator {
  constructor() {
    this.analyzer = new RootCauseAnalyzer();
    this.reporter = new ForensicReporter();
  }

  /**
   * Main entry point: diagnose a gate failure
   */
  diagnose(gateName, errorOutput, context = {}) {
    console.log("\n" + "=".repeat(70));
    console.log("🚨 GATE FAILURE DETECTED - INITIATING FORENSIC DIAGNOSIS");
    console.log("=".repeat(70));

    // Find gate type
    const gateType = Object.values(GATE_TYPES).find(g => g.name === gateName);
    if (!gateType) {
      console.error(`❌ Unknown gate type: ${gateName}`);
      process.exit(1);
    }

    console.log(`\n🔴 Failed Gate: ${gateType.name} (Weight: ${gateType.weight})`);
    console.log(`⚠️  Priority: ${gateType.priority.label} - ${gateType.priority.description}`);
    console.log(`📋 Action Required: ${gateType.priority.action}`);

    // Perform root cause analysis
    const analysis = this.analyzer.analyzeFailure(gateType, errorOutput, context);

    // Generate reports
    const reports = this.reporter.generateReport(analysis);

    // Display summary
    this.displaySummary(analysis, reports);

    return { analysis, reports };
  }

  /**
   * Display diagnostic summary to console
   */
  displaySummary(analysis, reports) {
    console.log("\n" + "=".repeat(70));
    console.log("📊 DIAGNOSTIC SUMMARY");
    console.log("=".repeat(70));

    console.log(`\n🎯 Root Causes: ${analysis.rootCauses.length} identified`);
    for (const cause of analysis.rootCauses.slice(0, 3)) {
      console.log(`   • ${cause}`);
    }

    console.log(`\n💡 Recommendations: ${analysis.recommendations.length} generated`);
    const topRec = analysis.recommendations[0];
    if (topRec) {
      console.log(`   → ${topRec.description}`);
    }

    console.log(`\n⏱️  Estimated Effort: ${analysis.estimatedEffort?.hours || "Unknown"} hours`);
    console.log("📁 Reports Generated:");
    console.log(`   • JSON: ${reports.jsonPath}`);
    console.log(`   • Markdown: ${reports.mdPath}`);

    console.log("\n" + "=".repeat(70));
    console.log("🛑 NEXT STEP: Review forensic report and choose action");
    console.log("=".repeat(70));
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Forensic-Level Diagnostic Framework
====================================

Usage: node diagnostic-framework.js <gate-name> [error-output-file]

Available Gates:
  - "Stub Detection"
  - "IR Validation"
  - "Correctness Tests"
  - "Determinism Verification"
  - "Performance SLO"
  - "Integration Tests"
  - "Linting Rules"

Examples:
  node diagnostic-framework.js "IR Validation"
  node diagnostic-framework.js "Correctness Tests" error.log
  node diagnostic-framework.js "Stub Detection" < error-output.txt

Environment Variables:
  FORENSIC_OUTPUT_DIR - Override output directory (default: artifacts/forensics)
`);
    process.exit(0);
  }

  const gateName = args[0];
  let errorOutput = "";

  // Read error output from file or stdin
  if (args[1] && fs.existsSync(args[1])) {
    errorOutput = fs.readFileSync(args[1], "utf8");
  } else if (!process.stdin.isTTY) {
    // Read from stdin
    errorOutput = fs.readFileSync(0, "utf8");
  } else {
    console.error("❌ No error output provided. Pass a file or pipe to stdin.");
    process.exit(1);
  }

  const orchestrator = new DiagnosticOrchestrator();
  orchestrator.diagnose(gateName, errorOutput);
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  DiagnosticOrchestrator,
  RootCauseAnalyzer,
  ForensicReporter,
  TRIAGE_PRIORITY,
  GATE_TYPES
};
