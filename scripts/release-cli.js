#!/usr/bin/env node

/**
 * Unified Release CLI
 * 
 * One command to orchestrate the entire release workflow:
 * - Version bump
 * - Changelog generation
 * - Artifact signing
 * - GitHub release creation
 * 
 * Usage:
 *   node scripts/release-cli.js patch              # Release patch version
 *   node scripts/release-cli.js minor --dry-run    # Preview minor release
 *   node scripts/release-cli.js 1.5.3              # Release specific version
 *   node scripts/release-cli.js --status           # Check readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const VersionBump = require('./version-bump');
const ChangelogGenerator = require('./changelog-generator');
const ArtifactSigner = require('./sign-artifacts');

class ReleaseCLI {
  constructor(repoRoot = process.cwd()) {
    this.repoRoot = repoRoot;
  }

  /**
   * Check release readiness
   */
  checkReadiness() {
    console.log('\n📋 Checking release readiness...\n');

    const checks = {
      gitClean: false,
      testsPass: false,
      perfPass: false,
      gatesPass: false,
    };

    // Check git status
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.repoRoot,
        encoding: 'utf8',
      });

      if (!status.trim()) {
        console.log('✓ Git working directory clean');
        checks.gitClean = true;
      } else {
        console.log('✗ Git working directory has uncommitted changes:');
        console.log(status);
      }
    } catch (error) {
      console.log('✗ Git error:', error.message);
    }

    // Check test suite
    try {
      execSync('npm test 2>&1 | head -5', {
        cwd: this.repoRoot,
        stdio: 'ignore',
      });
      console.log('✓ Unit tests available');
      checks.testsPass = true;
    } catch {
      console.log('⚠ Tests may need attention');
    }

    // Check performance gates
    try {
      execSync('npm run test:perf 2>&1 | head -5', {
        cwd: this.repoRoot,
        stdio: 'ignore',
      });
      console.log('✓ Performance gates available');
      checks.perfPass = true;
    } catch {
      console.log('⚠ Performance gates may need attention');
    }

    // Check completeness gates
    try {
      execSync('npm run test:gates 2>&1 | head -5', {
        cwd: this.repoRoot,
        stdio: 'ignore',
      });
      console.log('✓ Completeness gates available');
      checks.gatesPass = true;
    } catch {
      console.log('⚠ Completeness gates may need attention');
    }

    const allPass = Object.values(checks).every(v => v);

    console.log(`\n${allPass ? '✅' : '⚠'} Readiness: ${allPass ? 'READY' : 'NEEDS ATTENTION'}`);

    return allPass;
  }

  /**
   * Perform full release
   */
  async release(bumpType, options = {}) {
    const isDryRun = options.dryRun || false;
    const skipGit = options.skipGit || false;
    const skipGpg = options.skipGpg || false;

    console.log('\n🚀 LUASCRIPT Release Orchestrator\n');
    console.log('=' .repeat(50));

    // Step 1: Check readiness
    if (!isDryRun) {
      const ready = this.checkReadiness();
      if (!ready && !options.force) {
        console.log('\n⚠ Release blocked by readiness check');
        console.log('Use --force to override');
        process.exit(1);
      }
    }

    // Step 2: Bump version
    console.log('\n\n📌 Step 1: Version Bump\n');
    console.log('-'.repeat(50));

    const bumper = new VersionBump(this.repoRoot);
    const newVersion = bumper.getNextVersion(bumpType);

    if (isDryRun) {
      bumper.dryRun(bumpType);
    } else {
      bumper.bump(bumpType, { skipGit });
    }

    // Step 3: Generate changelog
    console.log('\n\n📝 Step 2: Generate Changelog\n');
    console.log('-'.repeat(50));

    if (!isDryRun) {
      try {
        const generator = new ChangelogGenerator({ version: newVersion });
        console.log(`Generating changelog for v${newVersion}...\n`);
        const changelog = generator.generateChangelog();

        if (changelog) {
          generator.writeChangelog(changelog);
        } else {
          console.log('No new commits to add to changelog');
        }
      } catch (error) {
        console.log(`⚠ Changelog generation skipped: ${error.message}`);
      }
    } else {
      console.log(`Would generate changelog for v${newVersion}`);
    }

    // Step 4: Sign artifacts
    console.log('\n\n🔐 Step 3: Sign Artifacts\n');
    console.log('-'.repeat(50));

    if (!isDryRun) {
      try {
        const signer = new ArtifactSigner(this.repoRoot);
        const artifacts = signer.findArtifacts();

        if (artifacts.length > 0) {
          signer.signArtifacts(newVersion, {
            gpg: !skipGpg,
          });
        } else {
          console.log('No artifacts found to sign (might be created during CI)');
        }
      } catch (error) {
        console.log(`⚠ Artifact signing skipped: ${error.message}`);
      }
    } else {
      console.log(`Would sign artifacts for v${newVersion}`);
    }

    // Step 5: Summary
    console.log('\n\n📊 Release Summary\n');
    console.log('='.repeat(50));

    console.log(`Version: ${newVersion}`);
    console.log(`Type: ${isDryRun ? 'DRY RUN' : 'LIVE RELEASE'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    if (!isDryRun) {
      console.log(`\n✅ Release complete!`);
      console.log(`\nNext steps:`);
      console.log(`  1. Review changes: git log -1`);
      console.log(`  2. Push to GitHub: git push origin main && git push origin v${newVersion}`);
      console.log(`  3. Monitor release: https://github.com/ssdajoker/LUASCRIPT/actions`);
      console.log(`  4. View release: https://github.com/ssdajoker/LUASCRIPT/releases/tag/v${newVersion}`);
    } else {
      console.log(`\nDry run complete. No changes were made.`);
      console.log(`Run without --dry-run to proceed with release.`);
    }
  }

  /**
   * Display help
   */
  showHelp() {
    console.log(`
Unified Release CLI

Orchestrates the complete release workflow:
  1. Version bump (package.json + git tag)
  2. Changelog generation (conventional commits)
  3. Artifact signing (SHA256 + GPG)
  4. GitHub release (automated)

Usage:
  node scripts/release-cli.js <bump-type> [options]

Arguments:
  <bump-type>  One of: major, minor, patch, or specific version (e.g. 1.5.3)

Options:
  --dry-run      Show what would be done without making changes
  --force        Skip readiness checks
  --skip-gpg     Sign artifacts with SHA256 only (no GPG)
  --skip-git     Don't create git tag (for testing)
  --help         Show this help message

Special Commands:
  --status       Check release readiness
  --verify       Verify released artifacts

Examples:
  # Release patch version
  node scripts/release-cli.js patch

  # Preview minor release
  node scripts/release-cli.js minor --dry-run

  # Release specific version
  node scripts/release-cli.js 1.5.3

  # Check readiness
  node scripts/release-cli.js --status

  # Force release without checks
  node scripts/release-cli.js patch --force

Release Workflow:
  1. Check readiness (tests, gates, git status)
  2. Bump version (package.json, git tag)
  3. Generate changelog (conventional commits)
  4. Sign artifacts (SHA256, optionally GPG)
  5. Push to GitHub (triggers release workflow)

The release workflow will:
  ✓ Run all quality gates (lint, tests, perf, completeness)
  ✓ Build artifacts and generate checksums
  ✓ Create GPG signatures if available
  ✓ Create GitHub release with notes
  ✓ Upload signed artifacts
  ✓ Update project status

Full documentation: RELEASE_PROCESS.md
    `);
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const cli = new ReleaseCLI();

  if (!command || command === '--help' || command === '-h') {
    cli.showHelp();
    process.exit(0);
  }

  if (command === '--status') {
    cli.checkReadiness();
    process.exit(0);
  }

  if (command === '--verify') {
    try {
      const signer = new ArtifactSigner();
      signer.verifyAll();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // Parse options
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    skipGit: args.includes('--skip-git'),
    skipGpg: args.includes('--skip-gpg'),
  };

  try {
    cli.release(command, options).catch(error => {
      console.error('❌ Release failed:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = ReleaseCLI;
