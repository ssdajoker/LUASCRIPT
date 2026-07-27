#!/usr/bin/env node

/**
 * @fileoverview File Validation and Sanitization Utility
 * 
 * Purpose: Prevent empty, binary, or corrupted files from causing issues
 * 
 * Features:
 * - Detects empty files
 * - Validates text file encoding
 * - Identifies binary files
 * - Provides safe file reading
 * - Auto-cleanup of problematic files
 * 
 * @module file-validator
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// FILE VALIDATOR
// ============================================================================

class FileValidator {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB default
      allowBinary: options.allowBinary !== false,
      autoCleanup: options.autoCleanup !== false,
      verbose: options.verbose || false,
      ...options
    };

    this.issues = [];
  }

  /**
   * Validate a single file
   */
  validateFile(filePath) {
    const result = {
      path: filePath,
      valid: true,
      issues: [],
      stats: null
    };

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        result.valid = false;
        result.issues.push('File does not exist');
        return result;
      }

      // Get file stats
      result.stats = fs.statSync(filePath);

      // Check if it's actually a file
      if (!result.stats.isFile()) {
        result.valid = false;
        result.issues.push('Path is not a file');
        return result;
      }

      // Check for empty files
      if (result.stats.size === 0) {
        result.valid = false;
        result.issues.push('File is empty (0 bytes)');
        this.issues.push({ file: filePath, issue: 'EMPTY' });
        return result;
      }

      // Check file size
      if (result.stats.size > this.options.maxSize) {
        result.valid = false;
        result.issues.push(`File too large (${result.stats.size} bytes > ${this.options.maxSize} bytes)`);
        return result;
      }

      // Read first chunk to check encoding
      const buffer = Buffer.alloc(Math.min(8192, result.stats.size));
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      // Check for binary content
      const isBinary = this.isBinaryContent(buffer);
      result.isBinary = isBinary;

      if (isBinary && !this.options.allowBinary) {
        result.valid = false;
        result.issues.push('File contains binary content');
        this.issues.push({ file: filePath, issue: 'BINARY' });
      }

      // Check for null bytes (often indicates corruption)
      if (buffer.includes(0) && !isBinary) {
        result.valid = false;
        result.issues.push('File contains null bytes (possibly corrupted)');
        this.issues.push({ file: filePath, issue: 'CORRUPTED' });
      }

      // Try to decode as UTF-8
      if (!isBinary) {
        try {
          buffer.toString('utf8');
        } catch (err) {
          result.valid = false;
          result.issues.push(`Invalid UTF-8 encoding: ${err.message}`);
          this.issues.push({ file: filePath, issue: 'ENCODING' });
        }
      }

    } catch (err) {
      result.valid = false;
      result.issues.push(`Validation error: ${err.message}`);
      this.issues.push({ file: filePath, issue: 'ERROR', error: err.message });
    }

    return result;
  }

  /**
   * Check if buffer contains binary content
   */
  isBinaryContent(buffer) {
    // Check for common binary signatures
    const binarySignatures = [
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0xFF, 0xD8, 0xFF],       // JPEG
      [0x47, 0x49, 0x46],       // GIF
      [0x50, 0x4B, 0x03, 0x04], // ZIP
      [0x7F, 0x45, 0x4C, 0x46], // ELF
      [0x4D, 0x5A],             // PE/EXE
    ];

    for (const sig of binarySignatures) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }

    // Check for high ratio of non-printable characters
    let nonPrintable = 0;
    const checkLength = Math.min(1024, buffer.length);

    for (let i = 0; i < checkLength; i++) {
      const byte = buffer[i];
      // Allow common control chars (tab, newline, carriage return)
      if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        nonPrintable++;
      }
      if (byte > 126 && byte < 160) {
        nonPrintable++;
      }
    }

    // If more than 30% non-printable, likely binary
    return (nonPrintable / checkLength) > 0.3;
  }

  /**
   * Safely read a text file with validation
   */
  safeReadFile(filePath, options = {}) {
    const validation = this.validateFile(filePath);

    if (!validation.valid) {
      throw new Error(`Cannot read file: ${validation.issues.join(', ')}`);
    }

    if (validation.isBinary) {
      throw new Error('File is binary, use binary read methods');
    }

    const encoding = options.encoding || 'utf8';
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * Scan directory for problematic files
   */
  scanDirectory(dirPath, options = {}) {
    const recursive = options.recursive !== false;
    const patterns = options.patterns || ['**/*'];
    const exclude = options.exclude || ['node_modules', '.git', 'dist', 'coverage'];

    const results = {
      total: 0,
      empty: [],
      binary: [],
      corrupted: [],
      encoding: [],
      errors: []
    };

    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip excluded directories
          if (entry.isDirectory()) {
            if (exclude.includes(entry.name)) continue;
            if (recursive) {
              scanDir(fullPath);
            }
            continue;
          }

          // Validate file
          if (entry.isFile()) {
            results.total++;
            const validation = this.validateFile(fullPath);

            if (!validation.valid) {
              for (const issue of validation.issues) {
                if (issue.includes('empty')) {
                  results.empty.push(fullPath);
                } else if (issue.includes('binary')) {
                  results.binary.push(fullPath);
                } else if (issue.includes('corrupted') || issue.includes('null bytes')) {
                  results.corrupted.push(fullPath);
                } else if (issue.includes('encoding')) {
                  results.encoding.push(fullPath);
                } else {
                  results.errors.push({ file: fullPath, issue });
                }
              }
            }
          }
        }
      } catch (err) {
        results.errors.push({ file: dir, issue: err.message });
      }
    };

    scanDir(dirPath);
    return results;
  }

  /**
   * Auto-cleanup problematic files
   */
  cleanup(results, options = {}) {
    const dryRun = options.dryRun !== false;
    const cleanupEmpty = options.cleanupEmpty !== false;
    const cleanupCorrupted = options.cleanupCorrupted !== false;

    const cleaned = {
      removed: [],
      failed: []
    };

    const filesToRemove = [];

    if (cleanupEmpty) {
      filesToRemove.push(...results.empty);
    }

    if (cleanupCorrupted) {
      filesToRemove.push(...results.corrupted);
    }

    for (const file of filesToRemove) {
      try {
        if (!dryRun) {
          fs.unlinkSync(file);
        }
        cleaned.removed.push(file);
      } catch (err) {
        cleaned.failed.push({ file, error: err.message });
      }
    }

    return cleaned;
  }

  /**
   * Generate report
   */
  generateReport(results) {
    const lines = [];
    lines.push('═'.repeat(70));
    lines.push('  FILE VALIDATION REPORT');
    lines.push('═'.repeat(70));
    lines.push('');
    lines.push(`Total Files Scanned: ${results.total}`);
    lines.push('');

    if (results.empty.length > 0) {
      lines.push(`EMPTY FILES (${results.empty.length}):`);
      results.empty.forEach(f => lines.push(`  ✗ ${f}`));
      lines.push('');
    }

    if (results.corrupted.length > 0) {
      lines.push(`CORRUPTED FILES (${results.corrupted.length}):`);
      results.corrupted.forEach(f => lines.push(`  ✗ ${f}`));
      lines.push('');
    }

    if (results.encoding.length > 0) {
      lines.push(`ENCODING ISSUES (${results.encoding.length}):`);
      results.encoding.forEach(f => lines.push(`  ⚠ ${f}`));
      lines.push('');
    }

    if (results.errors.length > 0) {
      lines.push(`ERRORS (${results.errors.length}):`);
      results.errors.forEach(e => lines.push(`  ✗ ${e.file}: ${e.issue}`));
      lines.push('');
    }

    const totalIssues = results.empty.length + results.corrupted.length + 
                       results.encoding.length + results.errors.length;

    if (totalIssues === 0) {
      lines.push('✓ NO ISSUES FOUND - All files valid');
    } else {
      lines.push(`✗ TOTAL ISSUES: ${totalIssues}`);
    }

    lines.push('═'.repeat(70));

    return lines.join('\n');
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const validator = new FileValidator({ verbose: true });

  if (args.length === 0) {
    console.log('Usage: node file-validator.js <path> [--cleanup] [--recursive]');
    console.log('\nOptions:');
    console.log('  --cleanup     Remove empty and corrupted files');
    console.log('  --recursive   Scan directories recursively');
    console.log('  --dry-run     Show what would be cleaned without removing');
    process.exit(1);
  }

  const targetPath = args[0];
  const cleanup = args.includes('--cleanup');
  const recursive = args.includes('--recursive');
  const dryRun = args.includes('--dry-run');

  console.log(`\nScanning: ${targetPath}`);
  console.log(`Recursive: ${recursive}`);
  console.log(`Cleanup: ${cleanup}`);
  if (cleanup) console.log(`Dry Run: ${dryRun}`);
  console.log('');

  const stats = fs.statSync(targetPath);

  let results;
  if (stats.isDirectory()) {
    results = validator.scanDirectory(targetPath, { recursive });
  } else {
    const validation = validator.validateFile(targetPath);
    results = {
      total: 1,
      empty: validation.issues.some(i => i.includes('empty')) ? [targetPath] : [],
      binary: validation.issues.some(i => i.includes('binary')) ? [targetPath] : [],
      corrupted: validation.issues.some(i => i.includes('corrupted')) ? [targetPath] : [],
      encoding: validation.issues.some(i => i.includes('encoding')) ? [targetPath] : [],
      errors: validation.issues.filter(i => 
        !i.includes('empty') && !i.includes('binary') && 
        !i.includes('corrupted') && !i.includes('encoding')
      ).map(i => ({ file: targetPath, issue: i }))
    };
  }

  console.log(validator.generateReport(results));

  if (cleanup) {
    console.log('\n' + '═'.repeat(70));
    console.log('  CLEANUP RESULTS');
    console.log('═'.repeat(70));

    const cleaned = validator.cleanup(results, { dryRun });

    if (cleaned.removed.length > 0) {
      console.log(`\n${dryRun ? 'Would remove' : 'Removed'} (${cleaned.removed.length}):`);
      cleaned.removed.forEach(f => console.log(`  ${dryRun ? '→' : '✓'} ${f}`));
    }

    if (cleaned.failed.length > 0) {
      console.log(`\nFailed (${cleaned.failed.length}):`);
      cleaned.failed.forEach(e => console.log(`  ✗ ${e.file}: ${e.error}`));
    }

    if (cleaned.removed.length === 0 && cleaned.failed.length === 0) {
      console.log('\n✓ Nothing to clean');
    }

    console.log('═'.repeat(70));
  }

  const totalIssues = results.empty.length + results.corrupted.length + 
                     results.encoding.length + results.errors.length;
  process.exit(totalIssues > 0 ? 1 : 0);
}

// Export
module.exports = { FileValidator };
