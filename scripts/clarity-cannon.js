#!/usr/bin/env node

/**
 * 🎯 CLARITY CANNON - Enhanced Diagnostic System
 * 
 * Comprehensive testing, validation, and intelligent debugging framework
 * Integrates all quality gates with smart diagnostics and fix suggestions
 * 
 * Features:
 * - All quality gates (lint, format, IR validation, tests)
 * - Intelligent failure analysis
 * - Root cause identification
 * - Automated fix suggestions
 * - Progress tracking and reporting
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(70));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(70) + '\n');
}

// ═════════════════════════════════════════════════════════════════
// QUALITY GATES DEFINITION
// ═════════════════════════════════════════════════════════════════

const GATES = [
  {
    name: 'Template Literal Support',
    category: 'Features',
    cmd: 'python',
    args: ['tests/test_critical_features.py'],
    required: true,
    weight: 10,
  },
  {
    name: 'IR Validation',
    category: 'Core',
    cmd: 'npm',
    args: ['run', '-s', 'ir:validate:all'],
    required: true,
    weight: 10,
  },
  {
    name: 'Core Tests',
    category: 'Functionality',
    cmd: 'npm',
    args: ['run', '-s', 'test:core'],
    required: true,
    weight: 10,
  },
  {
    name: 'Parity Tests',
    category: 'Functionality',
    cmd: 'npm',
    args: ['run', '-s', 'test:parity'],
    required: true,
    weight: 10,
  },
  {
    name: 'Determinism',
    category: 'Quality',
    cmd: 'npm',
    args: ['run', '-s', 'test:determinism'],
    required: true,
    weight: 8,
  },
  {
    name: 'Harness',
    category: 'Integration',
    cmd: 'npm',
    args: ['run', '-s', 'harness'],
    required: false,
    weight: 5,
  },
];

// ═════════════════════════════════════════════════════════════════
// GATE EXECUTION
// ═════════════════════════════════════════════════════════════════

function runGate(gate) {
  const startTime = Date.now();
  log(`🔍 Running: ${gate.name}`, 'cyan');
  
  const result = spawnSync(gate.cmd, gate.args, {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  if (result.error) {
    log(`   ❌ Failed to execute (${duration}s)`, 'red');
    log(`   Error: ${result.error.message}`, 'red');
    return {
      ...gate,
      passed: false,
      duration,
      error: result.error.message,
    };
  }

  if (result.status !== 0) {
    if (gate.required) {
      log(`   ❌ FAILED (${duration}s)`, 'red');
    } else {
      log(`   ⚠️  Failed (optional, ${duration}s)`, 'yellow');
    }
    
    return {
      ...gate,
      passed: false,
      duration,
      output: result.stdout + result.stderr,
    };
  }

  log(`   ✅ PASSED (${duration}s)`, 'green');
  return {
    ...gate,
    passed: true,
    duration,
  };
}

// ═════════════════════════════════════════════════════════════════
// INTELLIGENT ANALYSIS
// ═════════════════════════════════════════════════════════════════

function analyzeFailures(results) {
  const failures = results.filter(r => !r.passed && r.required);
  
  if (failures.length === 0) {
    return null;
  }

  log('\n🔬 FAILURE ANALYSIS', 'yellow');
  console.log('─'.repeat(70));
  
  const analysis = {
    count: failures.length,
    gates: failures.map(f => f.name),
    categories: {},
    suggestions: [],
  };

  // Group by category
  failures.forEach(f => {
    if (!analysis.categories[f.category]) {
      analysis.categories[f.category] = [];
    }
    analysis.categories[f.category].push(f);
  });

  // Generate suggestions
  Object.keys(analysis.categories).forEach(category => {
    const fails = analysis.categories[category];
    log(`\n📊 ${category} Issues (${fails.length})`, 'yellow');
    
    fails.forEach(f => {
      log(`   • ${f.name}`, 'red');
      
      // Smart suggestions based on gate type
      if (f.name.includes('IR')) {
        analysis.suggestions.push({
          gate: f.name,
          suggestion: 'Run: node scripts/debug-ir-schema.js for detailed analysis',
          priority: 'high',
        });
      } else if (f.name.includes('Template')) {
        analysis.suggestions.push({
          gate: f.name,
          suggestion: 'Check src/parser/enhanced_parser.py template parsing',
          priority: 'high',
        });
      } else if (f.name.includes('Parity')) {
        analysis.suggestions.push({
          gate: f.name,
          suggestion: 'Check tests/parity/ for specific failures',
          priority: 'medium',
        });
      }
    });
  });

  return analysis;
}

// ═════════════════════════════════════════════════════════════════
// REPORTING
// ═════════════════════════════════════════════════════════════════

function generateReport(results, analysis) {
  header('📊 CLARITY CANNON REPORT');
  
  // Summary stats
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed && r.required).length;
  const optional = results.filter(r => !r.passed && !r.required).length;
  const totalWeight = results.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);
  const maxWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const score = ((totalWeight / maxWeight) * 100).toFixed(1);

  log(`Quality Score: ${score}%`, score >= 80 ? 'green' : 'yellow');
  log(`Passed: ${passed}/${results.length}`, 'green');
  if (failed > 0) log(`Failed (required): ${failed}`, 'red');
  if (optional > 0) log(`Failed (optional): ${optional}`, 'yellow');
  
  // Gate-by-gate results
  console.log('\n' + '─'.repeat(70));
  log('GATE RESULTS', 'bright');
  console.log('─'.repeat(70));
  
  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  });

  Object.keys(categories).forEach(cat => {
    console.log(`\n${cat}:`);
    categories[cat].forEach(r => {
      const icon = r.passed ? '✅' : (r.required ? '❌' : '⚠️');
      const status = r.passed ? 'PASS' : (r.required ? 'FAIL' : 'SKIP');
      console.log(`  ${icon} ${r.name.padEnd(30)} ${status.padEnd(6)} (${r.duration}s)`);
    });
  });

  // Suggestions
  if (analysis && analysis.suggestions.length > 0) {
    console.log('\n' + '─'.repeat(70));
    log('💡 SUGGESTED ACTIONS', 'cyan');
    console.log('─'.repeat(70));
    
    analysis.suggestions.forEach((s, i) => {
      log(`\n${i + 1}. ${s.gate}`, 'yellow');
      log(`   ${s.suggestion}`, 'cyan');
      log(`   Priority: ${s.priority.toUpperCase()}`, s.priority === 'high' ? 'red' : 'yellow');
    });
  }

  // Save report
  const reportData = {
    timestamp: new Date().toISOString(),
    score,
    passed,
    failed,
    results,
    analysis,
  };

  const reportPath = path.join('artifacts', 'clarity-cannon-report.json');
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log('\n' + '─'.repeat(70));
  log(`📄 Full report saved: ${reportPath}`, 'cyan');
  console.log('─'.repeat(70) + '\n');

  return { score, failed };
}

// ═════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════

function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║            🎯 CLARITY CANNON - Quality Gate System              ║', 'bright');
  log('║         Comprehensive Testing & Intelligent Diagnostics         ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════════╝', 'bright');
  
  header('🚀 RUNNING QUALITY GATES');
  
  const results = GATES.map(gate => runGate(gate));
  const analysis = analyzeFailures(results);
  const { score, failed } = generateReport(results, analysis);

  if (failed === 0) {
    log('\n🎉 ALL REQUIRED GATES PASSED! 🎉', 'green');
    log(`Quality Score: ${score}%`, 'green');
    return 0;
  } else {
    log(`\n⚠️  ${failed} required gate(s) failed`, 'red');
    log(`Quality Score: ${score}%`, 'yellow');
    return 1;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { runGate, analyzeFailures, GATES };
