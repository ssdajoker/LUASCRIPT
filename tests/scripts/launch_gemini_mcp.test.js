const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { main } = require('../../scripts/launch_gemini_mcp');

class LaunchGeminiMcpTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.testDir = null;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('Running launch_gemini_mcp.js Test Suite...\n');

    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        console.error(error.stack);
        this.failed++;
      }
    }

    console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  setupTestDir() {
    // Clean up any previous test directory first
    this.cleanupTestDir();
    
    this.testDir = path.join(__dirname, '..', '..', 'tmp', 'test_launch_gemini_mcp');
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });
    return this.testDir;
  }

  cleanupTestDir() {
    if (this.testDir && fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
      this.testDir = null;
    }
  }
}

async function runTests() {
  const runner = new LaunchGeminiMcpTestRunner();

  runner.test('main() creates artifacts directory', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://example.com/doc';

      // Capture console output
      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      // Verify artifacts directory was created
      const artifactsDir = path.join(testDir, 'artifacts');
      assert.ok(fs.existsSync(artifactsDir), 'artifacts directory should exist');

      // Verify output file was created
      const endpointsFile = path.join(artifactsDir, 'gemini_mcp_endpoints.json');
      assert.ok(fs.existsSync(endpointsFile), 'gemini_mcp_endpoints.json should exist');

      // Verify content
      const content = JSON.parse(fs.readFileSync(endpointsFile, 'utf8'));
      assert.ok(content.endpoints, 'should have endpoints object');
      assert.ok(content.keys, 'should have keys array');
      assert.ok(content.entries, 'should have entries array');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() handles MCP environment variables', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://doc.example.com';
      process.env.MCP_FLAKE_DB_ENDPOINT = 'http://flake.example.com';
      process.env.MCP_IR_SCHEMA_ENDPOINT = 'http://ir.example.com';

      // Capture console output
      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      // Verify output
      const endpointsFile = path.join(testDir, 'artifacts', 'gemini_mcp_endpoints.json');
      const content = JSON.parse(fs.readFileSync(endpointsFile, 'utf8'));

      assert.strictEqual(content.endpoints.MCP_DOC_INDEX_ENDPOINT, 'http://doc.example.com');
      assert.strictEqual(content.endpoints.MCP_FLAKE_DB_ENDPOINT, 'http://flake.example.com');
      assert.strictEqual(content.endpoints.MCP_IR_SCHEMA_ENDPOINT, 'http://ir.example.com');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() produces correct console output', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://example.com/doc';

      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      const output = logs.join('\n');
      assert.ok(output.includes('MCP endpoints captured for Gemini:'), 'should show MCP endpoints message');
      assert.ok(output.includes('MCP_DOC_INDEX_ENDPOINT'), 'should list endpoint key');
      assert.ok(output.includes('http://example.com/doc'), 'should show endpoint URL');
      assert.ok(output.includes('Suggested env export for Gemini:'), 'should show env export suggestion');
      assert.ok(output.includes('Config written:'), 'should show config written message');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() warns when gemini-instructions.md is missing', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://example.com/doc';

      const logs = [];
      const warns = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => warns.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      const warnOutput = warns.join('\n');
      assert.ok(warnOutput.includes('No gemini-instructions.md found'), 'should warn about missing instructions file');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() reports gemini-instructions.md when present', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://example.com/doc';

      // Create gemini-instructions.md
      const instructionsContent = '# Gemini Instructions\n\nTest instructions for Gemini.';
      fs.writeFileSync(path.join(testDir, 'gemini-instructions.md'), instructionsContent);

      const logs = [];
      const warns = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => warns.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      const logOutput = logs.join('\n');
      assert.ok(logOutput.includes('Gemini instructions path:'), 'should report instructions path');
      assert.ok(logOutput.includes('bytes'), 'should report file size');
      assert.strictEqual(warns.length, 0, 'should not warn when instructions file exists');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() handles custom GEMINI_INSTRUCTIONS_PATH', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_DOC_INDEX_ENDPOINT = 'http://example.com/doc';

      // Create custom instructions file
      const customPath = path.join(testDir, 'custom-gemini.md');
      const instructionsContent = '# Custom Gemini Instructions\n\nCustom test instructions.';
      fs.writeFileSync(customPath, instructionsContent);
      process.env.GEMINI_INSTRUCTIONS_PATH = customPath;

      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      const logOutput = logs.join('\n');
      assert.ok(logOutput.includes('custom-gemini.md'), 'should use custom instructions path');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() handles empty MCP endpoints', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      
      // Clear all MCP endpoints
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
          delete process.env[key];
        }
      });

      const logs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => logs.push(args.join(' '));

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      // Verify file was created even with empty endpoints
      const endpointsFile = path.join(testDir, 'artifacts', 'gemini_mcp_endpoints.json');
      assert.ok(fs.existsSync(endpointsFile), 'should create file even with no endpoints');

      const content = JSON.parse(fs.readFileSync(endpointsFile, 'utf8'));
      assert.ok(Array.isArray(content.keys), 'should have keys array');
      assert.ok(Array.isArray(content.entries), 'should have entries array');
      assert.strictEqual(typeof content.endpoints, 'object', 'should have endpoints object');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  runner.test('main() creates valid JSON output', () => {
    const testDir = runner.setupTestDir();
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };

    try {
      process.chdir(testDir);
      process.env.MCP_TEST_ENDPOINT = 'http://test.example.com';

      // Suppress console output
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = () => {};
      console.warn = () => {};

      main();

      console.log = originalLog;
      console.warn = originalWarn;

      const endpointsFile = path.join(testDir, 'artifacts', 'gemini_mcp_endpoints.json');
      const content = fs.readFileSync(endpointsFile, 'utf8');

      // Should be valid JSON
      let parsed;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(content);
      }, 'should produce valid JSON');

      // Should have expected structure
      assert.ok(parsed.keys, 'should have keys property');
      assert.ok(parsed.entries, 'should have entries property');
      assert.ok(parsed.endpoints, 'should have endpoints property');
      assert.ok(parsed.envString, 'should have envString property');

      // Should be properly formatted (with indentation)
      assert.ok(content.includes('\n'), 'should be pretty-printed with newlines');
    } finally {
      process.chdir(originalCwd);
      Object.keys(process.env).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      runner.cleanupTestDir();
    }
  });

  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  runTests();
}

module.exports = { LaunchGeminiMcpTestRunner, runTests };
