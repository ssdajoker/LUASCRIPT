"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { main } = require("../../scripts/launch_gemini_mcp");

(function testMainCreatesArtifactsDirectory() {
  const testDir = path.join(__dirname, "tmp_test_gemini_mcp");
  const artifactsDir = path.join(testDir, "artifacts");
  
  // Clean up any previous test artifacts
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Clear any MCP environment variables for clean test
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    
    // Mock console to avoid cluttering test output
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
    
    main();
    
    // Restore console
    console.log = originalLog;
    console.warn = originalWarn;
    
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    
    const endpointsFile = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    assert.ok(fs.existsSync(endpointsFile), "gemini_mcp_endpoints.json should be created");
    
    const content = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));
    assert.ok(content.hasOwnProperty("keys"), "endpoints file should have keys property");
    assert.ok(content.hasOwnProperty("entries"), "endpoints file should have entries property");
    assert.ok(content.hasOwnProperty("endpoints"), "endpoints file should have endpoints property");
    assert.ok(Array.isArray(content.keys), "keys should be an array");
    assert.ok(Array.isArray(content.entries), "entries should be an array");
    
    // Verify console output
    const outputStr = logs.join('\n');
    assert.ok(outputStr.includes("MCP endpoints captured for Gemini"), "should log MCP endpoints message");
    assert.ok(outputStr.includes("Suggested env export for Gemini"), "should log env export suggestion");
    assert.ok(outputStr.includes("Config written"), "should log config written message");
    
  } finally {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testMainHandlesMcpEndpoints() {
  const testDir = path.join(__dirname, "tmp_test_gemini_mcp_env");
  const artifactsDir = path.join(testDir, "artifacts");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Set test MCP endpoints
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:8080/doc";
    process.env.MCP_FLAKE_DB_ENDPOINT = "http://localhost:8081/flake";
    process.env.MCP_TEST_ENDPOINT = "http://localhost:8082/test";
    
    // Mock console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
    
    main();
    
    console.log = originalLog;
    console.warn = originalWarn;
    
    const endpointsFile = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    const content = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));
    
    // Should contain our test endpoints
    assert.ok(content.keys.includes("MCP_DOC_INDEX_ENDPOINT"), "should include DOC endpoint key");
    assert.ok(content.keys.includes("MCP_FLAKE_DB_ENDPOINT"), "should include FLAKE endpoint key");
    assert.ok(content.keys.includes("MCP_TEST_ENDPOINT"), "should include TEST endpoint key");
    
    // Check endpoints object has values
    assert.strictEqual(content.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    assert.strictEqual(content.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:8081/flake");
    assert.strictEqual(content.endpoints.MCP_TEST_ENDPOINT, "http://localhost:8082/test");
    
    // Verify console logged the endpoints
    const outputStr = logs.join('\n');
    assert.ok(outputStr.includes("MCP_DOC_INDEX_ENDPOINT: http://localhost:8080/doc"), "should log DOC endpoint");
    assert.ok(outputStr.includes("MCP_FLAKE_DB_ENDPOINT: http://localhost:8081/flake"), "should log FLAKE endpoint");
    
  } finally {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testMainHandlesGeminiInstructions() {
  const testDir = path.join(__dirname, "tmp_test_gemini_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Create a gemini-instructions.md file
    const instructionsContent = "# Gemini Instructions\n\nTest instructions for Gemini AI";
    fs.writeFileSync(path.join(testDir, "gemini-instructions.md"), instructionsContent);
    
    // Clear MCP env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    
    // Mock console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
    
    main();
    
    console.log = originalLog;
    console.warn = originalWarn;
    
    const outputStr = logs.join('\n');
    assert.ok(outputStr.includes("Gemini instructions path: gemini-instructions.md"), "should log instructions path");
    assert.ok(outputStr.includes("bytes"), "should log byte count");
    
  } finally {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testMainWarnsWhenNoInstructions() {
  const testDir = path.join(__dirname, "tmp_test_no_instructions");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Clear MCP env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    
    // Mock console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
    
    main();
    
    console.log = originalLog;
    console.warn = originalWarn;
    
    const outputStr = logs.join('\n');
    assert.ok(outputStr.includes("No gemini-instructions.md found"), "should warn about missing instructions");
    
  } finally {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testMainUsesCustomInstructionsPath() {
  const testDir = path.join(__dirname, "tmp_test_custom_path");
  
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  
  try {
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
    
    // Create a custom instructions file
    const customPath = "custom-instructions.md";
    const instructionsContent = "# Custom Gemini Instructions\n\nCustom path test";
    fs.writeFileSync(path.join(testDir, customPath), instructionsContent);
    
    // Set custom path
    process.env.GEMINI_INSTRUCTIONS_PATH = customPath;
    
    // Clear MCP env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
        delete process.env[key];
      }
    });
    
    // Mock console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
    
    main();
    
    console.log = originalLog;
    console.warn = originalWarn;
    
    const outputStr = logs.join('\n');
    assert.ok(outputStr.includes("Gemini instructions path: custom-instructions.md"), "should use custom path");
    
  } finally {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

console.log("launch_gemini_mcp tests completed successfully.");
