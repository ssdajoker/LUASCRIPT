/**
 * PR Completeness Bot: Enforce docs/test updates and status consistency
 * 
 * Analyzes PR changes and flags:
 * - Missing documentation updates when code changes
 * - Missing test updates when feature/fix code changes
 * - Status consistency violations
 * - Suggests relevant wiki/timeline links
 * 
 * Runs as GitHub Actions workflow; posts PR comments with findings
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration for completeness rules
 */
const COMPLETENESS_RULES = {
  // Code patterns that REQUIRE doc updates
  docsRequired: [
    { pattern: /src\/transpiler/, desc: 'Transpiler core logic' },
    { pattern: /src\/ir/, desc: 'IR pipeline and schema' },
    { pattern: /src\/backends/, desc: 'Backend implementations' },
    { pattern: /package\.json/, desc: 'Project configuration/entry points' },
    { pattern: /README\.md|CONTRIBUTING\.md|DEVELOPMENT_WORKFLOW\.md/, desc: 'Primary documentation' },
  ],

  // Code patterns that REQUIRE test updates
  testsRequired: [
    { pattern: /src\/transpiler.*\.js$/, desc: 'Transpiler functions' },
    { pattern: /src\/ir.*\.js$/, desc: 'IR functions' },
    { pattern: /src\/backends.*\.js$/, desc: 'Backend functions' },
    { pattern: /scripts\/.*\.js$/, desc: 'Utility/build scripts' },
  ],

  // Code patterns that REQUIRE status file updates
  statusRequired: [
    { pattern: /package\.json/, statusFiles: ['PROJECT_STATUS.md', 'DEVELOPMENT_WORKFLOW.md'] },
    { pattern: /\.github\/workflows/, statusFiles: ['PROJECT_STATUS.md', 'docs/ci-cd/README.md'] },
    { pattern: /src\/transpiler/, statusFiles: ['PROJECT_STATUS.md', 'ENHANCED_TRANSPILER_README.md'] },
  ],

  // Doc files that should be linked in PRs if modified
  statusDocs: [
    'PROJECT_STATUS.md',
    'DEVELOPMENT_WORKFLOW.md',
    'PERFORMANCE_SLO.md',
    'docs/status/PROJECT_HEALTH.md',
    'docs/ci-cd/README.md',
  ],

  // Timeline/wiki reference documents
  wikiLinks: {
    timeline: 'docs/timeline/README.md',
    architecture: 'docs/architecture/README.md',
    'quick-start': 'docs/quick-start/README.md',
    testing: 'docs/testing/README.md',
    'ci-cd': 'docs/ci-cd/README.md',
    status: 'docs/status/PROJECT_HEALTH.md',
  },
};

/**
 * PR Completeness Analyzer
 */
class PRCompletenessAnalyzer {
  constructor(prFiles, prBody, prTitle) {
    this.files = prFiles || [];
    this.body = prBody || '';
    this.title = prTitle || '';
    this.violations = [];
    this.warnings = [];
    this.suggestions = [];
  }

  /**
   * Analyze PR for completeness issues
   */
  async analyze() {
    this.checkDocumentationUpdates();
    this.checkTestUpdates();
    this.checkStatusConsistency();
    this.suggestWikiLinks();
    this.checkPRDescription();

    return {
      violations: this.violations,
      warnings: this.warnings,
      suggestions: this.suggestions,
      passed: this.violations.length === 0,
    };
  }

  /**
   * Check if code changes require documentation updates
   */
  checkDocumentationUpdates() {
    const codeFiles = this.files.filter(f => 
      !f.startsWith('test/') && !f.startsWith('docs/') && f.endsWith('.js')
    );

    const docFiles = this.files.filter(f => 
      f.endsWith('.md') && !f.startsWith('test/')
    );

    // Determine if docs are required
    let docsNeeded = false;
    for (const rule of COMPLETENESS_RULES.docsRequired) {
      for (const file of codeFiles) {
        if (rule.pattern.test(file)) {
          docsNeeded = true;
          break;
        }
      }
    }

    if (docsNeeded && docFiles.length === 0) {
      this.violations.push({
        type: 'missing-docs',
        severity: 'error',
        message: '📝 **Missing Documentation**: Code changes detected but no documentation updates found.',
        details: `Code modified in: ${codeFiles.join(', ')}\n\n**Action Required**: Update relevant docs:\n- PROJECT_STATUS.md (if status affected)\n- Component README (if logic/API changed)\n- DEVELOPMENT_WORKFLOW.md (if process changed)`,
      });
    } else if (docsNeeded && docFiles.length > 0) {
      this.suggestions.push({
        type: 'docs-updated',
        message: '✅ Documentation updated alongside code changes.',
      });
    }
  }

