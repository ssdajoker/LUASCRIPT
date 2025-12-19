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
} = require("./context_pack");

// Test setup and teardown
const testDir = path.join(__dirname, `../tmp_test_context_pack_${process.pid}`);

function setupTestEnv() {
  // Create test directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Save original process.cwd and environment variables we might modify
  const originalCwd = process.cwd();
  const originalEnvVars = {};
  
  // Save all MCP endpoint variables and instruction path variables
  const envKeysToSave = Object.keys(process.env).filter(
    key => key.startsWith("MCP_") || 
           key === "GEMINI_INSTRUCTIONS_PATH" || 
           key === "COPILOT_INSTRUCTIONS_PATH" ||
           key === "ASSISTANT_COORD_PATH"
  );
  
  envKeysToSave.forEach(key => {
    originalEnvVars[key] = process.env[key];
  });
  
  // Change to test directory
  process.chdir(testDir);
  
  return { originalCwd, originalEnvVars };
}

function teardownTestEnv(original) {
  // Restore original working directory
  process.chdir(original.originalCwd);
  
  // Restore environment variables
  const envKeysToCheck = Object.keys(process.env).filter(
    key => key.startsWith("MCP_") || 
           key === "GEMINI_INSTRUCTIONS_PATH" || 
           key === "COPILOT_INSTRUCTIONS_PATH" ||
           key === "ASSISTANT_COORD_PATH"
  );
  
  envKeysToCheck.forEach(key => {
    if (!(key in original.originalEnvVars)) {
      delete process.env[key];
    }
  });
  
  // Restore original values
  Object.keys(original.originalEnvVars).forEach(key => {
    const originalValue = original.originalEnvVars[key];
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  });
  
  // Clean up test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// Tests for collectMcpEndpoints
(function testCollectMcpEndpointsEmpty() {
  const original = setupTestEnv();
  
  try {
    // Clear all MCP environment variables
    Object.keys(process.env)
      .filter(key => key.startsWith("MCP_") && key.endsWith("_ENDPOINT"))
      .forEach(key => delete process.env[key]);
    
    const result = collectMcpEndpoints();
    
    assert.ok(Array.isArray(result.keys), "keys should be an array");
    assert.ok(Array.isArray(result.entries), "entries should be an array");
    assert.strictEqual(typeof result.endpoints, "object", "endpoints should be an object");
    assert.strictEqual(typeof result.envString, "string", "envString should be a string");
    assert.strictEqual(Object.keys(result.endpoints).length, 0, "endpoints should be empty when no env vars set");
    assert.strictEqual(result.envString, "{}", "envString should be empty object when no endpoints");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testCollectMcpEndpointsWithValues() {
  const original = setupTestEnv();
  
  try {
    // Set up MCP environment variables
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:3000/docs";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:3001/flakes";
    process.env.MCP_IR_SCHEMA_ENDPOINT = "http://localhost:3002/schema";
    
    const result = collectMcpEndpoints();
    
    assert.strictEqual(result.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:3000/docs", "should include DOC_INDEX endpoint");
    assert.strictEqual(result.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:3001/flakes", "should include FLAKE_DB endpoint");
    assert.strictEqual(result.endpoints.MCP_IR_SCHEMA_ENDPOINT, "http://localhost:3002/schema", "should include IR_SCHEMA endpoint");
    assert.strictEqual(Object.keys(result.endpoints).length, 3, "should have exactly 3 endpoints");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testCollectMcpEndpointsFiltersEmptyValues() {
  const original = setupTestEnv();
  
  try {
    // Set up some endpoints with empty values
    process.env.MCP_VALID_ENDPOINT = "http://localhost:4000/valid";
    process.env.MCP_EMPTY_ENDPOINT = "";
    process.env.MCP_WHITESPACE_ENDPOINT = "   ";
    
    const result = collectMcpEndpoints();
    
    assert.strictEqual(result.endpoints.MCP_VALID_ENDPOINT, "http://localhost:4000/valid", "should include valid endpoint");
    assert.ok(!result.endpoints.MCP_EMPTY_ENDPOINT, "should not include empty endpoint");
    assert.ok(!result.endpoints.MCP_WHITESPACE_ENDPOINT, "should not include whitespace-only endpoint");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testCollectMcpEndpointsPriorityOrdering() {
  const original = setupTestEnv();
  
  try {
    // Set up priority and non-priority endpoints
    process.env.MCP_ZEBRA_ENDPOINT = "http://localhost:5000/zebra";
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:3000/docs";
    process.env.MCP_ALPHA_ENDPOINT = "http://localhost:6000/alpha";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:3001/flakes";
    
    const result = collectMcpEndpoints();
    
    // Priority keys should come first
    const firstPriorityIndex = result.keys.indexOf("MCP_DOC_INDEX_ENDPOINT");
    const secondPriorityIndex = result.keys.indexOf("MCP_FLAKE_DB_ENDPOINT");
    const firstNonPriorityIndex = result.keys.indexOf("MCP_ALPHA_ENDPOINT");
    
    assert.ok(firstPriorityIndex < firstNonPriorityIndex, "priority keys should come before non-priority keys");
    assert.ok(secondPriorityIndex < firstNonPriorityIndex, "all priority keys should come before non-priority keys");
  } finally {
    teardownTestEnv(original);
  }
})();

// Tests for loadInstructions
(function testLoadInstructionsNonExistentFile() {
  const original = setupTestEnv();
  
  try {
    const result = loadInstructions(testDir, null, "nonexistent.md");
    
    assert.strictEqual(result.exists, false, "should indicate file does not exist");
    assert.strictEqual(result.content, undefined, "content should be undefined for non-existent file");
    assert.strictEqual(result.bytes, 0, "bytes should be 0 for non-existent file");
    assert.strictEqual(result.excerpt, "", "excerpt should be empty for non-existent file");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadInstructionsExistingFile() {
  const original = setupTestEnv();
  
  try {
    const content = "# Test Instructions\n\nThis is a test file with some content.";
    const filename = "test-instructions.md";
    fs.writeFileSync(path.join(testDir, filename), content, "utf8");
    
    const result = loadInstructions(testDir, null, filename);
    
    assert.strictEqual(result.exists, true, "should indicate file exists");
    assert.strictEqual(result.path, filename, "should return correct relative path");
    assert.strictEqual(result.bytes, Buffer.byteLength(content, "utf8"), "should return correct byte length");
    assert.strictEqual(result.excerpt, content, "excerpt should match content for small files");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadInstructionsLargeFile() {
  const original = setupTestEnv();
  
  try {
    // Create a file larger than 2000 bytes
    const largeContent = "x".repeat(3000);
    const filename = "large-instructions.md";
    fs.writeFileSync(path.join(testDir, filename), largeContent, "utf8");
    
    const result = loadInstructions(testDir, null, filename);
    
    assert.strictEqual(result.exists, true, "should indicate file exists");
    assert.strictEqual(result.bytes, 3000, "should return correct byte length");
    assert.strictEqual(result.excerpt.length, 2000, "excerpt should be limited to 2000 characters");
    assert.strictEqual(result.excerpt, largeContent.slice(0, 2000), "excerpt should match first 2000 chars");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadInstructionsAbsolutePath() {
  const original = setupTestEnv();
  
  try {
    const content = "# Absolute Path Test";
    const filename = "absolute-test.md";
    const absolutePath = path.join(testDir, filename);
    fs.writeFileSync(absolutePath, content, "utf8");
    
    const result = loadInstructions(testDir, absolutePath, null);
    
    assert.strictEqual(result.exists, true, "should handle absolute paths");
    assert.strictEqual(result.path, filename, "should return relative path even when given absolute");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadInstructionsRelativePath() {
  const original = setupTestEnv();
  
  try {
    const content = "# Relative Path Test";
    const subdir = "subdir";
    const filename = "relative-test.md";
    fs.mkdirSync(path.join(testDir, subdir), { recursive: true });
    fs.writeFileSync(path.join(testDir, subdir, filename), content, "utf8");
    
    const result = loadInstructions(testDir, null, path.join(subdir, filename));
    
    assert.strictEqual(result.exists, true, "should handle relative paths with subdirectories");
    assert.strictEqual(result.path, path.join(subdir, filename), "should return correct relative path");
  } finally {
    teardownTestEnv(original);
  }
})();

// Tests for loadCopilotInstructions
(function testLoadCopilotInstructionsDefault() {
  const original = setupTestEnv();
  
  try {
    const content = "# Copilot Instructions\n\nDefault copilot instructions.";
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), content, "utf8");
    
    const result = loadCopilotInstructions(testDir, null);
    
    assert.strictEqual(result.exists, true, "should load default copilot instructions");
    assert.strictEqual(result.path, DEFAULT_INSTRUCTIONS, "should use default instructions file");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadCopilotInstructionsCustomPath() {
  const original = setupTestEnv();
  
  try {
    const content = "# Custom Copilot Instructions";
    const customPath = "custom-copilot.md";
    fs.writeFileSync(path.join(testDir, customPath), content, "utf8");
    
    const result = loadCopilotInstructions(testDir, customPath);
    
    assert.strictEqual(result.exists, true, "should load custom copilot instructions");
    assert.strictEqual(result.path, customPath, "should use custom path");
  } finally {
    teardownTestEnv(original);
  }
})();

// Tests for loadGeminiInstructions
(function testLoadGeminiInstructionsDefault() {
  const original = setupTestEnv();
  
  try {
    const content = "# Gemini Instructions\n\nDefault gemini instructions.";
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), content, "utf8");
    
    const result = loadGeminiInstructions(testDir, null);
    
    assert.strictEqual(result.exists, true, "should load default gemini instructions");
    assert.strictEqual(result.path, GEMINI_INSTRUCTIONS, "should use default gemini instructions file");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testLoadGeminiInstructionsCustomPath() {
  const original = setupTestEnv();
  
  try {
    const content = "# Custom Gemini Instructions";
    const customPath = "custom-gemini.md";
    fs.writeFileSync(path.join(testDir, customPath), content, "utf8");
    
    const result = loadGeminiInstructions(testDir, customPath);
    
    assert.strictEqual(result.exists, true, "should load custom gemini instructions");
    assert.strictEqual(result.path, customPath, "should use custom path");
  } finally {
    teardownTestEnv(original);
  }
})();

// Tests for writeContextArtifacts
(function testWriteContextArtifactsBasic() {
  const original = setupTestEnv();
  
  try {
    const harnessSummary = {
      totalTests: 10,
      passedTests: 8,
      failedTests: 2,
    };
    
    const artifactsDir = path.join(testDir, "artifacts");
    const result = writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Verify artifacts directory was created
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    
    // Verify all expected files were created
    assert.ok(fs.existsSync(path.join(artifactsDir, "harness_results.json")), "harness_results.json should be created");
    assert.ok(fs.existsSync(path.join(artifactsDir, "context_pack.json")), "context_pack.json should be created");
    assert.ok(fs.existsSync(path.join(artifactsDir, "context_pack_gemini.json")), "context_pack_gemini.json should be created");
    
    // Verify result structure
    assert.ok(result.payload, "should return payload");
    assert.ok(result.contextPack, "should return contextPack");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testWriteContextArtifactsJsonStructure() {
  const original = setupTestEnv();
  
  try {
    const harnessSummary = {
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
    };
    
    const runInfo = {
      timestamp: "2024-01-01T00:00:00Z",
      runner: "test-runner",
    };
    
    const artifactsDir = path.join(testDir, "artifacts");
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
      runInfo,
    });
    
    // Read and verify harness_results.json
    const harnessResults = JSON.parse(fs.readFileSync(path.join(artifactsDir, "harness_results.json"), "utf8"));
    assert.strictEqual(harnessResults.totalTests, 5, "harness results should include summary data");
    assert.ok(harnessResults.mcp, "harness results should include mcp data");
    assert.ok(harnessResults.instructions, "harness results should include instructions data");
    
    // Read and verify context_pack.json
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.ok(contextPack.generatedAt, "context pack should have generatedAt timestamp");
    assert.ok(contextPack.run, "context pack should have run info");
    assert.strictEqual(contextPack.run.timestamp, runInfo.timestamp, "context pack should include provided run info");
    assert.ok(contextPack.instructions, "context pack should have instructions");
    assert.ok(contextPack.geminiInstructions, "context pack should have geminiInstructions");
    assert.ok(contextPack.coordination, "context pack should have coordination");
    assert.ok(contextPack.mcp, "context pack should have mcp");
    assert.ok(contextPack.harness, "context pack should have harness");
    
    // Read and verify context_pack_gemini.json
    const geminiPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack_gemini.json"), "utf8"));
    assert.strictEqual(geminiPack.target, "gemini", "gemini pack should have target set to 'gemini'");
    assert.ok(geminiPack.instructions, "gemini pack should have instructions (gemini-oriented)");
    assert.ok(geminiPack.copilotInstructions, "gemini pack should have copilotInstructions");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testWriteContextArtifactsWithInstructions() {
  const original = setupTestEnv();
  
  try {
    // Create instruction files
    const copilotContent = "# Copilot Instructions\n\nTest copilot content.";
    const geminiContent = "# Gemini Instructions\n\nTest gemini content.";
    const coordContent = "# Coordination Doc\n\nTest coordination content.";
    
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), copilotContent, "utf8");
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), geminiContent, "utf8");
    fs.writeFileSync(path.join(testDir, COORDINATION_DOC), coordContent, "utf8");
    
    const harnessSummary = { totalTests: 1 };
    const artifactsDir = path.join(testDir, "artifacts");
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Verify instructions were loaded
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.strictEqual(contextPack.instructions.exists, true, "copilot instructions should exist");
    assert.strictEqual(contextPack.geminiInstructions.exists, true, "gemini instructions should exist");
    assert.strictEqual(contextPack.coordination.exists, true, "coordination doc should exist");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testWriteContextArtifactsWithEnvPaths() {
  const original = setupTestEnv();
  
  try {
    // Create custom instruction files
    const customCopilotPath = "my-copilot.md";
    const customGeminiPath = "my-gemini.md";
    const customCoordPath = "my-coord.md";
    
    fs.writeFileSync(path.join(testDir, customCopilotPath), "Custom copilot", "utf8");
    fs.writeFileSync(path.join(testDir, customGeminiPath), "Custom gemini", "utf8");
    fs.writeFileSync(path.join(testDir, customCoordPath), "Custom coord", "utf8");
    
    // Set environment variables
    process.env.COPILOT_INSTRUCTIONS_PATH = customCopilotPath;
    process.env.GEMINI_INSTRUCTIONS_PATH = customGeminiPath;
    process.env.ASSISTANT_COORD_PATH = customCoordPath;
    
    const harnessSummary = { totalTests: 1 };
    const artifactsDir = path.join(testDir, "artifacts");
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Verify custom paths were used
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.strictEqual(contextPack.instructions.path, customCopilotPath, "should use custom copilot path");
    assert.strictEqual(contextPack.geminiInstructions.path, customGeminiPath, "should use custom gemini path");
    assert.strictEqual(contextPack.coordination.path, customCoordPath, "should use custom coordination path");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testWriteContextArtifactsWithMcpEndpoints() {
  const original = setupTestEnv();
  
  try {
    // Set up MCP endpoints
    process.env.MCP_TEST_ENDPOINT = "http://localhost:7000/test";
    process.env.MCP_ANOTHER_ENDPOINT = "http://localhost:8000/another";
    
    const harnessSummary = { totalTests: 1 };
    const artifactsDir = path.join(testDir, "artifacts");
    
    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });
    
    // Verify MCP endpoints were collected
    const contextPack = JSON.parse(fs.readFileSync(path.join(artifactsDir, "context_pack.json"), "utf8"));
    assert.ok(contextPack.mcp.endpoints.MCP_TEST_ENDPOINT, "should include MCP_TEST_ENDPOINT");
    assert.ok(contextPack.mcp.endpoints.MCP_ANOTHER_ENDPOINT, "should include MCP_ANOTHER_ENDPOINT");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testWriteContextArtifactsDefaultOutDir() {
  const original = setupTestEnv();
  
  try {
    const harnessSummary = { totalTests: 1 };
    
    // Call without specifying outDir
    writeContextArtifacts({ harnessSummary });
    
    // Verify artifacts were created in default location
    const defaultArtifactsDir = path.join(testDir, "artifacts");
    assert.ok(fs.existsSync(defaultArtifactsDir), "should create default artifacts directory");
    assert.ok(fs.existsSync(path.join(defaultArtifactsDir, "harness_results.json")), "should create files in default directory");
  } finally {
    teardownTestEnv(original);
  }
})();

console.log("context_pack tests completed successfully.");
