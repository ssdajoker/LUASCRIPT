#!/usr/bin/env node

/**
 * @fileoverview Safe File Operations Wrapper
 * 
 * Purpose: Provide robust file operations with validation, retry logic, and encoding handling
 * 
 * Features:
 * - Pre-read validation
 * - Automatic encoding detection
 * - Retry logic with delays
 * - Buffer flush waiting
 * - Safe write operations
 * 
 * @module safe-file-ops
 */

const fs = require('fs');
const path = require('path');
const { FileValidator } = require('./file-validator');

// ============================================================================
// SAFE FILE OPERATIONS
// ============================================================================

class SafeFileOps {
  constructor(options = {}) {
    this.options = {
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 500,
      waitForFlush: options.waitForFlush !== false,
      flushDelay: options.flushDelay || 1000,
      encoding: options.encoding || 'utf8',
      verbose: options.verbose || false,
      ...options
    };

    this.validator = new FileValidator({ verbose: this.options.verbose });
  }

  /**
   * Log message if verbose
   */
  log(message) {
    if (this.options.verbose) {
      console.log(`[SafeFileOps] ${message}`);
    }
  }

  /**
   * Wait for specified milliseconds
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safely read a text file with validation and retry logic
   */
  async safeRead(filePath, options = {}) {
    const retries = options.retries || this.options.retries;
    const retryDelay = options.retryDelay || this.options.retryDelay;
    const waitForFlush = options.waitForFlush !== undefined ? options.waitForFlush : this.options.waitForFlush;
    const flushDelay = options.flushDelay || this.options.flushDelay;
    const encoding = options.encoding || this.options.encoding;

    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${retries}: Reading ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          throw new Error(`File does not exist: ${filePath}`);
        }

        // Wait for file system flush if requested
        if (waitForFlush && attempt === 1) {
          this.log(`Waiting ${flushDelay}ms for file system flush...`);
          await this.wait(flushDelay);
        }

        // Validate file
        const validation = this.validator.validateFile(filePath);

        if (!validation.valid) {
          const issues = validation.issues.join(', ');
          throw new Error(`File validation failed: ${issues}`);
        }

        if (validation.isBinary) {
          throw new Error('File is binary, use binary read methods');
        }

        // Read file
        const content = fs.readFileSync(filePath, encoding);

