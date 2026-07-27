# Release Process & Hygiene Guide

Complete automation for LUASCRIPT releases with changelog generation, version management, artifact signing, and GitHub releases.

## Overview

The release process is fully automated and consists of these phases:

1. **Pre-Release Validation** - Run all quality gates
2. **Artifact Building** - Build and package artifacts
3. **Artifact Signing** - Generate checksums and GPG signatures
4. **GitHub Release** - Create automated release with notes
5. **Notifications** - Update status and notify team

## Quick Start

### Manual Release (Recommended)

```bash
# 1. Ensure working directory is clean
git status

# 2. Bump version
node scripts/version-bump.js patch  # or minor, major

# 3. Review changes
git diff

# 4. Commit and tag
git push origin develop
# ... wait for CI to green ...
git push origin main

# 5. Release workflow triggers automatically on tag
# Monitor at: https://github.com/ssdajoker/LUASCRIPT/actions
```

### Using Release CLI (Standalone)

```bash
# Dry run first
node scripts/release-cli.js patch --dry-run

# Perform release
node scripts/release-cli.js patch

# Specific version
node scripts/release-cli.js 1.5.3
```

## Scripts Reference

### 1. Version Bump (`scripts/version-bump.js`)

Automatically updates `package.json` and creates git tags.

**Usage:**
```bash
node scripts/version-bump.js major      # 1.0.0 -> 2.0.0
node scripts/version-bump.js minor      # 1.0.0 -> 1.1.0
node scripts/version-bump.js patch      # 1.0.0 -> 1.0.1
node scripts/version-bump.js 1.5.3      # Set specific version
```

**Options:**
- `--dry-run` - Show what would be done
- `--skip-git` - Don't create tag (for testing)

**Output:**
```
Current version: 1.0.0
New version: 1.0.1

✓ Updated package.json to 1.0.1
✓ Created git tag v1.0.1

📋 Commits since last release:

feat(ir): add pattern support
fix: memory leak
docs: update readme
```

**What it does:**
- Validates semantic version format
- Updates `package.json` version
- Creates annotated git tag with message
- Stages and commits changes
- Displays release notes preview

### 2. Changelog Generator (`scripts/changelog-generator.js`)

Parses git commits and generates CHANGELOG.md entries using conventional commits.

**Usage:**
```bash
node scripts/changelog-generator.js              # Generate full changelog
node scripts/changelog-generator.js --since v1.0.0 --version 1.1.0  # Since tag
```

**Commit Format:**
```
feat(scope): description
fix(scope): description
BREAKING CHANGE: description
```

**Categories:**
- `feat:` - ✨ Features
- `fix:` - 🐛 Bug Fixes
- `perf:` - ⚡ Performance
- `docs:` - 📝 Documentation
- `style:` - 🎨 Style
- `refactor:` - ♻️ Refactoring
- `test:` - ✅ Tests
- `ci:` - 🔧 CI/CD
- `chore:` - 🧹 Chores
- `BREAKING CHANGE:` - 💥 Breaking Changes

**Output Example:**
```markdown
## [1.0.1] - 2024-01-15

### 🐛 Bug Fixes

- **ir**: Fix memory leak in pattern matching _a1b2c3d_

### 📝 Documentation

- Update README with examples _x9y8z7w_

### Compare

[1.0.0...1.0.1](https://github.com/ssdajoker/LUASCRIPT/compare/1.0.0...v1.0.1)
```

