#!/usr/bin/env node
/**
 * Coverage Ratchet System
 * Gradually increases coverage thresholds based on current coverage levels.
 * Prevents coverage from decreasing and encourages incremental improvement.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../.c8rc.json');
const SUMMARY_FILE = path.join(__dirname, '../coverage/coverage-summary.json');
const RATCHET_STATE_FILE = path.join(__dirname, '../.coverage-ratchet.json');

// Ratchet configuration
const RATCHET_CONFIG = {
  // Minimum improvement required to update threshold (percentage points)
  minImprovement: 0.5,
  
  // Maximum threshold increase per ratchet (percentage points)
  maxIncrease: 2.0,
  
  // Grace period before failing if below threshold (for flaky tests)
  gracePeriod: 0.5, // Allow 0.5% below threshold temporarily
  
  // Target thresholds (aspirational goals)
  targets: {
    lines: 80,
    functions: 75,
    branches: 70,
    statements: 80
  }
};

function readJson(filePath, defaultValue = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getCurrentCoverage() {
  const summary = readJson(SUMMARY_FILE);
  if (!summary.total) {
    console.error('⚠️  No coverage summary found. Run tests with coverage first.');
    return null;
  }
  
  return {
    lines: summary.total.lines.pct,
    functions: summary.total.functions.pct,
    branches: summary.total.branches.pct,
    statements: summary.total.statements.pct
  };
}

function getCurrentThresholds() {
  const config = readJson(CONFIG_FILE);
  return {
    lines: config.lines || 0,
    functions: config.functions || 0,
    branches: config.branches || 0,
    statements: config.statements || 0
  };
}

function getRatchetState() {
  return readJson(RATCHET_STATE_FILE, {
    history: [],
    lastUpdate: null,
    highWaterMarks: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0
    }
  });
}

function updateRatchet(coverage, thresholds) {
  const state = getRatchetState();
  const newThresholds = { ...thresholds };
  let updated = false;
  
  for (const metric of ['lines', 'functions', 'branches', 'statements']) {
    const current = coverage[metric];
    const threshold = thresholds[metric];
    const target = RATCHET_CONFIG.targets[metric];
    const highWater = state.highWaterMarks[metric];
    
    // Update high water mark
    if (current > highWater) {
      state.highWaterMarks[metric] = current;
    }
    
    // Check if we should ratchet up
    const improvement = current - threshold;
    if (improvement >= RATCHET_CONFIG.minImprovement && threshold < target) {
      const increase = Math.min(
        improvement,
        RATCHET_CONFIG.maxIncrease,
        target - threshold
      );
      newThresholds[metric] = Math.round((threshold + increase) * 10) / 10;
      updated = true;
      
      console.log(`📈 Ratcheting ${metric}: ${threshold}% → ${newThresholds[metric]}% (current: ${current.toFixed(2)}%)`);
    }
  }
  
  if (updated) {
    // Update config file
    const config = readJson(CONFIG_FILE);
    Object.assign(config, newThresholds);
    writeJson(CONFIG_FILE, config);
    
    // Update ratchet state
    state.lastUpdate = new Date().toISOString();
    state.history.push({
      timestamp: new Date().toISOString(),
      coverage,
      thresholds: newThresholds
    });
    
    // Keep only last 20 entries
    if (state.history.length > 20) {
      state.history = state.history.slice(-20);
    }
    
    writeJson(RATCHET_STATE_FILE, state);
    
    console.log('✅ Coverage thresholds updated');
  } else {
    console.log('ℹ️  No threshold updates needed (coverage within ratchet range)');
  }
  
  return newThresholds;
}

function checkThresholds(coverage, thresholds) {
  let passed = true;
  const failures = [];
  
  for (const metric of ['lines', 'functions', 'branches', 'statements']) {
    const current = coverage[metric];
    const threshold = thresholds[metric];
    const grace = threshold - RATCHET_CONFIG.gracePeriod;
    
    if (current < grace) {
      passed = false;
      failures.push({
        metric,
        current: current.toFixed(2),
        threshold: threshold.toFixed(2),
        diff: (current - threshold).toFixed(2)
      });
    }
  }
  
  return { passed, failures };
}

function displayReport(coverage, thresholds, check) {
  console.log('\n📊 Coverage Report');
  console.log('─'.repeat(60));
  
  const metrics = ['lines', 'functions', 'branches', 'statements'];
  for (const metric of metrics) {
    const current = coverage[metric];
    const threshold = thresholds[metric];
    const target = RATCHET_CONFIG.targets[metric];
    const status = current >= threshold ? '✅' : '❌';
    
    const bar = '█'.repeat(Math.round(current / 2)) + '░'.repeat(Math.round((100 - current) / 2));
    console.log(`${status} ${metric.padEnd(12)}: ${current.toFixed(2)}% ${bar}`);
    console.log(`   ${''.padEnd(12)}  threshold: ${threshold.toFixed(2)}% | target: ${target.toFixed(2)}%`);
  }
  
  console.log('─'.repeat(60));
  
  if (!check.passed) {
    console.log('\n❌ Coverage check FAILED');
    console.log('\nFailures:');
    for (const failure of check.failures) {
      console.log(`  • ${failure.metric}: ${failure.current}% < ${failure.threshold}% (${failure.diff}%)`);
    }
  } else {
    console.log('\n✅ Coverage check PASSED');
  }
}

function main() {
  const command = process.argv[2] || 'check';
  
  const coverage = getCurrentCoverage();
  if (!coverage) {
    process.exit(1);
  }
  
  const thresholds = getCurrentThresholds();
  
  if (command === 'ratchet') {
    updateRatchet(coverage, thresholds);
  } else if (command === 'check') {
    const check = checkThresholds(coverage, thresholds);
    displayReport(coverage, thresholds, check);
    
    if (!check.passed) {
      process.exit(1);
    }
  } else if (command === 'report') {
    const check = checkThresholds(coverage, thresholds);
    displayReport(coverage, thresholds, check);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node coverage-ratchet.js [check|ratchet|report]');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentCoverage, updateRatchet, checkThresholds };
