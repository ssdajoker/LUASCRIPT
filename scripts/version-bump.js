#!/usr/bin/env node

/**
 * Version Bump Utility
 * 
 * Automatically bumps version in package.json, commits that exact version,
 * and creates git tags only after proving the commit is at HEAD.
 * Supports SemVer 2.0 versions, including prerelease/build metadata.
 * 
 * Usage:
 *   node scripts/version-bump.js major      # 1.0.0 -> 2.0.0
 *   node scripts/version-bump.js minor      # 1.0.0 -> 1.1.0
 *   node scripts/version-bump.js patch      # 1.0.0 -> 1.0.1
 *   node scripts/version-bump.js 1.5.3      # Set specific version
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    ...options,
    maxBuffer: options.maxBuffer || 50 * 1024 * 1024,
  });
}

class VersionBump {
  constructor(repoRoot = process.cwd(), options = {}) {
    this.repoRoot = repoRoot;
    this.packagePath = path.join(repoRoot, 'package.json');
    this.runCommand = options.runCommand || runCommand;
    this.pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.currentVersion = this.pkg.version;
  }

  /**
   * Parse semantic version
   */
  parseVersion(version) {
    if (typeof version !== 'string') {
      throw new Error(`Invalid version format: ${version}`);
    }

    const match = version.match(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
    );
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: Number.parseInt(match[1], 10),
      minor: Number.parseInt(match[2], 10),
      patch: Number.parseInt(match[3], 10),
      prerelease: match[4] ? match[4].split('.') : [],
      build: match[5] ? match[5].split('.') : [],
    };
  }

  /**
   * Format version object back to string
   */
  formatVersion(version) {
    const prerelease = version.prerelease?.length
      ? `-${version.prerelease.join('.')}`
      : '';
    const build = version.build?.length ? `+${version.build.join('.')}` : '';
    return `${version.major}.${version.minor}.${version.patch}${prerelease}${build}`;
  }

  /**
   * Compare SemVer values. Build metadata does not affect precedence.
   */
  compareVersions(left, right) {
    const a = typeof left === 'string' ? this.parseVersion(left) : left;
    const b = typeof right === 'string' ? this.parseVersion(right) : right;

    for (const key of ['major', 'minor', 'patch']) {
      if (a[key] !== b[key]) {
        return a[key] > b[key] ? 1 : -1;
      }
    }

    if (a.prerelease.length === 0 && b.prerelease.length === 0) {
      return 0;
    }
    if (a.prerelease.length === 0) {
      return 1;
    }
    if (b.prerelease.length === 0) {
      return -1;
    }

    const length = Math.max(a.prerelease.length, b.prerelease.length);
    for (let index = 0; index < length; index += 1) {
      const leftIdentifier = a.prerelease[index];
      const rightIdentifier = b.prerelease[index];

      if (leftIdentifier === undefined) return -1;
      if (rightIdentifier === undefined) return 1;
      if (leftIdentifier === rightIdentifier) continue;

      const leftNumeric = /^\d+$/.test(leftIdentifier);
      const rightNumeric = /^\d+$/.test(rightIdentifier);
      if (leftNumeric && rightNumeric) {
        if (leftIdentifier.length !== rightIdentifier.length) {
          return leftIdentifier.length > rightIdentifier.length ? 1 : -1;
        }
        return leftIdentifier > rightIdentifier ? 1 : -1;
      }
      if (leftNumeric) return -1;
      if (rightNumeric) return 1;
      return leftIdentifier > rightIdentifier ? 1 : -1;
    }

    return 0;
  }

  /**
   * Calculate next version
   */
  getNextVersion(bump) {
    const current = this.parseVersion(this.currentVersion);
    const bumpType = String(bump).toLowerCase();
    const isPrerelease = current.prerelease.length > 0;

    switch (bumpType) {
      case 'major':
        return this.formatVersion({
          major:
            isPrerelease && current.minor === 0 && current.patch === 0
              ? current.major
              : current.major + 1,
          minor: 0,
          patch: 0,
        });
      case 'minor':
        return this.formatVersion({
          major: current.major,
          minor:
            isPrerelease && current.patch === 0
              ? current.minor
              : current.minor + 1,
          patch: 0,
        });
      case 'patch':
        return this.formatVersion({
          major: current.major,
          minor: current.minor,
          patch: isPrerelease ? current.patch : current.patch + 1,
        });
      default:
        // Assume it's a specific version
        this.parseVersion(bump); // Validate full SemVer format
        if (this.compareVersions(bump, this.currentVersion) < 0) {
          throw new Error(
            `Requested version ${bump} is lower than current version ${this.currentVersion}`
          );
        }
        return bump;
    }
  }

  /**
   * Execute git without shell interpolation.
   */
  git(args, options = {}) {
    return this.runCommand('git', args, {
      cwd: this.repoRoot,
      ...options,
    });
  }

  /**
   * Check if version already exists
   */
  versionExists(version) {
    try {
      this.git(['rev-parse', '--verify', '--quiet', `refs/tags/v${version}`], {
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
   * Prove that package.json at HEAD contains the intended release version and
   * has no uncommitted divergence. A tag must never be allowed to point at a
   * commit that predates the version bump.
   */
  assertVersionCommittedAtHead(version) {
    let verifiedHead;
    let committedPackage;
    try {
      verifiedHead = this.git(['rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim();
      if (!verifiedHead) {
        throw new Error('git returned an empty HEAD revision');
      }

      const committedText = this.git(['show', `${verifiedHead}:package.json`], {
        encoding: 'utf8',
      });
      committedPackage = JSON.parse(committedText);
    } catch (error) {
      throw new Error(
        `Cannot verify package.json at HEAD before tagging: ${error.message}`
      );
    }

    if (committedPackage.version !== version) {
      throw new Error(
        `Refusing to tag v${version}: HEAD contains package version ${committedPackage.version}`
      );
    }

    const packageStatus = this.git(
      ['status', '--porcelain', '--untracked-files=no', '--', 'package.json'],
      { encoding: 'utf8' }
    );
    if (packageStatus.trim()) {
      throw new Error(
        `Refusing to tag v${version}: package.json differs from the committed HEAD version`
      );
    }

    return verifiedHead;
  }

  /**
   * Commit only package.json, then prove that exact version is at HEAD.
   */
  commitVersion(version) {
    this.git(['add', '--', 'package.json']);
    this.git(['commit', '-m', `chore(release): v${version}`, '--', 'package.json'], {
      stdio: 'inherit',
    });
    return this.assertVersionCommittedAtHead(version);
  }

  /**
   * Create an annotated tag pointing explicitly at a verified HEAD.
   */
  createGitTag(version, message) {
    const tag = `v${version}`;

    if (this.versionExists(version)) {
      throw new Error(`Tag ${tag} already exists`);
    }

    const verifiedHead = this.assertVersionCommittedAtHead(version);
    this.git(['tag', '-a', tag, verifiedHead, '-m', message]);

    console.log(`✓ Created git tag ${tag}`);
  }

  /**
   * Get commits since last version
   */
  getCommitCount() {
    try {
      const lastTag = this.git(['describe', '--tags', '--abbrev=0'], {
        encoding: 'utf8',
      }).trim();

      const output = this.git(['log', `${lastTag}..HEAD`, '--oneline'], {
        encoding: 'utf8',
      });

      return output.split('\n').filter(l => l.trim()).length;
    } catch {
      // No previous tags
      const output = this.git(['log', '--oneline'], {
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
      const output = this.git(
        ['log', `${tag}..HEAD`, '--format=%h - %s (%an)', '--reverse'],
        { encoding: 'utf8' }
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
      const status = this.git(['status', '--porcelain'], {
        encoding: 'utf8',
      });

      if (status.trim()) {
        throw new Error('Working directory not clean. Commit or stash changes first.');
      }
    }

    // Update package.json
    this.updatePackageJson(newVersion);

    // A tag is permitted only after the exact bump is committed at HEAD.
    if (!skipGit) {
      this.commitVersion(newVersion);
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
    console.log(`  ✓ Commit package.json as version ${newVersion}`);
    console.log(`  ✓ Verify committed package.json at HEAD`);
    console.log(`  ✓ Create git tag v${newVersion} at the verified HEAD`);
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
