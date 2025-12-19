"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
  COORDINATION_DOC,
  PRIORITY_MCP_KEYS,
  collectMcpEndpoints,
  loadInstructions,
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
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

// Test constants are exported correctly
(function testConstants() {
  assert.strictEqual(DEFAULT_INSTRUCTIONS, 'copilot-instructions.md', 'DEFAULT_INSTRUCTIONS should be correct');
  assert.strictEqual(GEMINI_INSTRUCTIONS, 'gemini-instructions.md', 'GEMINI_INSTRUCTIONS should be correct');
  assert.strictEqual(COORDINATION_DOC, 'assistant_coordination.md', 'COORDINATION_DOC should be correct');
  assert.ok(Array.isArray(PRIORITY_MCP_KEYS), 'PRIORITY_MCP_KEYS should be an array');
  assert.ok(PRIORITY_MCP_KEYS.includes('MCP_DOC_INDEX_ENDPOINT'), 'PRIORITY_MCP_KEYS should include DOC endpoint');
  assert.ok(PRIORITY_MCP_KEYS.includes('MCP_FLAKE_DB_ENDPOINT'), 'PRIORITY_MCP_KEYS should include FLAKE endpoint');
  assert.ok(PRIORITY_MCP_KEYS.includes('MCP_IR_SCHEMA_ENDPOINT'), 'PRIORITY_MCP_KEYS should include IR_SCHEMA endpoint');
})();