        this.log(`Successfully read ${content.length} characters`);
        return content;

      } catch (err) {
        lastError = err;
        this.log(`Attempt ${attempt} failed: ${err.message}`);

        if (attempt < retries) {
          this.log(`Retrying in ${retryDelay}ms...`);
          await this.wait(retryDelay);
        }
      }
    }

    throw new Error(`Failed to read file after ${retries} attempts: ${lastError.message}`);
  }

  /**
   * Safely write a file with flush and verification
   */
  async safeWrite(filePath, content, options = {}) {
    const encoding = options.encoding || this.options.encoding;
    const verify = options.verify !== false;
    const flushDelay = options.flushDelay || this.options.flushDelay;

    try {
      this.log(`Writing ${content.length} characters to ${filePath}`);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, content, encoding);

      // Explicit flush
      const fd = fs.openSync(filePath, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);

      this.log('File written and flushed');

      // Wait for file system to catch up
      if (verify) {
        this.log(`Waiting ${flushDelay}ms for verification...`);
        await this.wait(flushDelay);

        // Verify write
        const readBack = fs.readFileSync(filePath, encoding);
        if (readBack !== content) {
          throw new Error('Verification failed: written content does not match');
        }

        this.log('Write verified successfully');
      }

      return true;

    } catch (err) {
      throw new Error(`Failed to write file: ${err.message}`);
    }
  }

  /**
   * Safely append to a file
   */
  async safeAppend(filePath, content, options = {}) {
    const encoding = options.encoding || this.options.encoding;
    const flushDelay = options.flushDelay || this.options.flushDelay;

    try {
      this.log(`Appending ${content.length} characters to ${filePath}`);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Append to file
      fs.appendFileSync(filePath, content, encoding);

      // Explicit flush
      const fd = fs.openSync(filePath, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);

      this.log('Content appended and flushed');

      // Wait for file system
      await this.wait(flushDelay);

      return true;

    } catch (err) {
      throw new Error(`Failed to append to file: ${err.message}`);
    }
  }

  /**
   * Safely copy a file
   */
  async safeCopy(sourcePath, destPath, options = {}) {
    try {
      this.log(`Copying ${sourcePath} to ${destPath}`);

      // Validate source
      const validation = this.validator.validateFile(sourcePath);
      if (!validation.valid) {
        throw new Error(`Source file validation failed: ${validation.issues.join(', ')}`);
      }

      // Read source
      const content = fs.readFileSync(sourcePath);

      // Write destination
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(destPath, content);

      // Flush
      const fd = fs.openSync(destPath, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);

      this.log('File copied successfully');
      return true;

    } catch (err) {
      throw new Error(`Failed to copy file: ${err.message}`);
    }
  }

  /**
   * Safely delete a file
   */
  async safeDelete(filePath, options = {}) {
    const verify = options.verify !== false;

    try {
      this.log(`Deleting ${filePath}`);

      if (!fs.existsSync(filePath)) {
        this.log('File does not exist, nothing to delete');
        return true;
      }

      fs.unlinkSync(filePath);

      if (verify) {
        await this.wait(500);
        if (fs.existsSync(filePath)) {
          throw new Error('Verification failed: file still exists after deletion');
        }
      }

      this.log('File deleted successfully');
      return true;

    } catch (err) {
      throw new Error(`Failed to delete file: ${err.message}`);
    }
  }

  /**
   * Wait for file to be readable (polling)
   */
  async waitForReadable(filePath, options = {}) {
    const timeout = options.timeout || 10000;
    const pollInterval = options.pollInterval || 500;
    const minSize = options.minSize || 1;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size >= minSize) {
            // Validate file
            const validation = this.validator.validateFile(filePath);
            if (validation.valid) {
              this.log(`File readable after ${Date.now() - startTime}ms`);
              return true;
            }
          }
        }
      } catch (err) {
        // Continue polling
      }

      await this.wait(pollInterval);
    }

    throw new Error(`Timeout waiting for file to be readable: ${filePath}`);
  }

  /**
   * Read file synchronously with basic validation
   */
  safeReadSync(filePath, options = {}) {
    const encoding = options.encoding || this.options.encoding;

    try {
      // Validate file
      const validation = this.validator.validateFile(filePath);

      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.issues.join(', ')}`);
      }

      if (validation.isBinary) {
        throw new Error('File is binary, use binary read methods');
      }

      return fs.readFileSync(filePath, encoding);

    } catch (err) {
      throw new Error(`Failed to read file: ${err.message}`);
    }
  }

  /**
   * Execute command and safely capture output to file
   */
  async executeAndCapture(command, outputFile, options = {}) {
    const { spawn } = require('child_process');
    const encoding = options.encoding || this.options.encoding;
    const flushDelay = options.flushDelay || this.options.flushDelay;

    return new Promise((resolve, reject) => {
      this.log(`Executing: ${command}`);
      this.log(`Output to: ${outputFile}`);

      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const outputStream = fs.createWriteStream(outputFile, { encoding });
      const errorStream = fs.createWriteStream(outputFile + '.err', { encoding });

      const proc = spawn(command, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      proc.stdout.pipe(outputStream);
      proc.stderr.pipe(errorStream);

      proc.on('close', async (code) => {
        // Wait for streams to flush
        outputStream.end();
        errorStream.end();

        await this.wait(flushDelay);

        // Verify files
        try {
          const validation = this.validator.validateFile(outputFile);
          this.log(`Command completed with code ${code}`);
          this.log(`Output file valid: ${validation.valid}`);

          resolve({
            code,
            outputFile,
            errorFile: outputFile + '.err',
            validation
          });
        } catch (err) {
          reject(new Error(`Failed to validate output: ${err.message}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to execute command: ${err.message}`));
      });
    });
  }
}

// Synchronous wrapper
class SafeFileOpsSync {
  constructor(options = {}) {
    this.validator = new FileValidator({ verbose: options.verbose || false });
    this.options = options;
  }

  safeReadSync(filePath, options = {}) {
    const encoding = options.encoding || 'utf8';
    const validation = this.validator.validateFile(filePath);

    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.issues.join(', ')}`);
    }

    if (validation.isBinary) {
      throw new Error('File is binary, use binary read methods');
    }

    return fs.readFileSync(filePath, encoding);
  }

  safeWriteSync(filePath, content, options = {}) {
    const encoding = options.encoding || 'utf8';

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, encoding);

    // Explicit flush
    const fd = fs.openSync(filePath, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    return true;
  }
}

// Export
module.exports = { SafeFileOps, SafeFileOpsSync };

// CLI
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command) {
    console.log('Usage: node safe-file-ops.js <command> [args]');
    console.log('\nCommands:');
    console.log('  read <file>              Safely read a file');
    console.log('  write <file> <content>   Safely write to a file');
    console.log('  copy <source> <dest>     Safely copy a file');
    console.log('  delete <file>            Safely delete a file');
    console.log('  wait <file>              Wait for file to be readable');
    process.exit(1);
  }

  const ops = new SafeFileOps({ verbose: true });

  (async () => {
    try {
      switch (command) {
        case 'read':
          const content = await ops.safeRead(args[0]);
          console.log(content);
          break;

        case 'write':
          await ops.safeWrite(args[0], args[1]);
          console.log('✓ Write successful');
          break;

        case 'copy':
          await ops.safeCopy(args[0], args[1]);
          console.log('✓ Copy successful');
          break;

        case 'delete':
          await ops.safeDelete(args[0]);
          console.log('✓ Delete successful');
          break;

        case 'wait':
          await ops.waitForReadable(args[0]);
          console.log('✓ File is readable');
          break;

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (err) {
      console.error(`✗ Error: ${err.message}`);
      process.exit(1);
    }
  })();
}
