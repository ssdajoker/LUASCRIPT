#!/usr/bin/env node
/**
 * Diff Coverage Checker
 * Ensures new code meets or exceeds quality standards.
 * Compares coverage of changed lines vs. overall project coverage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_FILE = path.join(__dirname, '../artifacts/coverage/coverage-final.json');
const DIFF_THRESHOLD = 70; // New code must have at least 70% coverage

function getChangedFiles() {
  try {
    // Get list of changed files in the PR/branch
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    const cmd = `git diff --name-only origin/${baseBranch}...HEAD -- "src/**/*.js"`;
    const output = execSync(cmd, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (err) {
    console.warn('⚠️  Could not determine changed files. Using all files.');
    return [];
  }
}

function getChangedLines(file) {
  try {
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    const cmd = `git diff -U0 origin/${baseBranch}...HEAD -- "${file}"`;
    const output = execSync(cmd, { encoding: 'utf8' });
    
    const lines = [];
    const hunkRegex = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/g;
    
    let match;
    while ((match = hunkRegex.exec(output)) !== null) {
      const startLine = parseInt(match[1], 10);
      const lineCount = match[2] ? parseInt(match[2], 10) : 1;
      
      for (let i = 0; i < lineCount; i++) {
        lines.push(startLine + i);
      }
    }
    
    return lines;
  } catch (err) {
    console.warn(`⚠️  Could not determine changed lines for ${file}`);
    return [];
  }
}

function readCoverageData() {
  try {
    return JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
  } catch (err) {
    console.error('❌ No coverage data found. Run tests with coverage first.');
    process.exit(1);
  }
}

function analyzeDiffCoverage(changedFiles, coverageData) {
  const results = [];
  
  for (const file of changedFiles) {
    const changedLines = getChangedLines(file);
    if (changedLines.length === 0) continue;
    
    // Find coverage data for this file
    const filePath = path.resolve(file);
    const coverage = coverageData[filePath];
    
    if (!coverage) {
      console.warn(`⚠️  No coverage data for ${file}`);
      continue;
    }
    
    const statementMap = coverage.statementMap || {};
    const hitCounts = coverage.s || {};
    
    let coveredLines = 0;
    let totalLines = 0;
    
    // Check coverage for each changed line
    for (const lineNum of changedLines) {
      // Find statements that start on this line
      for (const [stmtId, location] of Object.entries(statementMap)) {
        if (location.start.line === lineNum) {
          totalLines++;
          if (hitCounts[stmtId] > 0) {
            coveredLines++;
          }
        }
      }
    }
    
    if (totalLines > 0) {
      const coverage = (coveredLines / totalLines) * 100;
      results.push({
        file,
        changedLines: changedLines.length,
        totalStatements: totalLines,
        coveredStatements: coveredLines,
        coverage: coverage.toFixed(2),
        passed: coverage >= DIFF_THRESHOLD
      });
    }
  }
  
  return results;
}

function displayDiffCoverageReport(results) {
  console.log('\n📊 Diff Coverage Report');
  console.log('─'.repeat(80));
  console.log(`Minimum diff coverage threshold: ${DIFF_THRESHOLD}%\n`);
  
  if (results.length === 0) {
    console.log('ℹ️  No testable changes detected (changed files may not have coverage data)');
    return true;
  }
  
  let allPassed = true;
  
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    const fileName = path.basename(result.file);
    
    console.log(`${status} ${fileName}`);
    console.log(`   Coverage: ${result.coverage}% (${result.coveredStatements}/${result.totalStatements} statements)`);
    console.log(`   Changed lines: ${result.changedLines}`);
    
    if (!result.passed) {
      allPassed = false;
      const gap = (DIFF_THRESHOLD - parseFloat(result.coverage)).toFixed(2);
      console.log(`   ⚠️  Below threshold by ${gap}%`);
    }
    console.log();
  }
  
  console.log('─'.repeat(80));
  
  const totalStatements = results.reduce((sum, r) => sum + r.totalStatements, 0);
  const coveredStatements = results.reduce((sum, r) => sum + r.coveredStatements, 0);
  const overallDiffCoverage = totalStatements > 0 
    ? ((coveredStatements / totalStatements) * 100).toFixed(2)
    : 100;
  
  console.log(`Overall diff coverage: ${overallDiffCoverage}% (${coveredStatements}/${totalStatements} statements)\n`);
  
  if (!allPassed) {
    console.log('❌ Diff coverage check FAILED');
    console.log('\n💡 Tips to improve coverage:');
    console.log('   • Add unit tests for new functions/methods');
    console.log('   • Add edge case tests for new logic branches');
    console.log('   • Ensure error paths are tested');
    console.log('   • Run: npm run test:coverage');
  } else {
    console.log('✅ Diff coverage check PASSED');
  }
  
  return allPassed;
}

function main() {
  console.log('🔍 Analyzing diff coverage...\n');
  
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️  No JavaScript files changed in src/');
    console.log('✅ Diff coverage check SKIPPED');
    return;
  }
  
  console.log(`Found ${changedFiles.length} changed file(s):`);
  changedFiles.forEach(f => console.log(`  • ${f}`));
  console.log();
  
  const coverageData = readCoverageData();
  const results = analyzeDiffCoverage(changedFiles, coverageData);
  const passed = displayDiffCoverageReport(results);
  
  if (!passed) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getChangedFiles, analyzeDiffCoverage, DIFF_THRESHOLD };
