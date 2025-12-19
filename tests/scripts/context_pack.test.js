"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
} = require("../../scripts/context_pack");

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

(function testLoadCopilotInstructions() {
  const testDir = path.join(__dirname, "tmp_test_copilot_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a copilot instructions file
    const instructionsContent = "# Copilot Instructions\n\nTest instructions for Copilot";
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), instructionsContent);
    
    const result = loadCopilotInstructions(testDir);
    
    assert.ok(result.exists, "copilot instructions should exist");
    assert.strictEqual(result.path, DEFAULT_INSTRUCTIONS, "should return correct path");
    assert.ok(result.bytes > 0, "should have content");
    assert.ok(result.excerpt.includes("Copilot Instructions"), "should include correct content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadCopilotInstructionsWithExplicitPath() {
  const testDir = path.join(__dirname, "tmp_test_copilot_explicit");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a custom copilot instructions file
    const customPath = "custom-copilot.md";
    const instructionsContent = "# Custom Copilot\n\nCustom copilot instructions";
    fs.writeFileSync(path.join(testDir, customPath), instructionsContent);
    
    const result = loadCopilotInstructions(testDir, customPath);
    
    assert.ok(result.exists, "custom copilot instructions should exist");
    assert.strictEqual(result.path, customPath, "should return custom path");
    assert.ok(result.excerpt.includes("Custom Copilot"), "should include custom content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testLoadCopilotInstructionsWhenMissing() {
  const testDir = path.join(__dirname, "tmp_test_copilot_missing");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    
    const result = loadCopilotInstructions(testDir);
    
    assert.strictEqual(result.exists, false, "instructions should not exist");
    assert.strictEqual(result.bytes, 0, "should have no content");
    assert.strictEqual(result.excerpt, "", "should have empty excerpt");
    
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
    
    // Create a gemini instructions file
    const instructionsContent = "# Gemini Instructions\n\nTest instructions for Gemini";
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), instructionsContent);
    
    const result = loadGeminiInstructions(testDir);
    
    assert.ok(result.exists, "gemini instructions should exist");
    assert.strictEqual(result.path, GEMINI_INSTRUCTIONS, "should return correct path");
    assert.ok(result.bytes > 0, "should have content");
    assert.ok(result.excerpt.includes("Gemini Instructions"), "should include correct content");
    
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifacts() {
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
    
    // Create instruction files
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), "# Copilot");
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), "# Gemini");
    
    // Clear any MCP endpoints
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    
    const harnessSummary = {
      passed: 10,
      failed: 2,
      total: 12,
      testCases: [],
    };
    
    const runInfo = {
      timestamp: "2024-01-01T00:00:00Z",
      version: "1.0.0",
    };
    
    const result = writeContextArtifacts({
      harnessSummary,
      outDir: artifactsDir,
      runInfo,
    });
    
    // Verify artifacts directory was created
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    
    // Verify files were created
    const harnessResultsFile = path.join(artifactsDir, "harness_results.json");
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const geminiPackFile = path.join(artifactsDir, "context_pack_gemini.json");
    
    assert.ok(fs.existsSync(harnessResultsFile), "harness_results.json should exist");
    assert.ok(fs.existsSync(contextPackFile), "context_pack.json should exist");
    assert.ok(fs.existsSync(geminiPackFile), "context_pack_gemini.json should exist");
    
    // Verify content of harness_results.json
    const harnessResults = JSON.parse(fs.readFileSync(harnessResultsFile, "utf8"));
    assert.strictEqual(harnessResults.passed, 10, "harness results should have passed count");
    assert.strictEqual(harnessResults.failed, 2, "harness results should have failed count");
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, "mcp"), "should have mcp property");
    assert.ok(Object.prototype.hasOwnProperty.call(harnessResults, "instructions"), "should have instructions property");
    
    // Verify content of context_pack.json
    const contextPack = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "generatedAt"), "should have generatedAt");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "run"), "should have run info");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "instructions"), "should have copilot instructions");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "geminiInstructions"), "should have gemini instructions");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "harness"), "should have harness summary");
    assert.strictEqual(contextPack.run.timestamp, "2024-01-01T00:00:00Z", "should include run info");
    
    // Verify content of context_pack_gemini.json
    const geminiPack = JSON.parse(fs.readFileSync(geminiPackFile, "utf8"));
    assert.strictEqual(geminiPack.target, "gemini", "gemini pack should have target");
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, "instructions"), "gemini pack should have instructions");
    assert.ok(Object.prototype.hasOwnProperty.call(geminiPack, "copilotInstructions"), "gemini pack should have copilotInstructions");
    
    // Verify that gemini pack has gemini instructions as primary
    assert.ok(geminiPack.instructions.excerpt.includes("Gemini"), "gemini pack instructions should be gemini instructions");
    assert.ok(geminiPack.copilotInstructions.excerpt.includes("Copilot"), "gemini pack should preserve copilot instructions");
    
    // Verify return value
    assert.ok(Object.prototype.hasOwnProperty.call(result, "payload"), "should return payload");
    assert.ok(Object.prototype.hasOwnProperty.call(result, "contextPack"), "should return contextPack");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsWithMcpEndpoints() {
  const testDir = path.join(__dirname, "tmp_test_write_with_mcp");
  const artifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Create instruction files
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), "# Copilot");
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), "# Gemini");
    
    // Set MCP endpoints
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:8080/doc";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:8081/flake";
    
    const harnessSummary = { passed: 5, failed: 0, total: 5 };
    
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const contextPack = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    // Verify MCP endpoints were included
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack, "mcp"), "should have mcp property");
    assert.ok(Object.prototype.hasOwnProperty.call(contextPack.mcp, "endpoints"), "mcp should have endpoints");
    assert.strictEqual(contextPack.mcp.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc", "should include doc endpoint");
    assert.strictEqual(contextPack.mcp.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:8081/flake", "should include flake endpoint");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsDefaultOutDir() {
  const testDir = path.join(__dirname, "tmp_test_default_outdir");
  const defaultArtifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Create instruction files
    fs.writeFileSync(path.join(testDir, DEFAULT_INSTRUCTIONS), "# Copilot");
    fs.writeFileSync(path.join(testDir, GEMINI_INSTRUCTIONS), "# Gemini");
    
    // Clear MCP endpoints
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    
    const harnessSummary = { passed: 1, failed: 0, total: 1 };
    
    // Call without specifying outDir
    writeContextArtifacts({ harnessSummary });
    
    // Should use default artifacts directory in cwd
    assert.ok(fs.existsSync(defaultArtifactsDir), "should create default artifacts directory");
    assert.ok(fs.existsSync(path.join(defaultArtifactsDir, "harness_results.json")), "should create files in default location");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

console.log("context_pack tests completed successfully.");
