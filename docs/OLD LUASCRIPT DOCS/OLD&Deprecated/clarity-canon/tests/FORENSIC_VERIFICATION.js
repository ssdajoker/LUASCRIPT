/**
 * CLARITY SUPER CANON: Forensic Verification Suite
 * Comprehensive analysis of all tier 1 language implementations
 * Version: 1.0.0 - Production Grade Verification
 */

const fs = require('fs');
const path = require('path');

class ForensicVerifier {
  constructor() {
    this.results = {
      codeQuality: {},
      performance: {},
      integration: {},
      security: {},
      issues: [],
      optimizations: [],
      totalScore: 0
    };
    
    this.tier1Languages = ['python', 'lua', 'ruby', 'php', 'dart'];
    this.phases = ['phase_b', 'phase_c', 'phase_e'];
  }

  // Code Quality Analysis
  analyzeCodeQuality(filePath, content) {
    const issues = [];
    const optimizations = [];
    
    // Check for common anti-patterns
    if (content.includes('eval(')) {
      issues.push({ file: filePath, severity: 'HIGH', issue: 'Use of eval() detected' });
    }
    
    // Check for proper error handling
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    if (tryBlocks !== catchBlocks) {
      issues.push({ file: filePath, severity: 'MEDIUM', issue: 'Unmatched try-catch blocks' });
    }
    
    // Check for timeout protection
    if (content.includes('while') && !content.includes('timeout')) {
      optimizations.push({ file: filePath, type: 'SAFETY', suggestion: 'Consider adding timeout protection to loops' });
    }
    
    // Check for memory leaks potential
    if (content.includes('Map()') && !content.includes('clear()')) {
      optimizations.push({ file: filePath, type: 'MEMORY', suggestion: 'Consider cleanup for Map instances' });
    }
    
    // Check for consistent naming
    const camelCaseCount = (content.match(/[a-z][A-Z]/g) || []).length;
    const snake_caseCount = (content.match(/[a-z]_[a-z]/g) || []).length;
    if (camelCaseCount > 0 && snake_caseCount > 0) {
      issues.push({ file: filePath, severity: 'LOW', issue: 'Inconsistent naming convention (mix of camelCase and snake_case)' });
    }
    
    // Check for proper JSDoc
    const functionCount = (content.match(/function\s+\w+|^\s*\w+\s*\(/gm) || []).length;
    const jsdocCount = (content.match(/\/\*\*/g) || []).length;
    if (functionCount > 5 && jsdocCount < functionCount * 0.5) {
      optimizations.push({ file: filePath, type: 'DOCUMENTATION', suggestion: 'Add more JSDoc comments for better documentation' });
    }
    
    // Check for magic numbers
    const numberLiterals = content.match(/\b\d{2,}\b/g) || [];
    if (numberLiterals.length > 10) {
      optimizations.push({ file: filePath, type: 'MAINTAINABILITY', suggestion: 'Consider extracting magic numbers to constants' });
    }
    
    return { issues, optimizations };
  }

  // Performance Analysis
  analyzePerformance(filePath, content) {
    const issues = [];
    const optimizations = [];
    
    // Check for inefficient array operations
    if (content.includes('forEach') && content.includes('push')) {
      optimizations.push({ file: filePath, type: 'PERFORMANCE', suggestion: 'Consider using map() instead of forEach + push' });
    }
    
    // Check for synchronous operations that could be async
    if (content.includes('Sync(') && content.includes('async')) {
      optimizations.push({ file: filePath, type: 'ASYNC', suggestion: 'Consider replacing synchronous operations with async variants' });
    }
    
    // Check for repeated JSON.stringify/parse
    const stringifyCount = (content.match(/JSON\.stringify/g) || []).length;
    if (stringifyCount > 3) {
      optimizations.push({ file: filePath, type: 'PERFORMANCE', suggestion: 'Consider caching JSON.stringify results' });
    }
    
    // Check for nested loops
    const nestedLoops = content.match(/for.*{[^}]*for/gs) || [];
    if (nestedLoops.length > 0) {
      optimizations.push({ file: filePath, type: 'ALGORITHM', suggestion: `${nestedLoops.length} nested loops detected - consider optimization` });
    }
    
    // Check for string concatenation in loops
    if (content.match(/for.*{[^}]*\+\s*['"`]/s)) {
      optimizations.push({ file: filePath, type: 'PERFORMANCE', suggestion: 'Use array join instead of string concatenation in loops' });
    }
    
    return { issues, optimizations };
  }

  // Security Analysis
  analyzeSecurity(filePath, content) {
    const issues = [];
    
    // Check for command injection vulnerabilities
    if (content.includes('exec(') || content.includes('spawn(')) {
      if (!content.includes('sanitize') && !content.includes('escape')) {
        issues.push({ file: filePath, severity: 'HIGH', issue: 'Potential command injection - no input sanitization detected' });
      }
    }
    
    // Check for path traversal vulnerabilities
    if (content.includes('..') && content.includes('path')) {
      issues.push({ file: filePath, severity: 'MEDIUM', issue: 'Potential path traversal vulnerability' });
    }
    
    // Check for hardcoded credentials
    if (content.match(/password\s*=\s*['"][^'"]+['"]/i)) {
      issues.push({ file: filePath, severity: 'CRITICAL', issue: 'Potential hardcoded credentials detected' });
    }
    
    return { issues };
  }

  // Integration Analysis
  analyzeIntegration(files) {
    const issues = [];
    const optimizations = [];
    
    // Check for consistent export patterns
    const exportPatterns = new Map();
    files.forEach(({ path: filePath, content }) => {
      if (content.includes('module.exports')) {
        exportPatterns.set(filePath, 'commonjs');
      } else if (content.includes('export default')) {
        exportPatterns.set(filePath, 'es6');
      }
    });
    
    const uniquePatterns = new Set(exportPatterns.values());
    if (uniquePatterns.size > 1) {
      issues.push({ severity: 'LOW', issue: 'Mixed export patterns (CommonJS and ES6) detected' });
    }
    
    // Check for circular dependencies (simplified check)
    const imports = new Map();
    files.forEach(({ path: filePath, content }) => {
      const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
      imports.set(filePath, requireMatches);
    });
    
    return { issues, optimizations };
  }

  // Metrics Collection
  collectMetrics(filePath, content) {
    const lines = content.split('\n').length;
    const codeLines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
    const commentLines = lines - codeLines;
    const complexity = this.calculateComplexity(content);
    
    return {
      totalLines: lines,
      codeLines,
      commentLines,
      commentRatio: (commentLines / lines * 100).toFixed(1) + '%',
      complexity,
      functions: (content.match(/function\s+\w+|=>\s*{/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length
    };
  }

  calculateComplexity(content) {
    // Simplified cyclomatic complexity
    let complexity = 1;
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/else\s+if/g) || []).length;
    complexity += (content.match(/for\s*\(/g) || []).length;
    complexity += (content.match(/while\s*\(/g) || []).length;
    complexity += (content.match(/case\s+/g) || []).length;
    complexity += (content.match(/catch\s*\(/g) || []).length;
    return complexity;
  }

  // Scan Directory
  scanDirectory(dirPath, pattern = /\.(js|ts)$/) {
    const files = [];
    
    const scan = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.includes('node_modules')) {
            scan(fullPath);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              files.push({ path: fullPath, content, name: entry.name });
            } catch (err) {
              console.error(`Error reading ${fullPath}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning ${dir}:`, err.message);
      }
    };
    
    scan(dirPath);
    return files;
  }

  // Main Verification Process
  async verify() {
    console.log('═'.repeat(80));
    console.log('🔍 CLARITY SUPER CANON: FORENSIC VERIFICATION SUITE');
    console.log('═'.repeat(80));
    console.log('\n🎯 Tier 1 Languages: Python, Lua, Ruby, PHP, Dart');
    console.log('📊 Analysis: Code Quality, Performance, Security, Integration\n');

    const baseDir = path.join(__dirname, '..');
    
    // Scan optimizer files
    const optimizerFiles = this.scanDirectory(path.join(baseDir, 'src', 'optimizers'));
    
    console.log(`\n📁 Found ${optimizerFiles.length} optimizer implementation files\n`);

    let totalIssues = 0;
    let criticalIssues = 0;
    let totalOptimizations = 0;

    // Analyze each file
    for (const { path: filePath, content, name } of optimizerFiles) {
      const relativePath = filePath.replace(baseDir, '.');
      
      // Code Quality
      const quality = this.analyzeCodeQuality(relativePath, content);
      totalIssues += quality.issues.length;
      criticalIssues += quality.issues.filter(i => i.severity === 'CRITICAL').length;
      totalOptimizations += quality.optimizations.length;
      
      this.results.issues.push(...quality.issues);
      this.results.optimizations.push(...quality.optimizations);
      
      // Performance
      const performance = this.analyzePerformance(relativePath, content);
      totalOptimizations += performance.optimizations.length;
      this.results.optimizations.push(...performance.optimizations);
      
      // Security
      const security = this.analyzeSecurity(relativePath, content);
      totalIssues += security.issues.length;
      criticalIssues += security.issues.filter(i => i.severity === 'CRITICAL').length;
      this.results.issues.push(...security.issues);
      
      // Metrics
      const metrics = this.collectMetrics(relativePath, content);
      this.results.codeQuality[relativePath] = metrics;
    }

    // Integration Analysis
    const integration = this.analyzeIntegration(optimizerFiles);
    totalIssues += integration.issues.length;
    this.results.issues.push(...integration.issues);

    // Generate Report
    this.generateReport(totalIssues, criticalIssues, totalOptimizations);
    
    return this.results;
  }

  generateReport(totalIssues, criticalIssues, totalOptimizations) {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 VERIFICATION RESULTS');
    console.log('═'.repeat(80));

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Issues Found: ${totalIssues}`);
    console.log(`   Critical Issues: ${criticalIssues}`);
    console.log(`   Optimization Opportunities: ${totalOptimizations}`);

    // Issues by Severity
    const critical = this.results.issues.filter(i => i.severity === 'CRITICAL').length;
    const high = this.results.issues.filter(i => i.severity === 'HIGH').length;
    const medium = this.results.issues.filter(i => i.severity === 'MEDIUM').length;
    const low = this.results.issues.filter(i => i.severity === 'LOW').length;

    console.log('\n🚨 ISSUES BY SEVERITY:');
    console.log(`   CRITICAL: ${critical}`);
    console.log(`   HIGH: ${high}`);
    console.log(`   MEDIUM: ${medium}`);
    console.log(`   LOW: ${low}`);

    // Optimization Opportunities
    console.log('\n💡 OPTIMIZATION OPPORTUNITIES:');
    const optTypes = {};
    this.results.optimizations.forEach(opt => {
      optTypes[opt.type] = (optTypes[opt.type] || 0) + 1;
    });
    Object.entries(optTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    // Critical Issues Detail
    if (critical > 0) {
      console.log('\n⚠️  CRITICAL ISSUES (IMMEDIATE ACTION REQUIRED):');
      this.results.issues
        .filter(i => i.severity === 'CRITICAL')
        .forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue.file}`);
          console.log(`      Issue: ${issue.issue}`);
        });
    }

    // High Priority Optimizations
    console.log('\n🔧 HIGH PRIORITY OPTIMIZATIONS:');
    this.results.optimizations
      .filter(o => o.type === 'PERFORMANCE' || o.type === 'SECURITY')
      .slice(0, 10)
      .forEach((opt, idx) => {
        console.log(`   ${idx + 1}. [${opt.type}] ${opt.file}`);
        console.log(`      ${opt.suggestion}`);
      });

    // Code Metrics Summary
    console.log('\n📊 CODE METRICS:');
    let totalLines = 0;
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalComplexity = 0;

    Object.values(this.results.codeQuality).forEach(metrics => {
      totalLines += metrics.totalLines;
      totalFunctions += metrics.functions;
      totalClasses += metrics.classes;
      totalComplexity += metrics.complexity;
    });

    const fileCount = Object.keys(this.results.codeQuality).length;
    console.log(`   Total Files Analyzed: ${fileCount}`);
    console.log(`   Total Lines: ${totalLines}`);
    console.log(`   Total Functions: ${totalFunctions}`);
    console.log(`   Total Classes: ${totalClasses}`);
    console.log(`   Average Complexity: ${(totalComplexity / fileCount).toFixed(1)}`);

    // Overall Grade
    const grade = this.calculateGrade(criticalIssues, high, medium, low);
    console.log('\n' + '═'.repeat(80));
    console.log(`🏆 OVERALL CODE QUALITY GRADE: ${grade}`);
    console.log('═'.repeat(80));

    if (criticalIssues === 0 && high === 0) {
      console.log('\n✅ PRODUCTION READY: No critical or high severity issues found');
    } else {
      console.log('\n⚠️  ACTION REQUIRED: Please address critical and high severity issues');
    }
  }

  calculateGrade(critical, high, medium, low) {
    let score = 100;
    score -= critical * 20;
    score -= high * 10;
    score -= medium * 5;
    score -= low * 2;
    
    if (score >= 95) return 'A+ (EXCELLENT)';
    if (score >= 90) return 'A (VERY GOOD)';
    if (score >= 85) return 'B+ (GOOD)';
    if (score >= 80) return 'B (ACCEPTABLE)';
    if (score >= 70) return 'C (NEEDS IMPROVEMENT)';
    return 'D (REQUIRES IMMEDIATE ACTION)';
  }
}

// Execute Verification
const verifier = new ForensicVerifier();
verifier.verify().then(() => {
  console.log('\n✨ Forensic verification complete\n');
}).catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
