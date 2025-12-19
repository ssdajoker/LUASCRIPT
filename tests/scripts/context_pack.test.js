"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  collectMcpEndpoints,
  loadInstructions,
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
  COORDINATION_DOC,
} = require("../../scripts/context_pack");

// Helper function to clear MCP endpoint environment variables
function clearMcpEndpoints() {
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
      delete process.env[key];
    }
  });
}

// Helper function to restore environment variables
function restoreEnv(originalEnv) {
  // Clear current env vars
  Object.keys(process.env).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      delete process.env[key];
    }
  });
  // Restore original values
  Object.keys(originalEnv).forEach(key => {
    process.env[key] = originalEnv[key];
  });
}

// Helper function to create temporary directory
function createTempDir() {
  const tmpDir = path.join(os.tmpdir(), `context_pack_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

// Helper function to clean up temporary directory
function cleanupTempDir(tmpDir) {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Test collectMcpEndpoints
function testCollectMcpEndpoints() {
  const originalEnv = { ...process.env };
  try {
    clearMcpEndpoints();
    
    // Test with no MCP endpoints (still returns priority keys with empty values)
    let result = collectMcpEndpoints();
    assert.ok(result.endpoints, 'Should have endpoints property');
    assert.ok(result.entries, 'Should have entries property');
    assert.ok(result.keys, 'Should have keys property');
    assert.ok(result.envString, 'Should have envString property');
    assert.deepStrictEqual(result.endpoints, {}, 'endpoints should be empty when no URLs are set');
    
    // Test with single MCP endpoint
    process.env.MCP_TEST_ENDPOINT = 'http://localhost:8787';
    result = collectMcpEndpoints();
    assert.strictEqual(result.endpoints.MCP_TEST_ENDPOINT, 'http://localhost:8787', 'Should collect single MCP endpoint');
    
    // Test with multiple MCP endpoints
    process.env.MCP_ANOTHER_ENDPOINT = 'http://localhost:9999';
    result = collectMcpEndpoints();
    assert.strictEqual(result.endpoints.MCP_TEST_ENDPOINT, 'http://localhost:8787', 'Should collect first MCP endpoint');
    assert.strictEqual(result.endpoints.MCP_ANOTHER_ENDPOINT, 'http://localhost:9999', 'Should collect second MCP endpoint');
    
    console.log('✓ collectMcpEndpoints tests passed');
  } finally {
    restoreEnv(originalEnv);
  }
}

// Test loadInstructions
function testLoadInstructions() {
  const tmpDir = createTempDir();
  try {
    // Test with default instructions when file doesn't exist
    const defaultText = 'nonexistent.md';
    let result = loadInstructions(tmpDir, 'nonexistent.md', defaultText);
    assert.ok(result.path, 'Should have path property');
    assert.ok(typeof result.exists === 'boolean', 'Should have exists property');
    assert.ok(typeof result.bytes === 'number', 'Should have bytes property');
    assert.ok(typeof result.excerpt === 'string', 'Should have excerpt property');
    assert.strictEqual(result.exists, false, 'Should return exists=false when file does not exist');
    
    // Test with explicit path that exists
    const testFile = path.join(tmpDir, 'test_instructions.md');
    const testContent = 'Test instructions content';
    fs.writeFileSync(testFile, testContent);
    result = loadInstructions(tmpDir, testFile, defaultText);
    assert.strictEqual(result.exists, true, 'Should return exists=true for existing file');
    assert.strictEqual(result.excerpt, testContent, 'Should load content from explicit path');
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, 'utf8'), 'Should report correct byte length');
    
    // Test with baseDir search when no explicit path
    const baseInstructionsFile = path.join(tmpDir, DEFAULT_INSTRUCTIONS);
    const baseContent = 'Base instructions content';
    fs.writeFileSync(baseInstructionsFile, baseContent);
    result = loadInstructions(tmpDir, null, DEFAULT_INSTRUCTIONS);
    assert.strictEqual(result.exists, true, 'Should find file in baseDir when no explicit path');
    assert.strictEqual(result.excerpt, baseContent, 'Should load from baseDir when no explicit path');
    
    console.log('✓ loadInstructions tests passed');
  } finally {
    cleanupTempDir(tmpDir);
  }
}

// Test loadCopilotInstructions
function testLoadCopilotInstructions() {
  const tmpDir = createTempDir();
  try {
    // Test that it uses DEFAULT_INSTRUCTIONS
    const result = loadCopilotInstructions(tmpDir, null);
    assert.ok(result.path, 'Should return object with path');
    assert.ok(typeof result.exists === 'boolean', 'Should have exists property');
    assert.ok(typeof result.bytes === 'number', 'Should have bytes property');
    assert.ok(typeof result.excerpt === 'string', 'Should have excerpt property');
    
    // Test with explicit path
    const testFile = path.join(tmpDir, 'copilot_test.md');
    const testContent = 'Copilot test instructions';
    fs.writeFileSync(testFile, testContent);
    const resultWithPath = loadCopilotInstructions(tmpDir, testFile);
    assert.strictEqual(resultWithPath.exists, true, 'Should find file at explicit path');
    assert.strictEqual(resultWithPath.excerpt, testContent, 'Should load from explicit path');
    
    console.log('✓ loadCopilotInstructions tests passed');
  } finally {
    cleanupTempDir(tmpDir);
  }
}

// Test loadGeminiInstructions
function testLoadGeminiInstructions() {
  const tmpDir = createTempDir();
  try {
    // Test that it uses GEMINI_INSTRUCTIONS
    const result = loadGeminiInstructions(tmpDir, null);
    assert.ok(result.path, 'Should return object with path');
    assert.ok(typeof result.exists === 'boolean', 'Should have exists property');
    assert.ok(typeof result.bytes === 'number', 'Should have bytes property');
    assert.ok(typeof result.excerpt === 'string', 'Should have excerpt property');
    
    // Test with explicit path
    const testFile = path.join(tmpDir, 'gemini_test.md');
    const testContent = 'Gemini test instructions';
    fs.writeFileSync(testFile, testContent);
    const resultWithPath = loadGeminiInstructions(tmpDir, testFile);
    assert.strictEqual(resultWithPath.exists, true, 'Should find file at explicit path');
    assert.strictEqual(resultWithPath.excerpt, testContent, 'Should load from explicit path');
    
    console.log('✓ loadGeminiInstructions tests passed');
  } finally {
    cleanupTempDir(tmpDir);
  }
}

// Test writeContextArtifacts
function testWriteContextArtifacts() {
  const tmpDir = createTempDir();
  const originalEnv = { ...process.env };
  try {
    clearMcpEndpoints();
    process.env.MCP_TEST_ENDPOINT = 'http://localhost:8787';
    
    const harnessSummary = {
      totalTests: 10,
      passed: 8,
      failed: 2,
      testResults: []
    };
    
    const runInfo = {
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    };
    
    // Test artifact generation
    const result = writeContextArtifacts({
      harnessSummary,
      outDir: tmpDir,
      runInfo
    });
    
    // Verify returned object structure
    assert.ok(result.payload, 'Should return payload object');
    assert.ok(result.contextPack, 'Should return contextPack object');
    assert.strictEqual(result.payload.totalTests, 10, 'Payload should include harness summary');
    assert.ok(result.payload.mcp, 'Payload should include MCP endpoints');
    assert.ok(result.payload.instructions, 'Payload should include instructions');
    
    // Verify files were created
    const harnessResultsFile = path.join(tmpDir, 'harness_results.json');
    const contextPackFile = path.join(tmpDir, 'context_pack.json');
    const geminiPackFile = path.join(tmpDir, 'context_pack_gemini.json');
    
    assert.ok(fs.existsSync(harnessResultsFile), 'Should create harness_results.json');
    assert.ok(fs.existsSync(contextPackFile), 'Should create context_pack.json');
    assert.ok(fs.existsSync(geminiPackFile), 'Should create context_pack_gemini.json');
    
    // Verify file contents
    const harnessResults = JSON.parse(fs.readFileSync(harnessResultsFile, 'utf8'));
    assert.strictEqual(harnessResults.totalTests, 10, 'harness_results.json should contain test data');
    assert.ok(harnessResults.mcp, 'harness_results.json should contain MCP endpoints');
    assert.ok(harnessResults.mcp.endpoints, 'MCP should have endpoints property');
    assert.ok(harnessResults.instructions, 'harness_results.json should contain Copilot instructions');
    assert.ok(harnessResults.instructions.path, 'Instructions should be an object with path');
    
    const contextPack = JSON.parse(fs.readFileSync(contextPackFile, 'utf8'));
    assert.ok(contextPack.generatedAt, 'context_pack.json should have timestamp');
    assert.ok(contextPack.instructions, 'context_pack.json should have Copilot instructions');
    assert.ok(contextPack.geminiInstructions, 'context_pack.json should have Gemini instructions');
    assert.ok(contextPack.coordination, 'context_pack.json should have coordination doc');
    assert.ok(contextPack.mcp, 'context_pack.json should have MCP endpoints');
    assert.ok(contextPack.harness, 'context_pack.json should have harness summary');
    assert.deepStrictEqual(contextPack.run, runInfo, 'context_pack.json should have run info');
    
    const geminiPack = JSON.parse(fs.readFileSync(geminiPackFile, 'utf8'));
    assert.strictEqual(geminiPack.target, 'gemini', 'gemini pack should have target=gemini');
    assert.ok(geminiPack.instructions, 'gemini pack should have instructions (gemini)');
    assert.ok(geminiPack.copilotInstructions, 'gemini pack should have copilotInstructions');
    assert.ok(geminiPack.geminiInstructions, 'gemini pack should preserve geminiInstructions field');
    
    // Verify that instructions in gemini pack are different from context pack
    assert.deepStrictEqual(geminiPack.instructions, contextPack.geminiInstructions, 
      'gemini pack instructions should be gemini instructions');
    assert.deepStrictEqual(geminiPack.copilotInstructions, contextPack.instructions,
      'gemini pack copilotInstructions should be copilot instructions');
    
    console.log('✓ writeContextArtifacts tests passed');
  } finally {
    cleanupTempDir(tmpDir);
    restoreEnv(originalEnv);
  }
}

// Test writeContextArtifacts with default outDir
function testWriteContextArtifactsDefaultOutDir() {
  const originalEnv = { ...process.env };
  const defaultOutDir = path.join(process.cwd(), 'artifacts');
  const createdByTest = !fs.existsSync(defaultOutDir);
  
  try {
    clearMcpEndpoints();
    
    const harnessSummary = {
      totalTests: 5,
      passed: 5,
      failed: 0
    };
    
    // Test with default outDir (should use cwd/artifacts)
    const result = writeContextArtifacts({ harnessSummary });
    
    assert.ok(result.payload, 'Should return payload with default outDir');
    assert.ok(fs.existsSync(defaultOutDir), 'Should create default artifacts directory');
    
    console.log('✓ writeContextArtifacts with default outDir tests passed');
  } finally {
    // Clean up only if we created the directory
    if (createdByTest && fs.existsSync(defaultOutDir)) {
      // Only remove if it's empty or only contains test files
      const files = fs.readdirSync(defaultOutDir);
      const testFiles = ['harness_results.json', 'context_pack.json', 'context_pack_gemini.json'];
      const onlyTestFiles = files.every(f => testFiles.includes(f));
      if (onlyTestFiles || files.length === 0) {
        fs.rmSync(defaultOutDir, { recursive: true, force: true });
      }
    }
    restoreEnv(originalEnv);
  }
}

// Run all tests
async function runTests() {
  console.log('Running context_pack.js tests...\n');
  
  try {
    testCollectMcpEndpoints();
    testLoadInstructions();
    testLoadCopilotInstructions();
    testLoadGeminiInstructions();
    testWriteContextArtifacts();
    testWriteContextArtifactsDefaultOutDir();
    
    console.log('\n✓ All context_pack.js tests passed');
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