**What it does:**
- Parses conventional commit messages
- Groups commits by type/category
- Extracts issue/PR references (#123)
- Generates markdown changelog
- Creates links to PRs and comparisons
- Prepends to existing CHANGELOG.md

### 3. Artifact Signer (`scripts/sign-artifacts.js`)

Creates checksums and GPG signatures for release artifacts.

**Usage:**
```bash
node scripts/sign-artifacts.js 1.0.1          # Sign all artifacts
node scripts/sign-artifacts.js 1.0.1 --no-gpg # SHA256 only
node scripts/sign-artifacts.js --list          # Show artifacts
node scripts/sign-artifacts.js --verify file   # Verify checksum
node scripts/sign-artifacts.js --verify-all    # Verify all
```

**Options:**
- `--gpg` - Enable GPG signing (default: true)
- `--key-id <id>` - Use specific GPG key
- `--no-gpg` - Disable GPG signing
- `--list` - List artifacts
- `--verify <file>` - Verify single artifact
- `--verify-all` - Verify all artifacts

**Output:**
```
🔐 Signing 3 artifacts for v1.0.1

Checksums:
  a1b2c3d4e5f6g7h8  luascript-1.0.1.tar.gz
  x9y8z7w6v5u4t3s2  luascript-1.0.1.zip
  p8o7i6u5y4t3r2e1  package.json

✓ Checksum file: CHECKSUMS.txt

GPG Signatures:
  ✓ GPG signature: luascript-1.0.1.tar.gz.asc
  ✓ GPG signature: luascript-1.0.1.zip.asc
  ✓ GPG signature: package.json.asc

✅ Artifacts signed for v1.0.1
```

**What it does:**
- Finds artifacts in `dist/` directory
- Generates SHA256 checksums for each
- Creates CHECKSUMS.txt file
- Optionally signs artifacts with GPG
- Verifies checksums on demand
- Supports GPG signature verification

### 4. Release CLI (`scripts/release-cli.js`)

Unified interface combining version bump, changelog, signing, and GitHub release.

**Usage:**
```bash
node scripts/release-cli.js patch              # Full release workflow
node scripts/release-cli.js minor --dry-run    # Preview changes
node scripts/release-cli.js 1.5.3              # Specific version
node scripts/release-cli.js --status           # Check pre-release readiness
```

**Workflow:**
```
1. Check pre-release requirements
   ✓ Clean git status
   ✓ Tests passing
   ✓ Perf gates passing
   
2. Bump version
   ✓ Update package.json
   ✓ Create git tag
   
3. Generate changelog
   ✓ Parse commits
   ✓ Format CHANGELOG.md
   
4. Sign artifacts
   ✓ Generate checksums
   ✓ Create GPG signatures
   
5. Create GitHub release
   ✓ Upload artifacts
   ✓ Set release notes
   ✓ Mark as latest
```

## GitHub Actions Workflow

Automated release workflow (`release.yml`) triggers on version tags.

### Trigger

Push a version tag to trigger the release:
```bash
git tag v1.0.1
git push origin v1.0.1
```

### Phases

#### 1. Pre-Release Validation
- Extracts version from tag
- Runs lint checks
- Runs unit tests
- Runs performance SLO gates
- Runs completeness gates
- Generates release notes
- Uploads validation artifacts

#### 2. Build Artifacts
- Installs dependencies
- Builds project
- Creates npm package
- Lists artifacts
- Generates checksums

#### 3. Sign Artifacts
- Downloads build artifacts
- Verifies checksums
- Creates GPG signatures (optional)
- Stores signed artifacts

#### 4. Create Release
- Creates GitHub Release
- Uploads artifacts
- Sets release notes
- Marks as latest release

#### 5. Notifications
- Updates release badge
- Comments on related issues
- Updates project status
- Generates summary

### Monitoring

Monitor release progress in GitHub Actions:
```
https://github.com/ssdajoker/LUASCRIPT/actions?query=workflow%3A"Create+Release"
```

## Release Verification

### Check Checksums

```bash
# Download CHECKSUMS.txt and artifacts
cd downloads/

# Verify checksums
sha256sum -c CHECKSUMS.txt

# Output:
# luascript-1.0.1.tar.gz: OK
# luascript-1.0.1.zip: OK
# package.json: OK
```

### Verify GPG Signatures

```bash
# Import public key (first time)
gpg --keyserver keyserver.ubuntu.com --recv-keys KEYID

# Verify signature
gpg --verify luascript-1.0.1.tar.gz.asc luascript-1.0.1.tar.gz

# Output:
# gpg: Signature made Mon Jan 15 10:30:00 2024 UTC
# gpg: Good signature from "Release Bot <releases@example.com>"
```

## Pre-Release Checklist

Before releasing, ensure:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Lint checks passing (`npm run lint`)
- [ ] Performance gates passing (`npm run test:perf`)
- [ ] Completeness gates passing
- [ ] Extension compatibility verified
- [ ] No breaking changes logged

### Documentation
- [ ] CHANGELOG.md updated with meaningful entries
- [ ] README.md reflects new features
- [ ] Migration guides for breaking changes
- [ ] API documentation updated
- [ ] Examples updated

### Artifact Preparation
- [ ] Build artifacts generated
- [ ] Package.json version updated
- [ ] CHECKSUMS.txt generated
- [ ] Artifacts verified
- [ ] GPG keys available (if signing)

### Git Status
- [ ] Working directory clean
- [ ] All changes committed
- [ ] Branch protection rules satisfied
- [ ] Code review completed

## Common Issues & Solutions

### Issue: "Working directory not clean"
```bash
# Commit or stash changes
git add .
git commit -m "chore: prepare for release"
git stash  # if not committing
```

### Issue: "Tag already exists"
```bash
# List tags
git tag

# Delete local tag
git tag -d v1.0.1

# Delete remote tag (careful!)
git push origin :v1.0.1
```

### Issue: "Tests failing"
```bash
# Run tests locally
npm test

# Fix issues before release
npm run lint:fix

# Commit fixes
git add .
git commit -m "fix: resolve test failures"
```

### Issue: "GPG signing failing"
```bash
# Check GPG installation
gpg --version

# List available keys
gpg --list-keys

# Use --no-gpg if GPG not available
node scripts/sign-artifacts.js 1.0.1 --no-gpg
```

### Issue: "GitHub release not creating"
```bash
# Check GitHub token permissions
echo $GITHUB_TOKEN | base64 -d | jq

# Ensure workflow has write permissions:
permissions:
  contents: write
  packages: write
```

## Best Practices

### Semantic Versioning

Follow [semver](https://semver.org/):
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features (backward compatible)
- **Patch** (0.0.X): Bug fixes

### Conventional Commits

Use conventional commit format:
```
feat(scope): description
fix(scope): description
BREAKING CHANGE: description
```

Commit types:
- `feat:` - New features
- `fix:` - Bug fixes
- `perf:` - Performance improvements
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks

### Release Schedule

- **Patch releases**: Weekly or as-needed for critical fixes
- **Minor releases**: Monthly for feature releases
- **Major releases**: Quarterly or on significant changes

### Git Workflow

```
develop (main development)
  ↓
Feature branches (feature/xyz)
  ↓
Pull requests (reviewed)
  ↓
main (release branch)
  ↓
Version tag (v1.0.0)
  ↓
GitHub release + artifacts
```

## Rollback Procedures

### Rollback Failed Release

If release workflow fails:

1. **Identify Issue**
   ```bash
   # Check GitHub Actions logs
   # Review failure details
   ```

2. **Fix Problem**
   ```bash
   # Make necessary fixes
   # Commit changes
   git add .
   git commit -m "fix: resolve release issue"
   git push
   ```

3. **Retry Release**
   ```bash
   # Delete failed tag (if already created)
   git tag -d v1.0.1
   git push origin :v1.0.1
   
   # Re-bump version and retry
   node scripts/version-bump.js patch
   git push origin main
   ```

### Rollback Published Release

If released version has critical issues:

1. **Create Hotfix**
   ```bash
   git checkout main
   git pull
   
   # Create hotfix branch
   git checkout -b hotfix/critical-issue
   
   # Fix issue
   # Commit and push
   ```

2. **Release Hotfix**
   ```bash
   # Bump patch version
   node scripts/version-bump.js patch
   
   # Continue with normal release
   ```

3. **Mark Old Release**
   - Edit GitHub release
   - Mark as pre-release or add warning
   - Link to hotfix release

## Integration with CI/CD

Release workflow integrates with:
- **Lint checks**: Code quality validation
- **Unit tests**: Functional validation
- **Performance gates**: Regression detection
- **Completeness gates**: Documentation/test coverage
- **Extension tests**: Third-party compatibility

All gates must pass before release is published.

## References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