  /**
   * Check if tests need updates
   */
  checkTestUpdates() {
    const sourceFiles = this.files.filter(f =>
      f.match(/^src\/(transpiler|ir|backends)/) && f.endsWith('.js')
    );

    const testFiles = this.files.filter(f =>
      (f.startsWith('test/') || f.startsWith('tests/')) && f.endsWith('.js')
    );

    if (sourceFiles.length > 0 && testFiles.length === 0) {
      // Check PR body for test-related info
      const hasTestInfo = /test|spec|coverage|mocha|jest|passing/i.test(this.body);

      if (!hasTestInfo) {
        this.warnings.push({
          type: 'missing-tests',
          severity: 'warning',
          message: '🧪 **No Test Updates**: Source code modified but no test files added/updated.',
          details: `Modified source files: ${sourceFiles.join(', ')}\n\n**Recommendation**: \n- Add or update tests for new/modified functionality\n- Document test coverage in PR description\n- Run \`npm test\` and \`npm run test:coverage\` locally`,
        });
      }
    } else if (testFiles.length > 0) {
      this.suggestions.push({
        type: 'tests-included',
        message: '✅ Test updates included with code changes.',
      });
    }
  }

  /**
   * Check status file consistency
   */
  checkStatusConsistency() {
    const statusFiles = this.files.filter(f =>
      COMPLETENESS_RULES.statusRequired.some(r =>
        r.statusFiles.some(sf => f === sf)
      )
    );

    // Check if PROJECT_STATUS.md exists and is valid
    const hasProjectStatus = this.files.some(f => f === 'PROJECT_STATUS.md');

    if (hasProjectStatus) {
      // Verify it's being treated as source of truth
      if (!this.body.includes('PROJECT_STATUS') && !this.title.includes('status')) {
        this.suggestions.push({
          type: 'status-reference',
          message: '💡 Tip: Reference PROJECT_STATUS.md as source of truth in PR description.',
          details: 'Example: "See PROJECT_STATUS.md for current project health and test posture."',
        });
      }
    }

    // Flag if multiple status docs are being changed without coordination
    if (statusFiles.length > 2) {
      this.warnings.push({
        type: 'status-coordination',
        severity: 'warning',
        message: '⚠️ **Multiple Status Files Modified**: Ensure consistency across all updates.',
        details: `Files: ${statusFiles.join(', ')}\n\n**Verification**: Confirm all status updates align with PROJECT_STATUS.md as canonical source.`,
      });
    }
  }

  /**
   * Suggest relevant wiki/timeline links
   */
  suggestWikiLinks() {
    const relevantLinks = [];

    // Suggest timeline if this is a major change
    if (this.files.length > 10 || this.title.includes('phase') || this.title.includes('refactor')) {
      relevantLinks.push({
        title: 'Project Timeline',
        url: COMPLETENESS_RULES.wikiLinks.timeline,
        reason: 'Major changes should be contextualized in project history',
      });
    }

    // Suggest architecture if code structure changes
    if (this.files.some(f => f.includes('src/') || f.includes('package.json'))) {
      relevantLinks.push({
        title: 'Architecture Guide',
        url: COMPLETENESS_RULES.wikiLinks.architecture,
        reason: 'Code changes may affect architecture decisions',
      });
    }

    // Suggest testing guide if tests are modified
    if (this.files.some(f => f.startsWith('test/'))) {
      relevantLinks.push({
        title: 'Testing Guide',
        url: COMPLETENESS_RULES.wikiLinks.testing,
        reason: 'Reference testing patterns and coverage expectations',
      });
    }

    // Suggest CI/CD docs if workflows modified
    if (this.files.some(f => f.includes('.github/workflows'))) {
      relevantLinks.push({
        title: 'CI/CD Integration',
        url: COMPLETENESS_RULES.wikiLinks['ci-cd'],
        reason: 'Understand CI gates and workflow integration',
      });
    }

    // Always suggest status
    if (relevantLinks.length === 0 || true) {
      relevantLinks.push({
        title: 'Project Status & Health',
        url: COMPLETENESS_RULES.wikiLinks.status,
        reason: 'Current project health and test posture baseline',
      });
    }

    if (relevantLinks.length > 0) {
      this.suggestions.push({
        type: 'wiki-links',
        message: '📚 **Wiki References** (for context):',
        links: relevantLinks,
      });
    }
  }

