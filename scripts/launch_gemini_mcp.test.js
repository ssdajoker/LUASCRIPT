"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { main } = require("./launch_gemini_mcp");
const { PRIORITY_MCP_KEYS } = require("./context_pack");

// Test setup and teardown
const testDir = path.join(__dirname, `../tmp_test_launch_gemini_mcp_${process.pid}`);
const artifactsDir = path.join(testDir, "artifacts");

function setupTestEnv() {
  // Create test directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Save original process.cwd and environment variables we might modify
  const originalCwd = process.cwd();
  const originalEnvVars = {};
  
  // Save all MCP endpoint variables and specific instruction path variables
  const envKeysToSave = Object.keys(process.env).filter(
    key => key.startsWith("MCP_") || key === "GEMINI_INSTRUCTIONS_PATH" || key === "COPILOT_INSTRUCTIONS_PATH"
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
  // First, delete any that weren't in the original environment
  const envKeysToCheck = Object.keys(process.env).filter(
    key => key.startsWith("MCP_") || key === "GEMINI_INSTRUCTIONS_PATH" || key === "COPILOT_INSTRUCTIONS_PATH"
  );
  
  envKeysToCheck.forEach(key => {
    if (!(key in original.originalEnvVars)) {
      delete process.env[key];
    }
  });
  
  // Then restore original values (or delete if originally undefined)
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

function captureConsoleOutput(fn) {
  const logs = [];
  const warnings = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  
  console.log = (...args) => logs.push(args.join(" "));
  console.warn = (...args) => warnings.push(args.join(" "));
  
  try {
    fn();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
  
  return { logs, warnings };
}

(function testMainWithNoMcpEndpoints() {
  const original = setupTestEnv();
  
  try {
    // Clear MCP environment variables
    Object.keys(process.env)
      .filter(key => key.startsWith("MCP_") && key.endsWith("_ENDPOINT"))
      .forEach(key => delete process.env[key]);
    
    const output = captureConsoleOutput(() => main());
    
    // Verify artifacts directory was created
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    
    // Verify JSON file was written
    const endpointsPath = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    assert.ok(fs.existsSync(endpointsPath), "gemini_mcp_endpoints.json should be created");
    
    // Verify JSON content
    const content = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    assert.ok(content.keys, "JSON should contain keys array");
    assert.ok(content.entries, "JSON should contain entries array");
    assert.ok(content.endpoints, "JSON should contain endpoints object");
    
    // Verify console output
    assert.ok(output.logs.some(log => log.includes("MCP endpoints captured for Gemini")), "should log MCP endpoints message");
    assert.ok(output.warnings.some(warn => warn.includes("No gemini-instructions.md found")), "should warn about missing instructions");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testMainWithMcpEndpoints() {
  const original = setupTestEnv();
  
  try {
    // Set up MCP environment variables
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:3000/docs";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:3001/flakes";
    process.env.MCP_IR_SCHEMA_ENDPOINT = "http://localhost:3002/schema";
    
    const output = captureConsoleOutput(() => main());
    
    // Verify JSON content includes endpoints
    const endpointsPath = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    const content = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    
    assert.strictEqual(content.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:3000/docs", "should include DOC_INDEX endpoint");
    assert.strictEqual(content.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:3001/flakes", "should include FLAKE_DB endpoint");
    assert.strictEqual(content.endpoints.MCP_IR_SCHEMA_ENDPOINT, "http://localhost:3002/schema", "should include IR_SCHEMA endpoint");
    
    // Verify console output includes endpoint URLs
    assert.ok(output.logs.some(log => log.includes("MCP_DOC_INDEX_ENDPOINT")), "should log DOC_INDEX endpoint");
    assert.ok(output.logs.some(log => log.includes("http://localhost:3000/docs")), "should log DOC_INDEX URL");
    
    // Verify suggested env export
    assert.ok(output.logs.some(log => log.includes("GEMINI_MCP_ENDPOINTS=")), "should log suggested env export");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testMainWithGeminiInstructions() {
  const original = setupTestEnv();
  
  try {
    // Create gemini-instructions.md file
    const instructionsContent = "# Gemini Instructions\n\nTest instructions content.";
    fs.writeFileSync(path.join(testDir, "gemini-instructions.md"), instructionsContent, "utf8");
    
    const output = captureConsoleOutput(() => main());
    
    // Verify no warning about missing instructions
    assert.ok(!output.warnings.some(warn => warn.includes("No gemini-instructions.md found")), "should not warn when instructions exist");
    
    // Verify instructions path is logged
    assert.ok(output.logs.some(log => log.includes("Gemini instructions path")), "should log instructions path");
    assert.ok(output.logs.some(log => log.includes("gemini-instructions.md")), "should log instructions filename");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testMainWithCustomInstructionsPath() {
  const original = setupTestEnv();
  
  try {
    // Create custom instructions file
    const customDir = path.join(testDir, "custom");
    fs.mkdirSync(customDir, { recursive: true });
    const instructionsContent = "# Custom Gemini Instructions\n\nCustom content.";
    const customPath = path.join(customDir, "custom-instructions.md");
    fs.writeFileSync(customPath, instructionsContent, "utf8");
    
    // Set environment variable for custom path
    process.env.GEMINI_INSTRUCTIONS_PATH = customPath;
    
    const output = captureConsoleOutput(() => main());
    
    // Verify custom instructions are used
    assert.ok(output.logs.some(log => log.includes("custom-instructions.md")), "should log custom instructions filename");
  } finally {
    teardownTestEnv(original);
  }
})();

(function testMainJsonStructure() {
  const original = setupTestEnv();
  
  try {
    // Set up some endpoints
    process.env.MCP_TEST_ENDPOINT = "http://localhost:4000/test";
    
    main();
    
    // Verify JSON structure
    const endpointsPath = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    const content = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    
    // Verify required fields
    assert.ok(Array.isArray(content.keys), "keys should be an array");
    assert.ok(Array.isArray(content.entries), "entries should be an array");
    assert.strictEqual(typeof content.endpoints, "object", "endpoints should be an object");
    assert.strictEqual(typeof content.envString, "string", "envString should be a string");
    
    // Verify entries structure
    content.entries.forEach(entry => {
      assert.ok(entry.key, "each entry should have a key");
      assert.ok(typeof entry.url === "string", "each entry should have a url string");
    });
    
    // Verify priority keys come before non-priority keys in the keys array
    const presentPriorityKeys = PRIORITY_MCP_KEYS.filter(key => content.keys.includes(key));
    const firstNonPriorityIndex = content.keys.findIndex(key => !PRIORITY_MCP_KEYS.includes(key));
    
    if (presentPriorityKeys.length > 0 && firstNonPriorityIndex !== -1) {
      // All priority keys should appear before the first non-priority key
      presentPriorityKeys.forEach(key => {
        const keyIndex = content.keys.indexOf(key);
        assert.ok(keyIndex < firstNonPriorityIndex, `Priority key ${key} should appear before non-priority keys`);
      });
    }
  } finally {
    teardownTestEnv(original);
  }
})();

(function testMainArtifactsRelativePath() {
  const original = setupTestEnv();
  
  try {
    const output = captureConsoleOutput(() => main());
    
    // Verify relative path in output
    assert.ok(output.logs.some(log => log.includes("artifacts/gemini_mcp_endpoints.json")), "should use relative path in output");
  } finally {
    teardownTestEnv(original);
  }
})();

console.log("launch_gemini_mcp tests completed successfully.");
