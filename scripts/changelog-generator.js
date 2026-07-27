#!/usr/bin/env node

/**
 * Automated Changelog Generator
 * 
 * Generates CHANGELOG.md entries from git commits and PR metadata.
 * Supports conventional commits (feat:, fix:, docs:, etc.)
 * 
 * Usage:
 *   node scripts/changelog-generator.js          # Generate full changelog
 *   node scripts/changelog-generator.js --since <tag>  # Since last tag
 *   node scripts/changelog-generator.js --version 1.2.0 # For specific version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChangelogGenerator {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
    this.changelogPath = path.join(this.repoRoot, 'CHANGELOG.md');
    this.since = options.since || null;
    this.version = options.version || null;
    this.commits = [];
    this.categories = {
      feat: { title: '✨ Features', icon: '✨' },
      fix: { title: '🐛 Bug Fixes', icon: '🐛' },
      perf: { title: '⚡ Performance', icon: '⚡' },
      docs: { title: '📝 Documentation', icon: '📝' },
      style: { title: '🎨 Style', icon: '🎨' },
      refactor: { title: '♻️ Refactoring', icon: '♻️' },
      test: { title: '✅ Tests', icon: '✅' },
      ci: { title: '🔧 CI/CD', icon: '🔧' },
      chore: { title: '🧹 Chores', icon: '🧹' },
      breaking: { title: '💥 Breaking Changes', icon: '💥' },
    };
  }

  /**
   * Parse conventional commit message
   * Format: type(scope): description
   * Examples:
   *   feat(ir): add pattern support
   *   fix: memory leak
   *   BREAKING CHANGE: API change
   */
  parseCommit(commit) {
    const lines = commit.message.split('\n');
    const firstLine = lines[0];

    // Check for breaking change
    const hasBreaking = commit.message.includes('BREAKING CHANGE:');

    // Parse type(scope): message
    const match = firstLine.match(/^(\w+)(?:\(([^)]*)\))?:\s*(.+)$/);

    if (!match) {
      return null; // Skip non-conventional commits
    }

    const [, type, scope, message] = match;

    return {
      type: hasBreaking ? 'breaking' : type,
      scope,
      message,
      hash: commit.hash,
      author: commit.author,
      date: commit.date,
      body: lines.slice(1).join('\n').trim(),
      references: this.extractReferences(commit.message),
      breaking: hasBreaking,
    };
  }

  /**
   * Extract issue/PR references from commit message
   */
  extractReferences(message) {
    const refs = [];

    // Match #123, fixes #456, closes #789
    const issues = message.match(/#\d+/g) || [];
    refs.push(...issues.map(i => ({ type: 'issue', id: i.slice(1) })));

    // Match GitHub URLs
    const urls = message.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/(pull|issues)\/\d+/g) || [];
    refs.push(...urls.map(url => {
      const match = url.match(/\/(pull|issues)\/(\d+)$/);
      return {
        type: match[1],
        id: match[2],
        url,
      };
    }));

    return refs;
  }

  /**
   * Get commits since last tag or specific commit
   */
  getCommitsSince(since = null) {
    try {
      let cmd;

      if (since) {
        cmd = `git log ${since}..HEAD --format="%H%n%an%n%aI%n%B%n---COMMIT_END---"`;
      } else {
        // Get all commits if no reference
        cmd = `git log --format="%H%n%an%n%aI%n%B%n---COMMIT_END---" -n 100`;
      }

      const output = execSync(cmd, { cwd: this.repoRoot, encoding: 'utf8' });
      const commitBlocks = output.split('---COMMIT_END---').filter(b => b.trim());

      return commitBlocks.map(block => {
        const lines = block.trim().split('\n');
        return {
          hash: lines[0],
          author: lines[1],
          date: new Date(lines[2]),
          message: lines.slice(3).join('\n').trim(),
        };
      });
    } catch (error) {
      console.error('Error getting commits:', error.message);
      return [];
    }
  }

  /**
   * Get last tag or version
   */
  getLastTag() {
    try {
      return execSync('git describe --tags --abbrev=0', {
        cwd: this.repoRoot,
        encoding: 'utf8',
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Get current version from package.json
   */
  getCurrentVersion() {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(this.repoRoot, 'package.json'), 'utf8')
      );
      return pkg.version;
    } catch {
      return 'unreleased';
    }
  }

  /**
   * Format changelog entry
   */
  formatEntry(parsed) {
    let entry = `- ${parsed.message}`;

    if (parsed.scope) {
      entry = `- **${parsed.scope}**: ${parsed.message}`;
    }

    if (parsed.references.length > 0) {
      const refs = parsed.references
        .map(ref => {
          if (ref.url) {
            return `[#${ref.id}](${ref.url})`;
          }
          return `[#${ref.id}](https://github.com/ssdajoker/LUASCRIPT/issues/${ref.id})`;
        })
        .join(', ');
      entry += ` (${refs})`;
    }

    entry += ` _${parsed.hash.slice(0, 7)}_`;

    return entry;
  }

  /**
   * Generate changelog section
   */
  generateChangelog() {
    const lastTag = this.getLastTag();
    const version = this.version || this.getCurrentVersion();
    const commits = this.getCommitsSince(lastTag);

    if (commits.length === 0) {
      console.log('No commits to changelog');
      return '';
    }

    // Parse commits
    const parsed = commits
      .map(c => this.parseCommit(c))
      .filter(p => p !== null);

    if (parsed.length === 0) {
      console.log('No conventional commits found');
      return '';
    }

    // Group by category
    const grouped = {};
    for (const commit of parsed) {
      const type = commit.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(commit);
    }

    // Build changelog
    let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

    // Add each category
    for (const [type, commits] of Object.entries(grouped)) {
      const category = this.categories[type] || { title: type, icon: '•' };
      changelog += `### ${category.title}\n\n`;

      for (const commit of commits) {
        changelog += this.formatEntry(commit) + '\n';
      }

      changelog += '\n';
    }

    if (lastTag) {
      changelog += `### Compare\n\n`;
      changelog += `[${lastTag}...${version}](https://github.com/ssdajoker/LUASCRIPT/compare/${lastTag}...v${version})\n\n`;
    }

    return changelog;
  }

  /**
   * Read existing changelog
   */
  readExisting() {
    try {
      return fs.readFileSync(this.changelogPath, 'utf8');
    } catch {
      return '';
    }
  }

  /**
   * Write full changelog
   */
  writeChangelog(prepend = '') {
    const existing = this.readExisting();
    const content = prepend + (existing ? '\n' + existing : '');

    fs.writeFileSync(this.changelogPath, content, 'utf8');
    console.log(`✓ Changelog written to ${this.changelogPath}`);

    return content;
  }

  /**
   * Generate and output changelog
   */
  run() {
    console.log('📝 Generating changelog...\n');

    const generated = this.generateChangelog();

    if (!generated) {
      console.log('No changes to add to changelog');
      return;
    }

    console.log('Generated changelog:\n');
    console.log(generated);

    const existing = this.readExisting();
    if (!existing) {
      console.log('\n📄 Creating new CHANGELOG.md...');
      this.writeChangelog(
        '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n' +
        generated
      );
    } else {
      console.log('\n📝 Prepending to existing CHANGELOG.md...');
      this.writeChangelog(generated);
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--since') {
      options.since = args[++i];
    } else if (args[i] === '--version') {
      options.version = args[++i];
    }
  }

  const generator = new ChangelogGenerator(options);
  generator.run();
}

module.exports = ChangelogGenerator;
