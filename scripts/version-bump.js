#!/usr/bin/env node

/**
 * Version Bump Utility
 * 
 * Automatically bumps version in package.json and creates git tags.
 * Supports semantic versioning (major.minor.patch).
 * 
 * Usage:
 *   node scripts/version-bump.js major      # 1.0.0 -> 2.0.0
 *   node scripts/version-bump.js minor      # 1.0.0 -> 1.1.0
 *   node scripts/version-bump.js patch      # 1.0.0 -> 1.0.1
 *   node scripts/version-bump.js 1.5.3      # Set specific version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionBump {
  constructor(repoRoot = process.cwd()) {
    this.repoRoot = repoRoot;
    this.packagePath = path.join(repoRoot, 'package.json');
    this.pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.currentVersion = this.pkg.version;
  }

  /**
   * Parse semantic version
   */
  parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
    };
  }

  /**
   * Format version object back to string
   */
  formatVersion(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Calculate next version
   */
  getNextVersion(bump) {
    const current = this.parseVersion(this.currentVersion);

    switch (bump.toLowerCase()) {
      case 'major':
        return this.formatVersion({
          major: current.major + 1,
          minor: 0,
          patch: 0,
        });
      case 'minor':
        return this.formatVersion({
          major: current.major,
          minor: current.minor + 1,
          patch: 0,
        });
      case 'patch':
        return this.formatVersion({
          major: current.major,
          minor: current.minor,
          patch: current.patch + 1,
        });
      default:
        // Assume it's a specific version
        this.parseVersion(bump); // Validate format
        return bump;
    }
  }

  /**
   * Check if version already exists
   */
  versionExists(version) {
    try {
      execSync(`git rev-parse v${version}`, {
        cwd: this.repoRoot,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update package.json
   */
  updatePackageJson(newVersion) {
    this.pkg.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.pkg, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated package.json to ${newVersion}`);
  }

  /**
   * Create git tag
   */
  createGitTag(version, message) {
    const tag = `v${version}`;

    if (this.versionExists(version)) {
      throw new Error(`Tag ${tag} already exists`);
    }

    // Stage package.json
    execSync(`git add package.json`, { cwd: this.repoRoot });

    // Create annotated tag
    execSync(`git tag -a ${tag} -m "${message}"`, {
      cwd: this.repoRoot,
    });

    console.log(`✓ Created git tag ${tag}`);
  }

  /**
   * Get commits since last version
   */
  getCommitCount() {
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', {
        cwd: this.repoRoot,
        encoding: 'utf8',
      }).trim();

      const output = execSync(`git log ${lastTag}..HEAD --oneline`, {
        cwd: this.repoRoot,
        encoding: 'utf8',
      });

      return output.split('\n').filter(l => l.trim()).length;
    } catch {
      // No previous tags
      const output = execSync('git log --oneline', {
        cwd: this.repoRoot,
        encoding: 'utf8',
      });
      return output.split('\n').filter(l => l.trim()).length;
    }
  }

  /**
   * Get release notes from commits
   */
  getReleaseNotes(fromVersion) {
    try {
      const tag = `v${fromVersion}`;
      const output = execSync(
        `git log ${tag}..HEAD --format="%h - %s (%an)" --reverse`,
        { cwd: this.repoRoot, encoding: 'utf8' }
      );
      return output || '(No commits since last release)';
    } catch {
      return '(First release)';
    }
  }

  /**
   * Perform version bump
   */
  bump(bumpType, opts = {}) {
    const skipGit = opts.skipGit || false;

    console.log(`\n🔄 Bumping version...\n`);
    console.log(`Current version: ${this.currentVersion}`);

    // Calculate new version
    const newVersion = this.getNextVersion(bumpType);

    if (newVersion === this.currentVersion) {
      console.log('No version change needed');
      return;
    }

    console.log(`New version: ${newVersion}\n`);

    // Check git status
    if (!skipGit) {
      try {
        const status = execSync('git status --porcelain', {
          cwd: this.repoRoot,
          encoding: 'utf8',
        });

        if (status.trim()) {
          throw new Error('Working directory not clean. Commit or stash changes first.');
        }
      } catch (error) {
        console.error('❌ Git error:', error.message);
        process.exit(1);
      }
    }

    // Update package.json
    this.updatePackageJson(newVersion);

    // Create git tag
    if (!skipGit) {
      const commitCount = this.getCommitCount();
      const message = `Release v${newVersion} (${commitCount} commits)`;
      this.createGitTag(newVersion, message);
    }

    console.log(`\n✅ Version bumped to ${newVersion}`);
    console.log(`\n📋 Commits since last release:\n`);
    console.log(this.getReleaseNotes(this.currentVersion));

    return newVersion;
  }

  /**
   * Dry run - show what would be done
   */
  dryRun(bumpType) {
    const newVersion = this.getNextVersion(bumpType);

    console.log('\n📋 Dry run - no changes will be made\n');
    console.log(`Current version: ${this.currentVersion}`);
    console.log(`New version would be: ${newVersion}`);
    console.log(`\nChanges that would be made:`);
    console.log(`  ✓ Update package.json to ${newVersion}`);
    console.log(`  ✓ Create git tag v${newVersion}`);
    console.log(`  ✓ Commit package.json`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Version Bump Utility

Usage:
  node scripts/version-bump.js <bump-type> [options]

Arguments:
  <bump-type>  One of: major, minor, patch, or specific version (e.g. 1.5.3)

Options:
  --dry-run    Show what would be done without making changes
  --skip-git   Don't create git tag (for testing)
  --help       Show this help message

Examples:
  node scripts/version-bump.js major           # Bump major version
  node scripts/version-bump.js minor           # Bump minor version
  node scripts/version-bump.js patch           # Bump patch version
  node scripts/version-bump.js 1.5.3           # Set specific version
  node scripts/version-bump.js patch --dry-run # Preview changes
    `);
    process.exit(0);
  }

  const bumpType = args[0];
  const isDryRun = args.includes('--dry-run');
  const skipGit = args.includes('--skip-git');

  try {
    const bumper = new VersionBump();

    if (isDryRun) {
      bumper.dryRun(bumpType);
    } else {
      bumper.bump(bumpType, { skipGit });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = VersionBump;
