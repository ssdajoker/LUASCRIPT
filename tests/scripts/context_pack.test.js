"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
  collectMcpEndpoints,
  loadInstructions,
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
} = require("../../scripts/context_pack");

// Test collectMcpEndpoints - filters and orders MCP environment variables
(function testCollectMcpEndpointsFiltersAndOrders() {
  const originalEnv = { ...process.env };

  // Set up test environment variables
  process.env.MCP_DOC_INDEX_ENDPOINT = "http://doc.example.com";
  process.env.MCP_FLAKE_DB_ENDPOINT = "http://flake.example.com";
  process.env.MCP_IR_SCHEMA_ENDPOINT = "http://ir.example.com";
  process.env.MCP_CUSTOM_ENDPOINT = "http://custom.example.com";
  process.env.NOT_MCP_ENDPOINT = "http://other.example.com";
  process.env.MCP_PARTIAL = "http://no-endpoint-suffix.example.com";

  try {
    const result = collectMcpEndpoints();

    // Verify keys array contains expected priority keys first
    assert.ok(result.keys.length >= 4, "Should have at least 4 MCP keys");
    assert.strictEqual(result.keys[0], "MCP_DOC_INDEX_ENDPOINT", "First priority key should be MCP_DOC_INDEX_ENDPOINT");
    assert.strictEqual(result.keys[1], "MCP_FLAKE_DB_ENDPOINT", "Second priority key should be MCP_FLAKE_DB_ENDPOINT");
    assert.strictEqual(result.keys[2], "MCP_IR_SCHEMA_ENDPOINT", "Third priority key should be MCP_IR_SCHEMA_ENDPOINT");

    // Verify endpoints object only contains valid endpoints
    assert.strictEqual(result.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://doc.example.com");
    assert.strictEqual(result.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://flake.example.com");
    assert.strictEqual(result.endpoints.MCP_IR_SCHEMA_ENDPOINT, "http://ir.example.com");
    assert.strictEqual(result.endpoints.MCP_CUSTOM_ENDPOINT, "http://custom.example.com");

    // Verify non-MCP variables are not included
    assert.strictEqual(result.endpoints.NOT_MCP_ENDPOINT, undefined);
    assert.strictEqual(result.endpoints.MCP_PARTIAL, undefined);

    // Verify envString is valid JSON
    const parsed = JSON.parse(result.envString);
    assert.strictEqual(parsed.MCP_DOC_INDEX_ENDPOINT, "http://doc.example.com");

    // Verify entries array structure
    assert.ok(Array.isArray(result.entries), "entries should be an array");
    const customEntry = result.entries.find((e) => e.key === "MCP_CUSTOM_ENDPOINT");
    assert.ok(customEntry, "Should find MCP_CUSTOM_ENDPOINT in entries");
    assert.strictEqual(customEntry.url, "http://custom.example.com");
  } finally {
    // Restore original environment
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("MCP_") && !originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  }
})();

// Test loadInstructions with existing file (using fallback)
(function testLoadInstructionsWithExistingFile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const testFile = path.join(tmpDir, "test-instructions.md");
  const testContent = "# Test Instructions\n\nThis is a test file with some content.";

  try {
    fs.writeFileSync(testFile, testContent, "utf8");

    const result = loadInstructions(tmpDir, null, "test-instructions.md");

    assert.strictEqual(result.exists, true, "File should exist");
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, "utf8"), "Byte count should match");
    assert.ok(result.excerpt.includes("Test Instructions"), "Excerpt should contain content");
    assert.strictEqual(result.path, "test-instructions.md", "Path should be relative");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test loadInstructions with non-existing file
(function testLoadInstructionsWithNonExistingFile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));

  try {
    const result = loadInstructions(tmpDir, null, "missing.md");

    assert.strictEqual(result.exists, false, "File should not exist");
    assert.strictEqual(result.bytes, 0, "Byte count should be 0");
    assert.strictEqual(result.excerpt, "", "Excerpt should be empty");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test loadInstructions with explicit absolute path
(function testLoadInstructionsWithExplicitAbsolutePath() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const testFile = path.join(tmpDir, "absolute-test.md");
  const testContent = "Absolute path test";

  try {
    fs.writeFileSync(testFile, testContent, "utf8");

    // Pass the absolute path as explicitPath parameter
    const result = loadInstructions(tmpDir, testFile, "fallback.md");

    assert.strictEqual(result.exists, true, "File should exist");
    assert.strictEqual(result.bytes, Buffer.byteLength(testContent, "utf8"), "Byte count should match");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test loadInstructions excerpt truncation for large files
(function testLoadInstructionsExcerptTruncation() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const testFile = path.join(tmpDir, "large-file.md");
  const testContent = "x".repeat(3000); // Create content larger than 2000 bytes

  try {
    fs.writeFileSync(testFile, testContent, "utf8");

    const result = loadInstructions(tmpDir, testFile, "fallback.md");

    assert.strictEqual(result.exists, true, "File should exist");
    assert.strictEqual(result.bytes, 3000, "Byte count should be 3000");
    assert.strictEqual(result.excerpt.length, 2000, "Excerpt should be truncated to 2000 characters");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test loadCopilotInstructions wrapper
(function testLoadCopilotInstructions() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const testFile = path.join(tmpDir, DEFAULT_INSTRUCTIONS);
  const testContent = "# Copilot Instructions";

  try {
    fs.writeFileSync(testFile, testContent, "utf8");

    const result = loadCopilotInstructions(tmpDir);

    assert.strictEqual(result.exists, true, "Default copilot instructions should be found");
    assert.ok(result.excerpt.includes("Copilot Instructions"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test loadGeminiInstructions wrapper
(function testLoadGeminiInstructions() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const testFile = path.join(tmpDir, GEMINI_INSTRUCTIONS);
  const testContent = "# Gemini Instructions";

  try {
    fs.writeFileSync(testFile, testContent, "utf8");

    const result = loadGeminiInstructions(tmpDir);

    assert.strictEqual(result.exists, true, "Default gemini instructions should be found");
    assert.ok(result.excerpt.includes("Gemini Instructions"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// Test writeContextArtifacts
(function testWriteContextArtifacts() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const artifactsDir = path.join(tmpDir, "artifacts");
  const originalEnv = { ...process.env };

  // Set up test MCP endpoints
  process.env.MCP_TEST_ENDPOINT = "http://test.example.com";

  try {
    const harnessSummary = {
      totalTests: 10,
      passed: 8,
      failed: 2,
      coverage: "80%",
    };

    const runInfo = {
      runId: "test-run-123",
      timestamp: "2024-01-01T00:00:00Z",
    };

    const result = writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
      runInfo,
    });

    // Verify directory was created
    assert.ok(fs.existsSync(artifactsDir), "Artifacts directory should be created");

    // Verify harness_results.json was created
    const harnessResultsPath = path.join(artifactsDir, "harness_results.json");
    assert.ok(fs.existsSync(harnessResultsPath), "harness_results.json should be created");
    const harnessResults = JSON.parse(fs.readFileSync(harnessResultsPath, "utf8"));
    assert.strictEqual(harnessResults.totalTests, 10);
    assert.strictEqual(harnessResults.passed, 8);
    assert.ok(harnessResults.mcp, "Should include MCP endpoints");

    // Verify context_pack.json was created
    const contextPackPath = path.join(artifactsDir, "context_pack.json");
    assert.ok(fs.existsSync(contextPackPath), "context_pack.json should be created");
    const contextPack = JSON.parse(fs.readFileSync(contextPackPath, "utf8"));
    assert.ok(contextPack.generatedAt, "Should have generatedAt timestamp");
    assert.deepStrictEqual(contextPack.run, runInfo);
    assert.ok(contextPack.harness, "Should include harness data");
    assert.ok(contextPack.mcp, "Should include MCP data");
    assert.ok(contextPack.instructions, "Should include instructions data");

    // Verify context_pack_gemini.json was created
    const geminiPackPath = path.join(artifactsDir, "context_pack_gemini.json");
    assert.ok(fs.existsSync(geminiPackPath), "context_pack_gemini.json should be created");
    const geminiPack = JSON.parse(fs.readFileSync(geminiPackPath, "utf8"));
    assert.strictEqual(geminiPack.target, "gemini", "Gemini pack should have target=gemini");
    assert.ok(geminiPack.copilotInstructions, "Should include copilot instructions");

    // Verify return value
    assert.ok(result.payload, "Should return payload");
    assert.ok(result.contextPack, "Should return contextPack");
    assert.strictEqual(result.payload.totalTests, 10);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Restore original environment
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("MCP_") && !originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  }
})();

// Test writeContextArtifacts with custom instruction paths
(function testWriteContextArtifactsWithCustomPaths() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-pack-test-"));
  const artifactsDir = path.join(tmpDir, "artifacts");
  const instructionsFile = path.join(tmpDir, "custom-instructions.md");
  const originalEnv = { ...process.env };

  try {
    fs.writeFileSync(instructionsFile, "# Custom Instructions", "utf8");
    process.env.COPILOT_INSTRUCTIONS_PATH = instructionsFile;

    const harnessSummary = { totalTests: 5 };

    writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
    });

    const contextPackPath = path.join(artifactsDir, "context_pack.json");
    const contextPack = JSON.parse(fs.readFileSync(contextPackPath, "utf8"));

    assert.strictEqual(contextPack.instructions.exists, true, "Custom instructions should be loaded");
    assert.ok(contextPack.instructions.excerpt.includes("Custom Instructions"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.COPILOT_INSTRUCTIONS_PATH;
    Object.assign(process.env, originalEnv);
  }
})();

console.log("context_pack.js tests completed successfully.");
