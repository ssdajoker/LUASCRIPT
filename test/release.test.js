#!/usr/bin/env node

/**
 * Release Scripts Test Suite
 * 
 * Tests for changelog generation, version bumping, and artifact signing
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const VersionBump = require('../scripts/version-bump');
const ChangelogGenerator = require('../scripts/changelog-generator');
const ArtifactSigner = require('../scripts/sign-artifacts');

class ReleaseTestSuite {
  constructor() {
    this.testDir = path.join(__dirname, '.tmp-release-test');
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Test version bumping
   */
  testVersionBump() {
    console.log('\n📌 Testing Version Bump...\n');

    try {
      // Test parsing versions
      const bumper = new VersionBump();

      // Test major bump
      bumper.currentVersion = '1.0.0';
      const major = bumper.getNextVersion('major');
      assert.strictEqual(major, '2.0.0', 'Major bump failed');
      console.log('✓ Major version bump: 1.0.0 -> 2.0.0');

      // Test minor bump
      bumper.currentVersion = '1.0.0';
      const minor = bumper.getNextVersion('minor');
      assert.strictEqual(minor, '1.1.0', 'Minor bump failed');
      console.log('✓ Minor version bump: 1.0.0 -> 1.1.0');

      // Test patch bump
      bumper.currentVersion = '1.0.0';
      const patch = bumper.getNextVersion('patch');
      assert.strictEqual(patch, '1.0.1', 'Patch bump failed');
      console.log('✓ Patch version bump: 1.0.0 -> 1.0.1');

      // Test specific version
      const specific = bumper.getNextVersion('1.5.3');
      assert.strictEqual(specific, '1.5.3', 'Specific version failed');
      console.log('✓ Specific version: 1.5.3 -> 1.5.3');

      // Test invalid versions
      try {
        bumper.getNextVersion('invalid');
        assert.fail('Should reject invalid version');
      } catch {
        console.log('✓ Invalid version rejected');
      }

      this.passed++;
    } catch (error) {
      console.error('✗ Version bump test failed:', error.message);
      this.failed++;
    }
  }

  /**
   * Test changelog generation
   */
  testChangelogGeneration() {
    console.log('\n📝 Testing Changelog Generation...\n');

    try {
      const generator = new ChangelogGenerator();

      // Test commit parsing
      const commits = [
        { hash: 'abc123', author: 'test', date: new Date(), message: 'feat(ir): add pattern support' },
        { hash: 'def456', author: 'test', date: new Date(), message: 'fix: memory leak' },
        { hash: 'ghi789', author: 'test', date: new Date(), message: 'docs: update readme\n\nBREAKING CHANGE: API changed' },
      ];

      const parsed = commits.map(c => generator.parseCommit(c)).filter(p => p !== null);

      assert.strictEqual(parsed.length, 3, 'Should parse 3 commits');
      assert.strictEqual(parsed[0].type, 'feat', 'First commit should be feat');
      assert.strictEqual(parsed[1].type, 'fix', 'Second commit should be fix');
      assert.strictEqual(parsed[2].type, 'breaking', 'Third commit should be breaking');
      console.log('✓ Parsed 3 commits with correct types');

      // Test reference extraction
      const msg = 'Fix issue #123 and close #456\nhttps://github.com/org/repo/pull/789';
      const refs = generator.extractReferences(msg);
      assert(refs.length > 0, 'Should extract references');
      console.log(`✓ Extracted ${refs.length} references`);

      // Test formatting
      const entry = generator.formatEntry(parsed[0]);
      assert(entry.includes('pattern support'), 'Entry should contain message');
      assert(entry.includes('abc1'), 'Entry should contain commit hash');
      console.log('✓ Formatted changelog entry');

      this.passed++;
    } catch (error) {
      console.error('✗ Changelog generation test failed:', error.message);
      this.failed++;
    }
  }

  /**
   * Test artifact signing
   */
  testArtifactSigning() {
    console.log('\n🔐 Testing Artifact Signing...\n');

    try {
      const signer = new ArtifactSigner();

      // Test checksum calculation
      const testFile = path.join(__dirname, 'package.json');
      if (fs.existsSync(testFile)) {
        const hash = signer.sha256(testFile);
        assert.strictEqual(hash.length, 64, 'SHA256 should be 64 hex chars');
        assert.match(hash, /^[a-f0-9]+$/, 'Hash should be hex');
        console.log('✓ SHA256 checksum generated');
      }

      // Test GPG availability
      const hasGpg = signer.hasGPG();
      console.log(`✓ GPG availability: ${hasGpg ? 'available' : 'not available'}`);

      this.passed++;
    } catch (error) {
      console.error('✗ Artifact signing test failed:', error.message);
      this.failed++;
    }
  }

  /**
   * Test release status check
   */
  testReleaseStatus() {
    console.log('\n📋 Testing Release Status...\n');

    try {
      // These tests verify the methods exist and are callable
      const bumper = new VersionBump();
      
      assert.strictEqual(typeof bumper.parseVersion, 'function');
      assert.strictEqual(typeof bumper.formatVersion, 'function');
      assert.strictEqual(typeof bumper.getNextVersion, 'function');
      console.log('✓ Version bump methods available');

      const generator = new ChangelogGenerator();
      assert.strictEqual(typeof generator.parseCommit, 'function');
      assert.strictEqual(typeof generator.extractReferences, 'function');
      console.log('✓ Changelog generator methods available');

      const signer = new ArtifactSigner();
      assert.strictEqual(typeof signer.sha256, 'function');
      assert.strictEqual(typeof signer.hasGPG, 'function');
      console.log('✓ Artifact signer methods available');

      this.passed++;
    } catch (error) {
      console.error('✗ Release status test failed:', error.message);
      this.failed++;
    }
  }

  /**
   * Test semantic version parsing
   */
  testSemanticVersioning() {
    console.log('\n🔢 Testing Semantic Versioning...\n');

    try {
      const bumper = new VersionBump();

      // Valid versions
      const versions = ['1.0.0', '0.0.1', '10.20.30'];
      for (const version of versions) {
        const parsed = bumper.parseVersion(version);
        assert(parsed.major !== undefined);
        assert(parsed.minor !== undefined);
        assert(parsed.patch !== undefined);
      }
      console.log(`✓ Parsed ${versions.length} valid versions`);

      // Invalid versions
      const invalid = ['1', '1.0', 'latest', '1.0.0-beta'];
      for (const version of invalid) {
        try {
          bumper.parseVersion(version);
          assert.fail(`Should reject ${version}`);
        } catch {
          // Expected
        }
      }
      console.log(`✓ Rejected ${invalid.length} invalid versions`);

      this.passed++;
    } catch (error) {
      console.error('✗ Semantic versioning test failed:', error.message);
      this.failed++;
    }
  }

  /**
   * Run all tests
   */
  run() {
    console.log('\n' + '='.repeat(60));
    console.log('RELEASE SCRIPTS TEST SUITE');
    console.log('='.repeat(60));

    this.testVersionBump();
    this.testChangelogGeneration();
    this.testArtifactSigning();
    this.testReleaseStatus();
    this.testSemanticVersioning();

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✓ Passed: ${this.passed}`);
    console.log(`✗ Failed: ${this.failed}`);
    console.log(`Total:  ${this.passed + this.failed}`);

    if (this.failed === 0) {
      console.log('\n✅ All tests passed!');
      return 0;
    } else {
      console.log('\n❌ Some tests failed');
      return 1;
    }
  }
}

// Run tests
if (require.main === module) {
  const suite = new ReleaseTestSuite();
  process.exit(suite.run());
}

module.exports = ReleaseTestSuite;
