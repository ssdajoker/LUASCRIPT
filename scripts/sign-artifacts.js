#!/usr/bin/env node

/**
 * Release Artifact Signer
 * 
 * Creates cryptographic signatures for release artifacts.
 * Supports SHA256 checksums and optional GPG signing.
 * 
 * Usage:
 *   node scripts/sign-artifacts.js <version>    # Sign all artifacts
 *   node scripts/sign-artifacts.js --list        # List artifacts to sign
 *   node scripts/sign-artifacts.js --verify <file> # Verify signature
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class ArtifactSigner {
  constructor(repoRoot = process.cwd()) {
    this.repoRoot = repoRoot;
    this.distDir = path.join(repoRoot, 'dist');
    this.checksumFile = path.join(repoRoot, 'CHECKSUMS.txt');
  }

  /**
   * Find artifacts to sign
   */
  findArtifacts() {
    const artifacts = [];

    // Look for common artifact patterns
    const patterns = [
      'dist/**/*.tar.gz',
      'dist/**/*.zip',
      'dist/**/*.exe',
      'dist/**/*.dmg',
      'dist/**/package.json',
      'dist/**/index.js',
    ];

    try {
      const distContents = fs.readdirSync(this.distDir, { recursive: true });

      for (const file of distContents) {
        const fullPath = path.join(this.distDir, file);

        // Skip directories
        if (fs.statSync(fullPath).isDirectory()) {
          continue;
        }

        // Skip .sig and .sha256 files
        if (file.endsWith('.sig') || file.endsWith('.sha256')) {
          continue;
        }

        artifacts.push({
          name: file,
          path: fullPath,
          size: fs.statSync(fullPath).size,
        });
      }
    } catch {
      // dist directory may not exist yet
    }

    return artifacts.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Calculate SHA256 checksum
   */
  sha256(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if GPG is available
   */
  hasGPG() {
    try {
      execSync('gpg --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sign file with GPG (optional)
   */
  signWithGPG(filePath, keyId = null) {
    try {
      const cmd = keyId
        ? `gpg --default-key ${keyId} --detach-sign --armor ${filePath}`
        : `gpg --detach-sign --armor ${filePath}`;

      execSync(cmd, { cwd: this.repoRoot });

      console.log(`  ✓ GPG signature: ${path.basename(filePath)}.asc`);
      return true;
    } catch (error) {
      console.log(`  ⚠ GPG signing failed (optional): ${error.message}`);
      return false;
    }
  }

  /**
   * Generate checksum file
   */
  generateChecksums(artifacts) {
    let content = `# SHA256 Checksums\n`;
    content += `# Generated: ${new Date().toISOString()}\n\n`;

    for (const artifact of artifacts) {
      const hash = this.sha256(artifact.path);
      content += `${hash}  ${artifact.name}\n`;
    }

    fs.writeFileSync(this.checksumFile, content, 'utf8');
    console.log(`\n✓ Checksum file: ${this.checksumFile}`);

    return content;
  }

  /**
   * Sign artifacts
   */
  signArtifacts(version, options = {}) {
    const artifacts = this.findArtifacts();

    if (artifacts.length === 0) {
      console.log('No artifacts found to sign');
      return;
    }

    console.log(`\n🔐 Signing ${artifacts.length} artifacts for v${version}\n`);

    // Generate checksums
    console.log('Checksums:');
    for (const artifact of artifacts) {
      const hash = this.sha256(artifact.path);
      console.log(`  ${hash.substring(0, 16)}...  ${artifact.name}`);
    }

    // Generate checksum file
    this.generateChecksums(artifacts);

    // Optional GPG signing
    if (options.gpg !== false) {
      const hasGpg = this.hasGPG();

      if (hasGpg) {
        console.log('\nGPG Signatures:');
        for (const artifact of artifacts) {
          this.signWithGPG(artifact.path, options.keyId);
        }

        // Also sign the checksum file
        this.signWithGPG(this.checksumFile, options.keyId);
      } else {
        console.log('\n⚠ GPG not found - install for signature verification');
      }
    }

    console.log(`\n✅ Artifacts signed for v${version}`);
  }

  /**
   * Verify checksum
   */
  verifyChecksum(filePath) {
    if (!fs.existsSync(this.checksumFile)) {
      throw new Error(`Checksum file not found: ${this.checksumFile}`);
    }

    const fileName = path.basename(filePath);
    const checksumContent = fs.readFileSync(this.checksumFile, 'utf8');
    const checksumMatch = checksumContent.match(
      new RegExp(`^([a-f0-9]+)\\s+${fileName}$`, 'm')
    );

    if (!checksumMatch) {
      throw new Error(`No checksum found for ${fileName}`);
    }

    const expectedHash = checksumMatch[1];
    const actualHash = this.sha256(filePath);

    const valid = expectedHash === actualHash;

    return {
      fileName,
      valid,
      expectedHash,
      actualHash,
    };
  }

  /**
   * Verify GPG signature
   */
  verifyGPGSignature(filePath) {
    const sigFile = `${filePath}.asc`;

    if (!fs.existsSync(sigFile)) {
      throw new Error(`Signature file not found: ${sigFile}`);
    }

    try {
      const output = execSync(`gpg --verify ${sigFile} ${filePath}`, {
        cwd: this.repoRoot,
        encoding: 'utf8',
      });

      return {
        valid: true,
        output,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * List artifacts
   */
  listArtifacts() {
    const artifacts = this.findArtifacts();

    if (artifacts.length === 0) {
      console.log('No artifacts found');
      return;
    }

    console.log(`\n📦 Found ${artifacts.length} artifacts:\n`);

    let totalSize = 0;
    for (const artifact of artifacts) {
      const sizeKB = (artifact.size / 1024).toFixed(2);
      console.log(`  ${artifact.name.padEnd(40)} ${sizeKB.padStart(10)} KB`);
      totalSize += artifact.size;
    }

    console.log(`\nTotal size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * Verify all artifacts
   */
  verifyAll() {
    const artifacts = this.findArtifacts();

    console.log(`\n✅ Verifying ${artifacts.length} artifacts\n`);

    let validCount = 0;
    let failCount = 0;

    for (const artifact of artifacts) {
      try {
        const result = this.verifyChecksum(artifact.path);
        if (result.valid) {
          console.log(`  ✓ ${artifact.name}`);
          validCount++;
        } else {
          console.log(`  ✗ ${artifact.name} - checksum mismatch`);
          failCount++;
        }
      } catch (error) {
        console.log(`  ✗ ${artifact.name} - ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n${validCount} verified, ${failCount} failed`);

    if (failCount > 0) {
      process.exit(1);
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Release Artifact Signer

Usage:
  node scripts/sign-artifacts.js <version> [options]
  node scripts/sign-artifacts.js --list
  node scripts/sign-artifacts.js --verify <file>
  node scripts/sign-artifacts.js --verify-all

Options:
  --gpg              Enable GPG signing (default: true)
  --key-id <id>      Use specific GPG key ID
  --no-gpg           Disable GPG signing
  --list             List artifacts to sign
  --verify <file>    Verify artifact checksum
  --verify-all       Verify all artifacts
  --help             Show this help message

Examples:
  node scripts/sign-artifacts.js 1.0.0           # Sign all artifacts
  node scripts/sign-artifacts.js 1.0.0 --no-gpg  # SHA256 only
  node scripts/sign-artifacts.js --list           # Show artifacts
  node scripts/sign-artifacts.js --verify dist/index.js  # Verify
    `);
    process.exit(0);
  }

  try {
    const signer = new ArtifactSigner();

    if (command === '--list') {
      signer.listArtifacts();
    } else if (command === '--verify') {
      const filePath = args[1];
      if (!filePath) {
        throw new Error('File path required');
      }
      const result = signer.verifyChecksum(filePath);
      console.log(`\n${result.valid ? '✓' : '✗'} ${result.fileName}`);
      if (!result.valid) {
        console.log(`  Expected: ${result.expectedHash}`);
        console.log(`  Actual:   ${result.actualHash}`);
      }
    } else if (command === '--verify-all') {
      signer.verifyAll();
    } else {
      // Sign artifacts
      const version = command;
      const options = {
        gpg: !args.includes('--no-gpg'),
        keyId: args.includes('--key-id') ? args[args.indexOf('--key-id') + 1] : null,
      };

      signer.signArtifacts(version, options);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = ArtifactSigner;
