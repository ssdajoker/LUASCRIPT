/**
 * CLARITY SUPER CANON: Forensic Optimization Report Generator
 * Deep analysis with actionable recommendations
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ForensicOptimizationAnalyzer {
  constructor() {
    this.findings = {
      critical: [],
      performance: [],
      security: [],
      maintainability: [],
      recommendations: []
    };
  }

  async analyzeDirectory(dir) {
    const files = this.getAllFiles(dir);
    
    for (const file of files) {
      if (file.endsWith('.js') && !file.includes('node_modules') && !file.includes('test')) {
        await this.analyzeFile(file);
      }
    }
    
    this.generateReport();
  }

  getAllFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        this.getAllFiles(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
    return files;
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // 1. CRITICAL: Eval detection
    if (content.includes('eval(') && !content.includes('// eval:')) {
      this.findings.critical.push({
        file: relativePath,
        line: this.findLineNumber(content, 'eval('),
        issue: 'CRITICAL: eval() usage detected',
        recommendation: 'Replace eval() with safer alternatives (Function constructor, JSON.parse)'
      });
    }

    // 2. PERFORMANCE: forEach + push antipattern
    const forEachPushMatches = content.match(/\.forEach\([^)]+\{[^}]*\.push\(/g);
    if (forEachPushMatches && forEachPushMatches.length > 0) {
      this.findings.performance.push({
        file: relativePath,
        count: forEachPushMatches.length,
        issue: 'PERFORMANCE: forEach + push antipattern',
        improvement: '20-40% faster',
        recommendation: 'Replace with .map() or .filter()',
        example: 'array.map(x => transform(x)) instead of array.forEach(x => result.push(transform(x)))'
      });
    }

    // 3. PERFORMANCE: String concatenation in loops
    const loopStringConcatPattern = /(for|while)\s*\([^)]+\)[^{]*\{[^}]*\+=/;
    if (loopStringConcatPattern.test(content)) {
      this.findings.performance.push({
        file: relativePath,
        issue: 'PERFORMANCE: String concatenation in loop',
        improvement: '50-200% faster',
        recommendation: 'Use array.join() instead',
        example: 'parts.push(str); return parts.join("") instead of result += str'
      });
    }

    // 4. PERFORMANCE: Nested loops
    const nestedLoopMatches = content.match(/(for|while)\s*\([^)]+\)[^{]*\{[^}]*?(for|while)\s*\(/g);
    if (nestedLoopMatches && nestedLoopMatches.length > 2) {
      this.findings.performance.push({
        file: relativePath,
        count: nestedLoopMatches.length,
        issue: 'PERFORMANCE: Multiple nested loops detected',
        improvement: 'Consider O(n log n) algorithms',
        recommendation: 'Review algorithm complexity, consider Map/Set for lookups'
      });
    }

    // 5. PERFORMANCE: JSON.stringify in loops
    if (content.includes('JSON.stringify') && /for|while/.test(content)) {
      const matches = content.match(/JSON\.stringify/g) || [];
      if (matches.length > 3) {
        this.findings.performance.push({
          file: relativePath,
          count: matches.length,
          issue: 'PERFORMANCE: Repeated JSON.stringify calls',
          improvement: '30-60% faster',
          recommendation: 'Cache serialization results where possible'
        });
      }
    }

    // 6. SECURITY: Command injection risk
    const commandPatterns = [
      /exec\s*\(/,
      /execSync\s*\(/,
      /spawn\s*\(/,
      /system\s*\(/
    ];
    
    commandPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.findings.security.push({
          file: relativePath,
          issue: 'SECURITY: Command execution detected',
          recommendation: 'Validate all inputs, use execFile instead of exec, avoid shell interpolation'
        });
      }
    });

    // 7. MAINTAINABILITY: Magic numbers
    const magicNumberMatches = content.match(/[^.]\b\d{3,}\b/g);
    if (magicNumberMatches && magicNumberMatches.length > 5) {
      this.findings.maintainability.push({
        file: relativePath,
        count: magicNumberMatches.length,
        issue: 'MAINTAINABILITY: Many magic numbers detected',
        recommendation: 'Extract to named constants',
        example: 'const MAX_ITERATIONS = 5000; instead of hardcoded 5000'
      });
    }

    // 8. MAINTAINABILITY: Long functions
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
    for (const match of functionMatches) {
      const startIndex = content.indexOf(match);
      const functionBody = this.extractFunctionBody(content, startIndex);
      const lines = functionBody.split('\n').length;
      
      if (lines > 100) {
        this.findings.maintainability.push({
          file: relativePath,
          issue: `MAINTAINABILITY: Very long function (${lines} lines)`,
          recommendation: 'Consider breaking into smaller functions (< 50 lines each)'
        });
      }
    }

    // 9. MAINTAINABILITY: Missing JSDoc
    const publicFunctions = content.match(/^[\s]*(?:async\s+)?function\s+\w+/gm) || [];
    const jsdocCount = (content.match(/\/\*\*/g) || []).length;
    
    if (publicFunctions.length > 5 && jsdocCount < publicFunctions.length * 0.5) {
      this.findings.maintainability.push({
        file: relativePath,
        publicFunctions: publicFunctions.length,
        documented: jsdocCount,
        coverage: ((jsdocCount / publicFunctions.length) * 100).toFixed(0) + '%',
        issue: 'MAINTAINABILITY: Low JSDoc coverage',
        recommendation: 'Add JSDoc comments to public functions'
      });
    }

    // 10. PERFORMANCE: Sync operations
    const syncOperations = [
      'readFileSync',
      'writeFileSync',
      'readdirSync',
      'statSync',
      'existsSync'
    ];
    
    syncOperations.forEach(op => {
      const matches = content.match(new RegExp(op, 'g'));
      if (matches && matches.length > 3) {
        this.findings.performance.push({
          file: relativePath,
          operation: op,
          count: matches.length,
          issue: 'PERFORMANCE: Many sync operations',
          improvement: 'Better async performance',
          recommendation: `Consider ${op.replace('Sync', '')} with async/await`
        });
      }
    });
  }

  findLineNumber(content, search) {
    const index = content.indexOf(search);
    if (index === -1) return 'unknown';
    return content.substring(0, index).split('\n').length;
  }

  extractFunctionBody(content, startIndex) {
    let braceCount = 0;
    let inFunction = false;
    let body = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inFunction) {
          break;
        }
      }
      if (inFunction) {
        body += char;
      }
    }
    
    return body;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 CLARITY SUPER CANON: FORENSIC OPTIMIZATION REPORT');
    console.log('='.repeat(80));

    // Executive Summary
    console.log('\n📊 EXECUTIVE SUMMARY:\n');
    console.log(`   Critical Issues:      ${this.findings.critical.length}`);
    console.log(`   Performance Issues:   ${this.findings.performance.length}`);
    console.log(`   Security Issues:      ${this.findings.security.length}`);
    console.log(`   Maintainability:      ${this.findings.maintainability.length}`);
    console.log(`   Total Findings:       ${
      this.findings.critical.length +
      this.findings.performance.length +
      this.findings.security.length +
      this.findings.maintainability.length
    }`);

    // Critical Issues (Must Fix)
    if (this.findings.critical.length > 0) {
      console.log('\n' + '🔴 CRITICAL ISSUES (MUST FIX):');
      console.log('=' .repeat(80));
      this.findings.critical.forEach((finding, idx) => {
        console.log(`\n${idx + 1}. ${finding.file}:${finding.line}`);
        console.log(`   Issue: ${finding.issue}`);
        console.log(`   ✅ Fix: ${finding.recommendation}`);
      });
    }

    // Security Issues
    if (this.findings.security.length > 0) {
      console.log('\n🔒 SECURITY ISSUES:');
      console.log('='.repeat(80));
      const grouped = this.groupBy(this.findings.security, 'issue');
      Object.entries(grouped).forEach(([issue, items]) => {
        console.log(`\n${issue} (${items.length} files)`);
        items.slice(0, 5).forEach(item => {
          console.log(`   - ${item.file}`);
        });
        if (items.length > 5) {
          console.log(`   ... and ${items.length - 5} more`);
        }
        console.log(`   ✅ Fix: ${items[0].recommendation}`);
      });
    }

    // Performance Optimizations
    if (this.findings.performance.length > 0) {
      console.log('\n⚡ PERFORMANCE OPTIMIZATIONS (Top 10):');
      console.log('='.repeat(80));
      
      const sorted = this.findings.performance.sort((a, b) => {
        const impactA = this.getImpactScore(a.improvement || '');
        const impactB = this.getImpactScore(b.improvement || '');
        return impactB - impactA;
      });

      sorted.slice(0, 10).forEach((finding, idx) => {
        console.log(`\n${idx + 1}. ${finding.file}`);
        console.log(`   Issue: ${finding.issue}`);
        if (finding.count) console.log(`   Occurrences: ${finding.count}`);
        if (finding.improvement) console.log(`   💎 Impact: ${finding.improvement}`);
        console.log(`   ✅ Fix: ${finding.recommendation}`);
        if (finding.example) console.log(`   Example: ${finding.example}`);
      });

      if (sorted.length > 10) {
        console.log(`\n   ... and ${sorted.length - 10} more performance opportunities`);
      }
    }

    // Maintainability
    if (this.findings.maintainability.length > 0) {
      console.log('\n🔧 MAINTAINABILITY IMPROVEMENTS (Top 5):');
      console.log('='.repeat(80));
      
      this.findings.maintainability.slice(0, 5).forEach((finding, idx) => {
        console.log(`\n${idx + 1}. ${finding.file}`);
        console.log(`   Issue: ${finding.issue}`);
        if (finding.count) console.log(`   Count: ${finding.count}`);
        if (finding.coverage) console.log(`   Coverage: ${finding.coverage}`);
        console.log(`   ✅ Fix: ${finding.recommendation}`);
        if (finding.example) console.log(`   Example: ${finding.example}`);
      });
    }

    // Recommendations by Priority
    console.log('\n📋 ACTION PLAN (Prioritized):');
    console.log('='.repeat(80));
    
    const actionPlan = [
      {
        priority: 'P0 - IMMEDIATE',
        items: this.findings.critical.length,
        time: `${this.findings.critical.length * 30}min`,
        description: 'Fix critical security/functionality issues'
      },
      {
        priority: 'P1 - HIGH',
        items: this.findings.security.length,
        time: `${this.findings.security.length * 15}min`,
        description: 'Address security concerns'
      },
      {
        priority: 'P2 - MEDIUM',
        items: Math.min(10, this.findings.performance.length),
        time: '2-4 hours',
        description: 'Implement top 10 performance optimizations'
      },
      {
        priority: 'P3 - LOW',
        items: Math.min(20, this.findings.maintainability.length),
        time: '3-6 hours',
        description: 'Improve code maintainability'
      }
    ];

    actionPlan.forEach(plan => {
      console.log(`\n${plan.priority}:`);
      console.log(`   Items: ${plan.items}`);
      console.log(`   Est. Time: ${plan.time}`);
      console.log(`   Action: ${plan.description}`);
    });

    // Final Grade
    console.log('\n' + '='.repeat(80));
    const grade = this.calculateGrade();
    console.log(`\n🎯 FINAL GRADE: ${grade.letter} (${grade.score}/100)`);
    console.log(`\n   ${grade.message}`);
    console.log('\n' + '='.repeat(80));
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  getImpactScore(improvement) {
    const match = improvement.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  calculateGrade() {
    let score = 100;
    
    // Penalties
    score -= this.findings.critical.length * 25;  // -25 per critical
    score -= this.findings.security.length * 10;  // -10 per security
    score -= Math.min(this.findings.performance.length, 10) * 3;  // -3 each (max -30)
    score -= Math.min(this.findings.maintainability.length, 20) * 1;  // -1 each (max -20)
    
    score = Math.max(0, score);
    
    let letter, message;
    if (score >= 95) {
      letter = 'A+';
      message = '🌟 Exceptional code quality! Production-ready with best practices.';
    } else if (score >= 90) {
      letter = 'A';
      message = '✅ Excellent code quality. Minor optimizations available.';
    } else if (score >= 85) {
      letter = 'A-';
      message = '✅ Very good code quality. Some optimization opportunities.';
    } else if (score >= 80) {
      letter = 'B+';
      message = '👍 Good code quality. Address performance optimizations.';
    } else if (score >= 75) {
      letter = 'B';
      message = '👍 Solid code quality. Implement high-priority improvements.';
    } else if (score >= 70) {
      letter = 'B-';
      message = '⚠️  Acceptable quality. Focus on performance and security.';
    } else if (score >= 65) {
      letter = 'C+';
      message = '⚠️  Below ideal. Address critical and security issues first.';
    } else if (score >= 60) {
      letter = 'C';
      message = '⚠️  Needs improvement. Prioritize action plan.';
    } else {
      letter = 'D';
      message = '🔴 Requires immediate action. Follow P0/P1 priorities.';
    }
    
    return { score, letter, message };
  }
}

// Run analysis
const analyzer = new ForensicOptimizationAnalyzer();
const srcPath = path.join(process.cwd(), 'src', 'optimizers');

console.log('\n🔍 Analyzing optimizers in:', srcPath);

analyzer.analyzeDirectory(srcPath).then(() => {
  console.log('\n✅ Analysis complete!\n');
}).catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});
