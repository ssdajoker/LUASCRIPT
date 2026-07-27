#!/usr/bin/env node
/**
 * Status Consistency Checker
 * Ensures key documentation stays aligned with PROJECT_STATUS.md
 * and deprecated docs have proper pointers.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceOfTruth: 'PROJECT_STATUS.md',
  keyDocs: [
    'README.md',
    'docs/INDEX.md',
    'docs/LANGUAGE_SUPPORT_MATRIX.md',
    'docs/LANGUAGE_COMPLETION_RULES.md'
  ],
  activeDocs: [
    'PROJECT_STATUS.md',
    'docs/INDEX.md',
    'docs/BETA_RELEASE_HANDOFF_V0_1.md',
    'docs/LUASCRIPT_DENALI_SOLOIST_LEDGER.md',
    'docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md',
    'docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md',
    'docs/LUASCRIPT_1_0_EXIT_CRITERIA.md',
    'docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md',
    'docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md',
    'docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md',
    'docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md',
    'docs/LUASCRIPT_MEGA_PLAN.md',
    'docs/LANGUAGE_SUPPORT_MATRIX.md',
    'docs/LANGUAGE_COMPLETION_RULES.md',
    'docs/LUASCRIPT_LIVING_META_LANGUAGE.md',
    'docs/LUASCRIPT_META_LANGUAGE_V0.md',
    'docs/LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md',
    'docs/quick-start/README.md',
    'docs/architecture/README.md',
    'docs/reference/README.md',
    'docs/canonical_ir_spec.md',
    'docs/VERSIONING.md',
    'docs/ir/ARCHITECTURE.md',
    'docs/ir/USAGE_GUIDE.md',
    'docs/OLD LUASCRIPT DOCS/README.md'
  ],
  deprecatedDocs: [
    // Add patterns for deprecated docs
    'legacy_*.md',
    'old_*.md',
    '*_deprecated.md'
  ],
  requiredLinks: [
    {
      file: 'README.md',
      mustContain: ['PROJECT_STATUS.md', 'source of truth', 'docs/INDEX.md', 'canonical active-docs map'],
      reason: 'README must link to PROJECT_STATUS and the active-docs map'
    },
    {
      file: 'PROJECT_STATUS.md',
      mustContain: ['docs/INDEX.md', 'active-docs map', 'docs/LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md', 'docs/LUASCRIPT_1_0_EXIT_CRITERIA.md', 'docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md', 'docs/LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md', 'docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md', 'docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md', 'docs/quick-start/README.md', 'docs/architecture/README.md', 'docs/reference/README.md'],
      reason: 'PROJECT_STATUS must point to the active-docs map and package/runtime docs'
    },
    {
      file: 'docs/INDEX.md',
      mustContain: ['canonical active-docs map', 'Support References', 'OLD LUASCRIPT DOCS/README.md'],
      reason: 'docs/INDEX.md must define the active map, support references, and archive root'
    },
    {
      file: 'docs/OLD LUASCRIPT DOCS/README.md',
      mustContain: ['Nothing here is a current guidance document', '../INDEX.md', 'historical evidence'],
      reason: 'archive root must remain clearly archive-only'
    }
  ],
  deprecationPointers: [
    'See PROJECT_STATUS.md',
    'Refer to PROJECT_STATUS.md',
    'Moved to PROJECT_STATUS.md',
    'DEPRECATED',
    '⚠️'
  ]
};

function activeIndexTarget(relativePath) {
  if (relativePath === 'PROJECT_STATUS.md') return '../PROJECT_STATUS.md';
  if (relativePath.startsWith('docs/')) return relativePath.slice('docs/'.length).replace(/\\/g, '/');
  return relativePath.replace(/\\/g, '/');
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function findFiles(pattern) {
  const repoRoot = path.join(__dirname, '..');
  const regex = new RegExp(pattern.replace('*', '.*'));
  
  try {
    const files = fs.readdirSync(repoRoot);
    return files.filter(f => {
      if (!f.endsWith('.md')) return false;
      return regex.test(f);
    }).map(f => path.join(repoRoot, f));
  } catch {
    return [];
  }
}

function checkSourceOfTruthExists() {
  const filePath = path.join(__dirname, '..', CONFIG.sourceOfTruth);
  if (!checkFileExists(filePath)) {
    return {
      passed: false,
      error: `Source of truth ${CONFIG.sourceOfTruth} not found`
    };
  }
  
  const content = readFile(filePath);
  if (!content || content.length < 100) {
    return {
      passed: false,
      error: `${CONFIG.sourceOfTruth} appears empty or too short`
    };
  }
  
  return { passed: true };
}

function checkRequiredLinks() {
  const failures = [];
  
  for (const requirement of CONFIG.requiredLinks) {
    const filePath = path.join(__dirname, '..', requirement.file);
    
    if (!checkFileExists(filePath)) {
      failures.push({
        file: requirement.file,
        reason: 'File not found',
        severity: 'warning'
      });
      continue;
    }
    
    const content = readFile(filePath);
    const missingTerms = requirement.mustContain.filter(term => {
      return !content.toLowerCase().includes(term.toLowerCase());
    });
    
    if (missingTerms.length > 0) {
      failures.push({
        file: requirement.file,
        reason: requirement.reason,
        missing: missingTerms,
        severity: 'error'
      });
    }
  }
  
  return failures;
}

function checkActiveDocsMap() {
  const failures = [];
  const repoRoot = path.join(__dirname, '..');
  const readme = readFile(path.join(repoRoot, 'README.md')) || '';
  const index = readFile(path.join(repoRoot, 'docs', 'INDEX.md')) || '';

  for (const docPath of CONFIG.activeDocs) {
    const filePath = path.join(repoRoot, docPath);
    if (!checkFileExists(filePath)) {
      failures.push({
        file: docPath,
        reason: 'Active docs map target is missing',
        severity: 'error'
      });
      continue;
    }

    const target = activeIndexTarget(docPath);
    if (docPath !== 'docs/INDEX.md' && !index.includes(target)) {
      failures.push({
        file: 'docs/INDEX.md',
        reason: `Active docs map does not link ${target}`,
        severity: 'error'
      });
    }

    if (docPath !== 'PROJECT_STATUS.md' && docPath !== 'docs/OLD LUASCRIPT DOCS/README.md' && !readme.includes(docPath.replace(/\\/g, '/'))) {
      failures.push({
        file: 'README.md',
        reason: `Documentation map does not link ${docPath}`,
        severity: 'error'
      });
    }
  }

  return failures;
}

function checkDeprecatedDocs() {
  const failures = [];
  
  for (const pattern of CONFIG.deprecatedDocs) {
    const files = findFiles(pattern);
    
    for (const filePath of files) {
      const content = readFile(filePath);
      if (!content) continue;
      
      const hasPointer = CONFIG.deprecationPointers.some(pointer => {
        return content.includes(pointer);
      });
      
      if (!hasPointer) {
        failures.push({
          file: path.basename(filePath),
          reason: 'Deprecated doc lacks pointer to PROJECT_STATUS.md',
          severity: 'warning'
        });
      }
    }
  }
  
  return failures;
}

function checkStatusConsistency() {
  const sourceContent = readFile(path.join(__dirname, '..', CONFIG.sourceOfTruth));
  if (!sourceContent) return [];
  
  const failures = [];
  
  // Extract key claims from PROJECT_STATUS.md
  const keyPatterns = [
    /Phase[0-9]+.*(?:complete|in progress|planned)/gi,
    /coverage.*[0-9]+%/gi,
    /[0-9]+.*tests.*passing/gi
  ];
  
  const claims = [];
  for (const pattern of keyPatterns) {
    const matches = sourceContent.match(pattern);
    if (matches) {
      claims.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  // Check if other docs contradict these claims
  for (const docFile of CONFIG.keyDocs) {
    const filePath = path.join(__dirname, '..', docFile);
    if (!checkFileExists(filePath)) continue;
    
    const content = readFile(filePath);
    
    // Look for potential contradictions (simplified check)
    const docClaims = [];
    for (const pattern of keyPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        docClaims.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    // If doc makes claims that aren't in PROJECT_STATUS, flag it
    const uniqueClaims = docClaims.filter(claim => {
      return !claims.some(statusClaim => {
        return statusClaim.includes(claim) || claim.includes(statusClaim);
      });
    });
    
    if (uniqueClaims.length > 0 && docFile === 'README.md') {
      // Only warn for README as it's most likely to have inflation
      failures.push({
        file: docFile,
        reason: 'May contain claims not in PROJECT_STATUS.md',
        claims: uniqueClaims.slice(0, 3),
        severity: 'warning'
      });
    }
  }
  
  return failures;
}

function displayResults(results) {
  console.log('\n📋 Status Consistency Check Results');
  console.log('─'.repeat(80));
  
  let errors = 0;
  let warnings = 0;
  
  // Source of truth check
  if (!results.sourceOfTruth.passed) {
    console.log(`❌ ${results.sourceOfTruth.error}`);
    errors++;
  } else {
    console.log(`✅ ${CONFIG.sourceOfTruth} exists and is valid`);
  }
  
  // Required links check
  if (results.requiredLinks.length === 0) {
    console.log('✅ All required links present');
  } else {
    for (const failure of results.requiredLinks) {
      const icon = failure.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${failure.file}: ${failure.reason}`);
      if (failure.missing) {
        console.log(`   Missing: ${failure.missing.join(', ')}`);
      }
      if (failure.severity === 'error') {
        errors++;
      } else {
        warnings++;
      }
    }
  }
  
  // Deprecated docs check
  if (results.deprecatedDocs.length === 0) {
    console.log('✅ No deprecated docs found (or all have pointers)');
  } else {
    for (const failure of results.deprecatedDocs) {
      console.log(`⚠️  ${failure.file}: ${failure.reason}`);
      warnings++;
    }
  }

  // Active docs map check
  if (results.activeDocsMap.length === 0) {
    console.log('✅ Active docs map is sealed');
  } else {
    for (const failure of results.activeDocsMap) {
      const icon = failure.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${failure.file}: ${failure.reason}`);
      if (failure.severity === 'error') {
        errors++;
      } else {
        warnings++;
      }
    }
  }
  
  // Consistency check
  if (results.consistency.length === 0) {
    console.log('✅ No obvious consistency issues detected');
  } else {
    for (const failure of results.consistency) {
      console.log(`⚠️  ${failure.file}: ${failure.reason}`);
      if (failure.claims) {
        console.log(`   Examples: ${failure.claims.join(', ')}`);
      }
      warnings++;
    }
  }
  
  console.log('─'.repeat(80));
  console.log(`\nErrors: ${errors} | Warnings: ${warnings}`);
  
  return { errors, warnings };
}

function main() {
  console.log('🔍 Status Consistency Checker');
  console.log(`Source of Truth: ${CONFIG.sourceOfTruth}\n`);
  
  const results = {
    sourceOfTruth: checkSourceOfTruthExists(),
    requiredLinks: checkRequiredLinks(),
    deprecatedDocs: checkDeprecatedDocs(),
    activeDocsMap: checkActiveDocsMap(),
    consistency: checkStatusConsistency()
  };
  
  const { errors, warnings } = displayResults(results);
  
  console.log('\n💡 Recommendations:');
  if (errors > 0 || warnings > 0) {
    console.log('  • Ensure all key docs link to PROJECT_STATUS.md');
    console.log('  • Keep docs/INDEX.md as the active-docs map');
    console.log('  • Add deprecation notices to old/legacy docs');
    console.log('  • Remove inflated claims from README.md');
    console.log('  • Keep PROJECT_STATUS.md as single source of truth');
  } else {
    console.log('  • Documentation is consistent ✅');
  }
  
  console.log('─'.repeat(80));
  
  // Fail on errors, warn on warnings
  if (errors > 0) {
    console.error('\n❌ Status consistency check FAILED');
    process.exit(1);
  } else if (warnings > 0) {
    console.warn('\n⚠️  Status consistency check PASSED with warnings');
  } else {
    console.log('\n✅ Status consistency check PASSED');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkSourceOfTruthExists,
  checkRequiredLinks,
  checkActiveDocsMap,
  checkDeprecatedDocs,
  checkStatusConsistency
};
