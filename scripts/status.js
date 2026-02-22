#!/usr/bin/env node

/**
 * 📊 LUASCRIPT STATUS - Quick Project Health Check
 * 
 * Fast status overview of LUASCRIPT project health
 * Shows key metrics, recent test results, and actionable insights
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(70));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(70));
}

function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════════╗', 'bright');
  log('║                 📊 LUASCRIPT PROJECT STATUS                   ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════╝', 'bright');

  // Check for latest Clarity Cannon report
  const reportPath = path.join('artifacts', 'clarity-cannon-report.json');
  
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const age = Math.floor((Date.now() - new Date(report.timestamp).getTime()) / 1000 / 60);
    
    header('🎯 Quality Score');
    const score = parseFloat(report.score);
    const barLength = Math.floor(score / 4);
    const bar = '█'.repeat(barLength) + '░'.repeat(25 - barLength);
    
    const scoreColor = score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red';
    log(`  ${bar} ${score.toFixed(1)}%`, scoreColor);
    log(`  Report age: ${age} minutes`, 'cyan');
    
    header('📋 Gate Summary');
    console.log(`  Passed:  ${report.passed}/${report.results.length}`);
    if (report.failed > 0) {
      log(`  Failed:  ${report.failed} (required)`, 'red');
    }
    
    // Show failing gates
    const failing = report.results.filter(r => !r.passed && r.required);
    if (failing.length > 0) {
      header('❌ Failing Gates');
      failing.forEach(f => {
        log(`  • ${f.name}`, 'red');
      });
    }
    
    // Show suggestions
    if (report.analysis && report.analysis.suggestions.length > 0) {
      header('💡 Top Actions');
      report.analysis.suggestions.slice(0, 3).forEach((s, i) => {
        log(`\n  ${i + 1}. ${s.gate}`, 'yellow');
        log(`     ${s.suggestion}`, 'cyan');
      });
    }
    
    // Quick commands
    header('⚡ Quick Commands');
    console.log(`  Run full check:  node scripts/clarity-cannon.js`);
    console.log(`  Run tests:       npm test`);
    console.log(`  Fix IR issues:   node scripts/debug-ir-schema.js`);
    
  } else {
    log('\n⚠️  No recent Clarity Cannon report found', 'yellow');
    log('\n  Run: node scripts/clarity-cannon.js\n', 'cyan');
  }
  
  // Git status
  try {
    header('📝 Git Status');
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const status = execSync('git status --short', { encoding: 'utf8' });
    
    log(`  Branch: ${branch}`, 'cyan');
    
    if (status.trim()) {
      const lines = status.trim().split('\n').slice(0, 5);
      log(`  Changes: ${lines.length}`, 'yellow');
      lines.forEach(line => {
        console.log(`    ${line}`);
      });
      if (status.trim().split('\n').length > 5) {
        log(`    ... and ${status.trim().split('\n').length - 5} more`, 'yellow');
      }
    } else {
      log(`  Working tree clean`, 'green');
    }
  } catch (e) {
    log(`  Git not available`, 'yellow');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

main();