// Test collectMcpEndpoints with no endpoints
(function testCollectMcpEndpointsEmpty() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    const result = collectMcpEndpoints();
    
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'keys'), 'should have keys property');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'entries'), 'should have entries property');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'endpoints'), 'should have endpoints property');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'envString'), 'should have envString property');
    
    assert.ok(Array.isArray(result.keys), 'keys should be an array');
    assert.ok(Array.isArray(result.entries), 'entries should be an array');
    assert.strictEqual(typeof result.endpoints, 'object', 'endpoints should be an object');
    assert.strictEqual(typeof result.envString, 'string', 'envString should be a string');
    
    // Priority keys should still be in the keys array even if not set
    assert.ok(result.keys.includes('MCP_DOC_INDEX_ENDPOINT'), 'keys should include DOC endpoint');
    assert.ok(result.keys.includes('MCP_FLAKE_DB_ENDPOINT'), 'keys should include FLAKE endpoint');
    assert.ok(result.keys.includes('MCP_IR_SCHEMA_ENDPOINT'), 'keys should include IR_SCHEMA endpoint');
    
    // But endpoints should be empty
    assert.strictEqual(Object.keys(result.endpoints).length, 0, 'endpoints should be empty when no env vars set');
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test collectMcpEndpoints with priority endpoints
(function testCollectMcpEndpointsPriority() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    process.env.MCP_DOC_INDEX_ENDPOINT = 'http://localhost:8080/doc';
    process.env.MCP_FLAKE_DB_ENDPOINT = 'http://localhost:8081/flake';
    process.env.MCP_IR_SCHEMA_ENDPOINT = 'http://localhost:8082/schema';
    
    const result = collectMcpEndpoints();
    
    assert.strictEqual(result.endpoints.MCP_DOC_INDEX_ENDPOINT, 'http://localhost:8080/doc');
    assert.strictEqual(result.endpoints.MCP_FLAKE_DB_ENDPOINT, 'http://localhost:8081/flake');
    assert.strictEqual(result.endpoints.MCP_IR_SCHEMA_ENDPOINT, 'http://localhost:8082/schema');
    
    // Check priority order: priority keys should come first
    const firstThreeKeys = result.keys.slice(0, 3);
    assert.ok(firstThreeKeys.includes('MCP_DOC_INDEX_ENDPOINT'), 'DOC should be in first 3 keys');
    assert.ok(firstThreeKeys.includes('MCP_FLAKE_DB_ENDPOINT'), 'FLAKE should be in first 3 keys');
    assert.ok(firstThreeKeys.includes('MCP_IR_SCHEMA_ENDPOINT'), 'IR_SCHEMA should be in first 3 keys');
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test collectMcpEndpoints with mixed priority and non-priority endpoints
(function testCollectMcpEndpointsMixed() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    process.env.MCP_DOC_INDEX_ENDPOINT = 'http://localhost:8080/doc';
    process.env.MCP_CUSTOM_ENDPOINT = 'http://localhost:8083/custom';
    process.env.MCP_ANOTHER_ENDPOINT = 'http://localhost:8084/another';
    
    const result = collectMcpEndpoints();
    
    // Priority keys should come first
    const docIndex = result.keys.indexOf('MCP_DOC_INDEX_ENDPOINT');
    const customIndex = result.keys.indexOf('MCP_CUSTOM_ENDPOINT');
    const anotherIndex = result.keys.indexOf('MCP_ANOTHER_ENDPOINT');
    
    assert.ok(docIndex !== -1, 'DOC endpoint should be in keys');
    assert.ok(customIndex !== -1, 'CUSTOM endpoint should be in keys');
    assert.ok(anotherIndex !== -1, 'ANOTHER endpoint should be in keys');
    assert.ok(docIndex < customIndex, 'Priority endpoint should come before non-priority');
    assert.ok(docIndex < anotherIndex, 'Priority endpoint should come before non-priority');
    
    // Non-priority keys should be sorted alphabetically
    assert.ok(anotherIndex < customIndex, 'Non-priority keys should be sorted (ANOTHER before CUSTOM)');
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test collectMcpEndpoints handles empty string values
(function testCollectMcpEndpointsEmptyValues() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    process.env.MCP_DOC_INDEX_ENDPOINT = '';
    process.env.MCP_FLAKE_DB_ENDPOINT = '   '; // whitespace only
    process.env.MCP_VALID_ENDPOINT = 'http://localhost:8080/valid';
    
    const result = collectMcpEndpoints();
    
    // Empty and whitespace-only values should be filtered out
    assert.ok(!Object.prototype.hasOwnProperty.call(result.endpoints, 'MCP_DOC_INDEX_ENDPOINT'), 'Empty endpoint should not be in endpoints');
    assert.ok(!Object.prototype.hasOwnProperty.call(result.endpoints, 'MCP_FLAKE_DB_ENDPOINT'), 'Whitespace endpoint should not be in endpoints');
    assert.ok(Object.prototype.hasOwnProperty.call(result.endpoints, 'MCP_VALID_ENDPOINT'), 'Valid endpoint should be in endpoints');
    assert.strictEqual(result.endpoints.MCP_VALID_ENDPOINT, 'http://localhost:8080/valid');
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test loadInstructions with existing file
(function testLoadInstructionsExisting() {
  const testDir = path.join(__dirname, 'tmp_test_load_instructions');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const testContent = '# Test Instructions\n\nThis is a test file for instructions.';
    const testFile = path.join(testDir, 'test-instructions.md');
    fs.writeFileSync(testFile, testContent);
    
    const result = loadInstructions(testDir, null, 'test-instructions.md');
    
    assert.ok(result.exists, 'file should exist');
    assert.strictEqual(result.path, 'test-instructions.md', 'path should be relative to baseDir');
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, 'utf8'), 'bytes should match content length');
    assert.strictEqual(result.excerpt, testContent, 'excerpt should contain full content (under 2000 chars)');
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadInstructions with missing file
(function testLoadInstructionsMissing() {
  const testDir = path.join(__dirname, 'tmp_test_load_instructions_missing');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const result = loadInstructions(testDir, null, 'nonexistent.md');
    
    assert.ok(!result.exists, 'file should not exist');
    assert.strictEqual(result.path, 'nonexistent.md', 'path should still be returned');
    assert.strictEqual(result.bytes, 0, 'bytes should be 0');
    assert.strictEqual(result.excerpt, '', 'excerpt should be empty string');
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadInstructions with absolute path
(function testLoadInstructionsAbsolutePath() {
  const testDir = path.join(__dirname, 'tmp_test_absolute_path');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const testContent = 'Absolute path test';
    const absolutePath = path.join(testDir, 'absolute.md');
    fs.writeFileSync(absolutePath, testContent);
    
    const result = loadInstructions(testDir, absolutePath, null);
    
    assert.ok(result.exists, 'file should exist');
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, 'utf8'));
    assert.strictEqual(result.excerpt, testContent);
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadInstructions with large file (excerpt truncation)
(function testLoadInstructionsLargeFile() {
  const testDir = path.join(__dirname, 'tmp_test_large_file');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a file larger than 2000 bytes
    const testContent = 'x'.repeat(3000);
    const testFile = path.join(testDir, 'large.md');
    fs.writeFileSync(testFile, testContent);
    
    const result = loadInstructions(testDir, null, 'large.md');
    
    assert.ok(result.exists, 'file should exist');
    assert.strictEqual(result.bytes, 3000, 'bytes should be full file size');
    assert.strictEqual(result.excerpt.length, 2000, 'excerpt should be truncated to 2000 chars');
    assert.strictEqual(result.excerpt, testContent.slice(0, 2000), 'excerpt should match first 2000 chars');
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadCopilotInstructions
(function testLoadCopilotInstructions() {
  const testDir = path.join(__dirname, 'tmp_test_copilot_instructions');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const testContent = '# Copilot Instructions';
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), testContent);
    
    const result = loadCopilotInstructions(testDir);
    
    assert.ok(result.exists, 'default copilot instructions should exist');
    assert.strictEqual(result.path, DEFAULT_INSTRUCTIONS);
    assert.ok(result.bytes > 0, 'should have content');
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadCopilotInstructions with custom path
(function testLoadCopilotInstructionsCustomPath() {
  const testDir = path.join(__dirname, 'tmp_test_copilot_custom');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const customPath = 'custom-copilot.md';
    const testContent = '# Custom Copilot';
    fs.writeFileSync(path.join(testDir, customPath), testContent);
    
    const result = loadCopilotInstructions(testDir, customPath);
    
    assert.ok(result.exists, 'custom copilot instructions should exist');
    assert.strictEqual(result.path, customPath);
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadGeminiInstructions
(function testLoadGeminiInstructions() {
  const testDir = path.join(__dirname, 'tmp_test_gemini_instructions');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const testContent = '# Gemini Instructions';
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), testContent);
    
    const result = loadGeminiInstructions(testDir);
    
    assert.ok(result.exists, 'default gemini instructions should exist');
    assert.strictEqual(result.path, GEMINI_INSTRUCTIONS);
    assert.ok(result.bytes > 0, 'should have content');
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test loadGeminiInstructions with custom path
(function testLoadGeminiInstructionsCustomPath() {
  const testDir = path.join(__dirname, 'tmp_test_gemini_custom');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const customPath = 'custom-gemini.md';
    const testContent = '# Custom Gemini';
    fs.writeFileSync(path.join(testDir, customPath), testContent);
    
    const result = loadGeminiInstructions(testDir, customPath);
    
    assert.ok(result.exists, 'custom gemini instructions should exist');
    assert.strictEqual(result.path, customPath);
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test writeContextArtifacts basic functionality
(function testWriteContextArtifactsBasic() {
  const testDir = path.join(__dirname, 'tmp_test_write_artifacts');
  const outDir = path.join(testDir, 'artifacts');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    clearMcpEndpoints();
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    delete process.env.ASSISTANT_COORD_PATH;
    
    const harnessSummary = {
      totalTests: 10,
      passed: 8,
      failed: 2,
    };
    
    const result = writeContextArtifacts({ harnessSummary, outDir });
    
    // Check that directory was created
    assert.ok(fs.existsSync(outDir), 'artifacts directory should be created');
    
    // Check that files were created
    assert.ok(fs.existsSync(path.join(outDir, 'harness_results.json')), 'harness_results.json should be created');
    assert.ok(fs.existsSync(path.join(outDir, 'context_pack.json')), 'context_pack.json should be created');
    assert.ok(fs.existsSync(path.join(outDir, 'context_pack_gemini.json')), 'context_pack_gemini.json should be created');
    
    // Verify harness_results.json structure
    const harnessResults = JSON.parse(fs.readFileSync(path.join(outDir, 'harness_results.json'), 'utf8'));
    assert.strictEqual(harnessResults.totalTests, 10);
    assert.strictEqual(harnessResults.passed, 8);
    assert.strictEqual(harnessResults.failed, 2);
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, 'mcp'), 'should have mcp property');
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, 'instructions'), 'should have instructions property');
    
    // Verify context_pack.json structure
    const contextPack = JSON.parse(fs.readFileSync(path.join(outDir, 'context_pack.json'), 'utf8'));
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'generatedAt'), 'should have generatedAt');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'run'), 'should have run');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'instructions'), 'should have instructions');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'geminiInstructions'), 'should have geminiInstructions');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'coordination'), 'should have coordination');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'mcp'), 'should have mcp');
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'harness'), 'should have harness');
    
    // Verify context_pack_gemini.json structure
    const geminiPack = JSON.parse(fs.readFileSync(path.join(outDir, 'context_pack_gemini.json'), 'utf8'));
    assert.strictEqual(geminiPack.target, 'gemini', 'gemini pack should have target=gemini');
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, 'instructions'), 'should have instructions');
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, 'copilotInstructions'), 'should have copilotInstructions');
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, 'generatedAt'), 'should have generatedAt');
    
    // Verify return value
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'payload'), 'result should have payload');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'contextPack'), 'result should have contextPack');
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test writeContextArtifacts with custom instructions paths
(function testWriteContextArtifactsCustomPaths() {
  const testDir = path.join(__dirname, 'tmp_test_write_custom_paths');
  const outDir = path.join(testDir, 'artifacts');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Create custom instruction files
    const copilotContent = '# Custom Copilot';
    const geminiContent = '# Custom Gemini';
    const coordContent = '# Custom Coordination';
    
    fs.writeFileSync(path.join(testDir, 'my-copilot.md'), copilotContent);
    fs.writeFileSync(path.join(testDir, 'my-gemini.md'), geminiContent);
    fs.writeFileSync(path.join(testDir, 'my-coord.md'), coordContent);
    
    process.env.COPILOT_INSTRUCTIONS_PATH = 'my-copilot.md';
    process.env.GEMINI_INSTRUCTIONS_PATH = 'my-gemini.md';
    process.env.ASSISTANT_COORD_PATH = 'my-coord.md';
    
    clearMcpEndpoints();
    
    const harnessSummary = { totalTests: 5 };
    
    writeContextArtifacts({ harnessSummary, outDir });
    
    const contextPack = JSON.parse(fs.readFileSync(path.join(outDir, 'context_pack.json'), 'utf8'));
    
    // Verify custom paths were used
    assert.strictEqual(contextPack.instructions.path, 'my-copilot.md', 'should use custom copilot path');
    assert.ok(contextPack.instructions.exists, 'custom copilot should exist');
    
    assert.strictEqual(contextPack.geminiInstructions.path, 'my-gemini.md', 'should use custom gemini path');
    assert.ok(contextPack.geminiInstructions.exists, 'custom gemini should exist');
    
    assert.strictEqual(contextPack.coordination.path, 'my-coord.md', 'should use custom coordination path');
    assert.ok(contextPack.coordination.exists, 'custom coordination should exist');
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test writeContextArtifacts with MCP endpoints
(function testWriteContextArtifactsWithMcp() {
  const testDir = path.join(__dirname, 'tmp_test_write_with_mcp');
  const outDir = path.join(testDir, 'artifacts');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    process.env.MCP_DOC_INDEX_ENDPOINT = 'http://localhost:8080/doc';
    process.env.MCP_FLAKE_DB_ENDPOINT = 'http://localhost:8081/flake';
    
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    delete process.env.ASSISTANT_COORD_PATH;
    
    const harnessSummary = { totalTests: 3 };
    
    writeContextArtifacts({ harnessSummary, outDir });
    
    const contextPack = JSON.parse(fs.readFileSync(path.join(outDir, 'context_pack.json'), 'utf8'));
    
    // Verify MCP endpoints are included
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack.mcp, 'endpoints'), 'should have mcp.endpoints');
    assert.strictEqual(contextPack.mcp.endpoints.MCP_DOC_INDEX_ENDPOINT, 'http://localhost:8080/doc');
    assert.strictEqual(contextPack.mcp.endpoints.MCP_FLAKE_DB_ENDPOINT, 'http://localhost:8081/flake');
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

// Test writeContextArtifacts with runInfo
(function testWriteContextArtifactsWithRunInfo() {
  const testDir = path.join(__dirname, 'tmp_test_write_with_runinfo');
  const outDir = path.join(testDir, 'artifacts');
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    clearMcpEndpoints();
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    delete process.env.ASSISTANT_COORD_PATH;
    
    const harnessSummary = { totalTests: 7 };
    const runInfo = {
      branch: 'main',
      commit: 'abc123',
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    writeContextArtifacts({ harnessSummary, outDir, runInfo });
    
    const contextPack = JSON.parse(fs.readFileSync(path.join(outDir, 'context_pack.json'), 'utf8'));
    
    // Verify runInfo is included
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, 'run'), 'should have run property');
    assert.strictEqual(contextPack.run.branch, 'main');
    assert.strictEqual(contextPack.run.commit, 'abc123');
    assert.strictEqual(contextPack.run.timestamp, '2024-01-01T00:00:00Z');
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

console.log("context_pack tests completed successfully.");
