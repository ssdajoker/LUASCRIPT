"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  collectMcpEndpoints,
  loadInstructions,
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
  COORDINATION_DOC,
  PRIORITY_MCP_KEYS,
} = require("../../scripts/context_pack");
const {
  clearMcpEndpoints,
  restoreEnv,
} = require("./test-utils");

// Constants matching the implementation in context_pack.js
const EXCERPT_LIMIT = 2000; // Maximum bytes for instruction file excerpt

(function testCollectMcpEndpointsEmpty() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    const result = collectMcpEndpoints();
    
    assert.ok(Array.isArray(result.keys), "keys should be an array");
    assert.ok(Array.isArray(result.entries), "entries should be an array");
    assert.ok(typeof result.endpoints === "object", "endpoints should be an object");
    assert.ok(typeof result.envString === "string", "envString should be a string");
    
    // Should have priority keys even if no env vars set
    PRIORITY_MCP_KEYS.forEach(key => {
      assert.ok(result.keys.includes(key), `keys should include ${key}`);
    });
    
    // No endpoints should be present
    assert.strictEqual(Object.keys(result.endpoints).length, 0, "endpoints should be empty");
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

(function testCollectMcpEndpointsWithValues() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    // Set test MCP endpoints
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:8080/doc";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:8081/flake";
    process.env.MCP_IR_SCHEMA_ENDPOINT = "http://localhost:8082/ir";
    process.env.MCP_TEST_ENDPOINT = "http://localhost:8083/test";
    
    const result = collectMcpEndpoints();
    
    // Check priority keys come first
    assert.strictEqual(result.keys[0], "MCP_DOC_INDEX_ENDPOINT");
    assert.strictEqual(result.keys[1], "MCP_FLAKE_DB_ENDPOINT");
    assert.strictEqual(result.keys[2], "MCP_IR_SCHEMA_ENDPOINT");
    
    // Should contain all test endpoints
    assert.ok(result.keys.includes("MCP_TEST_ENDPOINT"), "should include TEST endpoint key");
    
    // Check endpoints object has values
    assert.strictEqual(result.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    assert.strictEqual(result.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:8081/flake");
    assert.strictEqual(result.endpoints.MCP_IR_SCHEMA_ENDPOINT, "http://localhost:8082/ir");
    assert.strictEqual(result.endpoints.MCP_TEST_ENDPOINT, "http://localhost:8083/test");
    
    // Check envString is valid JSON
    const parsed = JSON.parse(result.envString);
    assert.strictEqual(parsed.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

(function testCollectMcpEndpointsTrimsWhitespace() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    // Set endpoint with whitespace
    process.env.MCP_DOC_INDEX_ENDPOINT = "  http://localhost:8080/doc  ";
    
    const result = collectMcpEndpoints();
    
    // Should trim whitespace
    assert.strictEqual(result.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

(function testCollectMcpEndpointsIgnoresEmptyValues() {
  const originalEnv = { ...process.env };
  
  try {
    clearMcpEndpoints();
    
    // Set empty endpoint
    process.env.MCP_DOC_INDEX_ENDPOINT = "";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:8081/flake";
    
    const result = collectMcpEndpoints();
    
    // Empty value should not be in endpoints
    assert.ok(!Object.prototype.hasOwnProperty.call(result.endpoints, "MCP_DOC_INDEX_ENDPOINT"));
    assert.ok(Object.prototype.hasOwnProperty.call(result.endpoints, "MCP_FLAKE_DB_ENDPOINT"));
    
  } finally {
    restoreEnv(originalEnv);
  }
})();

(function testLoadInstructionsFileExists() {
  const testDir = path.join(__dirname, "tmp_test_load_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a test file
    const testContent = "# Test Instructions\n\nThis is a test file for instructions.";
    const testFile = "test-instructions.md";
    fs.writeFileSync(path.join(testDir, testFile), testContent);
    
    const result = loadInstructions(testDir, testFile, "fallback.md");
    
    assert.strictEqual(result.path, testFile, "path should match");
    assert.strictEqual(result.exists, true, "file should exist");
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, 'utf8'), "bytes should match content length");
    assert.ok(result.excerpt.includes("Test Instructions"), "excerpt should contain content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadInstructionsFileNotExists() {
  const testDir = path.join(__dirname, "tmp_test_load_instructions_missing");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const result = loadInstructions(testDir, "nonexistent.md", "fallback.md");
    
    assert.strictEqual(result.exists, false, "file should not exist");
    assert.strictEqual(result.bytes, 0, "bytes should be 0");
    assert.strictEqual(result.excerpt, "", "excerpt should be empty");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadInstructionsUsesFallback() {
  const testDir = path.join(__dirname, "tmp_test_load_instructions_fallback");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create fallback file
    const fallbackContent = "# Fallback Instructions";
    fs.writeFileSync(path.join(testDir, "fallback.md"), fallbackContent);
    
    const result = loadInstructions(testDir, null, "fallback.md");
    
    assert.strictEqual(result.path, "fallback.md", "should use fallback path");
    assert.strictEqual(result.exists, true, "fallback file should exist");
    assert.ok(result.excerpt.includes("Fallback"), "excerpt should contain fallback content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadInstructionsAbsolutePath() {
  const testDir = path.join(__dirname, "tmp_test_load_instructions_absolute");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a test file
    const testContent = "# Absolute Path Test";
    const absolutePath = path.join(testDir, "absolute.md");
    fs.writeFileSync(absolutePath, testContent);
    
    const result = loadInstructions(testDir, absolutePath, "fallback.md");
    
    assert.strictEqual(result.exists, true, "file should exist");
    assert.ok(result.excerpt.includes("Absolute Path"), "excerpt should contain content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadInstructionsExcerptTruncation() {
  const testDir = path.join(__dirname, "tmp_test_load_instructions_excerpt");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a large file (> excerpt limit)
    const LARGE_FILE_SIZE = EXCERPT_LIMIT + 1000;
    const largeContent = "A".repeat(LARGE_FILE_SIZE);
    fs.writeFileSync(path.join(testDir, "large.md"), largeContent);
    
    const result = loadInstructions(testDir, "large.md", "fallback.md");
    
    assert.strictEqual(result.excerpt.length, EXCERPT_LIMIT, `excerpt should be truncated to ${EXCERPT_LIMIT} bytes`);
    assert.strictEqual(result.bytes, LARGE_FILE_SIZE, "bytes should reflect full content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadCopilotInstructions() {
  const testDir = path.join(__dirname, "tmp_test_copilot_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create default file
    const content = "# Copilot Instructions";
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), content);
    
    const result = loadCopilotInstructions(testDir, null);
    
    assert.strictEqual(result.path, DEFAULT_INSTRUCTIONS, "should use default path");
    assert.strictEqual(result.exists, true, "file should exist");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadCopilotInstructionsCustomPath() {
  const testDir = path.join(__dirname, "tmp_test_copilot_custom");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create custom file
    const content = "# Custom Copilot Instructions";
    const customPath = "custom-copilot.md";
    fs.writeFileSync(path.join(testDir, customPath), content);
    
    const result = loadCopilotInstructions(testDir, customPath);
    
    assert.strictEqual(result.path, customPath, "should use custom path");
    assert.strictEqual(result.exists, true, "file should exist");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadGeminiInstructions() {
  const testDir = path.join(__dirname, "tmp_test_gemini_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create default file
    const content = "# Gemini Instructions";
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), content);
    
    const result = loadGeminiInstructions(testDir, null);
    
    assert.strictEqual(result.path, GEMINI_INSTRUCTIONS, "should use default path");
    assert.strictEqual(result.exists, true, "file should exist");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadGeminiInstructionsCustomPath() {
  const testDir = path.join(__dirname, "tmp_test_gemini_custom");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create custom file
    const content = "# Custom Gemini Instructions";
    const customPath = "custom-gemini.md";
    fs.writeFileSync(path.join(testDir, customPath), content);
    
    const result = loadGeminiInstructions(testDir, customPath);
    
    assert.strictEqual(result.path, customPath, "should use custom path");
    assert.strictEqual(result.exists, true, "file should exist");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsBasic() {
  const testDir = path.join(__dirname, "tmp_test_write_artifacts");
  const artifactsDir = path.join(testDir, "artifacts");
  
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
    
    const result = writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Check artifacts directory created
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    
    // Check files created
    assert.ok(fs.existsSync(path.join(artifactsDir, "harness_results.json")), "harness_results.json should be created");
    assert.ok(fs.existsSync(path.join(artifactsDir, "context_pack.json")), "context_pack.json should be created");
    assert.ok(fs.existsSync(path.join(artifactsDir, "context_pack_gemini.json")), "context_pack_gemini.json should be created");
    
    // Check harness_results.json content
    const harnessResults = JSON.parse(fs.readFileSync(path.join(artifactsDir, "harness_results.json"), "utf8"));
    assert.strictEqual(harnessResults.totalTests, 10, "harness results should include totalTests");
    assert.strictEqual(harnessResults.passed, 8, "harness results should include passed");
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, "mcp"), "harness results should include mcp");
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, "instructions"), "harness results should include instructions");
    
    // Check context_pack.json content
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "generatedAt"), "context pack should include generatedAt");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "run"), "context pack should include run");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "instructions"), "context pack should include instructions");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "geminiInstructions"), "context pack should include geminiInstructions");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "coordination"), "context pack should include coordination");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "mcp"), "context pack should include mcp");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "harness"), "context pack should include harness");
    
    // Check context_pack_gemini.json content
    const geminiPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack_gemini.json"), "utf8"));
    assert.strictEqual(geminiPack.target, "gemini", "gemini pack should have target=gemini");
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, "copilotInstructions"), "gemini pack should include copilotInstructions");
    
    // Check return values
    assert.ok(Object.prototype.hasOwnProperty.call(result, "payload"), "result should include payload");
    assert.ok(Object.prototype.hasOwnProperty.call(result, "contextPack"), "result should include contextPack");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsWithMcpEndpoints() {
  const testDir = path.join(__dirname, "tmp_test_write_artifacts_mcp");
  const artifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Set MCP endpoints
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:8080/doc";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:8081/flake";
    
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    delete process.env.ASSISTANT_COORD_PATH;
    
    const harnessSummary = {
      totalTests: 5,
      passed: 5,
    };
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Check context_pack.json has MCP endpoints
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack.mcp, "endpoints"), "mcp should include endpoints");
    assert.strictEqual(contextPack.mcp.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    assert.strictEqual(contextPack.mcp.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:8081/flake");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsWithInstructions() {
  const testDir = path.join(__dirname, "tmp_test_write_artifacts_instructions");
  const artifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    clearMcpEndpoints();
    
    // Create instruction files
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), "# Copilot Instructions");
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), "# Gemini Instructions");
    fs.writeFileSync(path.join(testDir, COORDINATION_DOC), "# Coordination Doc");
    
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    delete process.env.ASSISTANT_COORD_PATH;
    
    const harnessSummary = {
      totalTests: 3,
      passed: 3,
    };
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Check context_pack.json has instructions
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.strictEqual(contextPack.instructions.exists, true, "instructions should exist");
    assert.strictEqual(contextPack.geminiInstructions.exists, true, "geminiInstructions should exist");
    assert.strictEqual(contextPack.coordination.exists, true, "coordination should exist");
    
    // Check gemini pack has correct instructions
    const geminiPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack_gemini.json"), "utf8"));
    assert.strictEqual(geminiPack.instructions.path, GEMINI_INSTRUCTIONS, "gemini pack instructions should be gemini");
    assert.strictEqual(geminiPack.copilotInstructions.path, DEFAULT_INSTRUCTIONS, "gemini pack copilotInstructions should be copilot");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsWithCustomPaths() {
  const testDir = path.join(__dirname, "tmp_test_write_artifacts_custom");
  const artifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    clearMcpEndpoints();
    
    // Create custom instruction files
    const customCopilot = "custom-copilot.md";
    const customGemini = "custom-gemini.md";
    const customCoord = "custom-coord.md";
    
    fs.writeFileSync(path.join(testDir, customCopilot), "# Custom Copilot");
    fs.writeFileSync(path.join(testDir, customGemini), "# Custom Gemini");
    fs.writeFileSync(path.join(testDir, customCoord), "# Custom Coordination");
    
    process.env.COPILOT_INSTRUCTIONS_PATH = customCopilot;
    process.env.GEMINI_INSTRUCTIONS_PATH = customGemini;
    process.env.ASSISTANT_COORD_PATH = customCoord;
    
    const harnessSummary = {
      totalTests: 1,
      passed: 1,
    };
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Check context_pack.json uses custom paths
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.strictEqual(contextPack.instructions.path, customCopilot, "should use custom copilot path");
    assert.strictEqual(contextPack.geminiInstructions.path, customGemini, "should use custom gemini path");
    assert.strictEqual(contextPack.coordination.path, customCoord, "should use custom coordination path");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsWithRunInfo() {
  const testDir = path.join(__dirname, "tmp_test_write_artifacts_runinfo");
  const artifactsDir = path.join(testDir, "artifacts");
  
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
      totalTests: 1,
      passed: 1,
    };
    
    const runInfo = {
      timestamp: "2024-01-01T00:00:00Z",
      user: "test-user",
      branch: "main",
    };
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
      runInfo,
    });
    
    // Check context_pack.json includes run info
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.strictEqual(contextPack.run.timestamp, "2024-01-01T00:00:00Z", "should include timestamp");
    assert.strictEqual(contextPack.run.user, "test-user", "should include user");
    assert.strictEqual(contextPack.run.branch, "main", "should include branch");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testPriorityMcpKeysConstant() {
  // Verify PRIORITY_MCP_KEYS is exported correctly
  assert.ok(Array.isArray(PRIORITY_MCP_KEYS), "PRIORITY_MCP_KEYS should be an array");
  assert.ok(PRIORITY_MCP_KEYS.includes("MCP_DOC_INDEX_ENDPOINT"), "should include DOC endpoint");
  assert.ok(PRIORITY_MCP_KEYS.includes("MCP_FLAKE_DB_ENDPOINT"), "should include FLAKE endpoint");
  assert.ok(PRIORITY_MCP_KEYS.includes("MCP_IR_SCHEMA_ENDPOINT"), "should include IR_SCHEMA endpoint");
})();

(function testDefaultInstructionsConstant() {
  // Verify DEFAULT_INSTRUCTIONS is exported correctly
  assert.strictEqual(DEFAULT_INSTRUCTIONS, "copilot-instructions.md", "DEFAULT_INSTRUCTIONS should be copilot-instructions.md");
})();

(function testGeminiInstructionsConstant() {
  // Verify GEMINI_INSTRUCTIONS is exported correctly
  assert.strictEqual(GEMINI_INSTRUCTIONS, "gemini-instructions.md", "GEMINI_INSTRUCTIONS should be gemini-instructions.md");
})();

(function testCoordinationDocConstant() {
  // Verify COORDINATION_DOC is exported correctly
  assert.strictEqual(COORDINATION_DOC, "assistant_coordination.md", "COORDINATION_DOC should be assistant_coordination.md");
})();

console.log("context_pack tests completed successfully.");