  /**
   * Check PR description quality
   */
  checkPRDescription() {
    if (!this.body || this.body.trim().length < 50) {
      this.warnings.push({
        type: 'sparse-description',
        severity: 'info',
        message: '💬 **PR Description**: Add more detail about changes and their impact.',
        details: 'Include:\n- What changed and why\n- How to test the changes\n- Links to related docs/timeline entries\n- Any status updates needed',
      });
    }

    // Check for testing instructions
    if (!this.body.includes('npm test') && !this.body.includes('test') && !this.body.includes('✓')) {
      this.suggestions.push({
        type: 'test-instructions',
        message: '💡 Tip: Add test instructions to PR description (e.g., "npm test" or "npm run test:coverage")',
      });
    }

    // Check for status/docs references
    if (!this.body.includes('PROJECT_STATUS') && !this.body.includes('docs/') && !this.body.includes('DEVELOPMENT')) {
      this.suggestions.push({
        type: 'doc-references',
        message: '💡 Tip: Reference relevant docs/wiki entries in PR description',
      });
    }
  }
}

/**
 * Format analyzer results into PR comment
 */
function formatPRComment(analysis) {
  let comment = '## 📋 Completeness Check\n\n';

  // Status
  if (analysis.passed) {
    comment += '✅ **All completeness checks passed!**\n\n';
  } else {
    comment += '⚠️ **Completeness checks require attention:**\n\n';
  }

  // Violations (must fix)
  if (analysis.violations.length > 0) {
    comment += '### 🔴 Required Actions\n\n';
    for (const v of analysis.violations) {
      comment += `**${v.message}**\n`;
      comment += `${v.details}\n\n`;
    }
  }

  // Warnings (should address)
  if (analysis.warnings.length > 0) {
    comment += '### 🟡 Recommendations\n\n';
    for (const w of analysis.warnings) {
      comment += `**${w.message}**\n`;
      if (w.details) {
        comment += `${w.details}\n\n`;
      }
    }
  }

  // Suggestions (nice to have)
  if (analysis.suggestions.length > 0) {
    comment += '### 💡 Tips & Resources\n\n';
    for (const s of analysis.suggestions) {
      comment += `${s.message}\n`;
      if (s.links) {
        for (const link of s.links) {
          comment += `- [${link.title}](./${link.url}): ${link.reason}\n`;
        }
        comment += '\n';
      } else if (s.details) {
        comment += `${s.details}\n\n`;
      }
    }
  }

  comment += '\n---\n';
  comment += '_This check is enforced by [PR Completeness Bot](.github/workflows/pr-completeness-gate.yml)_\n';

  return comment;
}

/**
 * Main: Run analyzer (called from GitHub Actions)
 */
async function main() {
  try {
    // Parse GitHub Actions context
    const prFiles = process.env.PR_FILES ? JSON.parse(process.env.PR_FILES) : [];
    const prBody = process.env.PR_BODY || '';
    const prTitle = process.env.PR_TITLE || '';
    const prNumber = process.env.PR_NUMBER || 'N/A';

    console.log(`\n📋 Analyzing PR #${prNumber}...`);
    console.log(`   Files: ${prFiles.length}`);
    console.log(`   Title: ${prTitle.substring(0, 60)}`);

    // Run analysis
    const analyzer = new PRCompletenessAnalyzer(prFiles, prBody, prTitle);
    const analysis = await analyzer.analyze();

    // Output results
    console.log('\n📊 Analysis Results:');
    console.log(`   ✅ Passed: ${analysis.passed}`);
    console.log(`   🔴 Violations: ${analysis.violations.length}`);
    console.log(`   🟡 Warnings: ${analysis.warnings.length}`);
    console.log(`   💡 Suggestions: ${analysis.suggestions.length}`);

    // Format and output comment
    const comment = formatPRComment(analysis);
    console.log('\n📝 PR Comment:\n');
    console.log(comment);

    // Save outputs for GitHub Actions workflow
    if (process.env.GITHUB_OUTPUT) {
      const output = `${analysis.passed ? 'PASSED' : 'FAILED'}\n`;
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `PR_CHECK_STATUS=${analysis.passed}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `PR_COMMENT<<EOF\n${comment}\nEOF\n`);
    }

    // Exit with appropriate code
    process.exit(analysis.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error running completeness check:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  PRCompletenessAnalyzer,
  formatPRComment,
  COMPLETENESS_RULES,
};

// Run if called directly
if (require.main === module) {
  main();
}
