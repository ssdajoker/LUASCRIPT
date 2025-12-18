"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { main } = require("../../scripts/launch_gemini_mcp");

// Test main function
(function testMainFunctionCreatesExpectedOutputs() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logOutput = [];
  const warnOutput = [];

  // Mock console.log and console.warn to capture output
  console.log = (...args) => logOutput.push(args.join(" "));
  console.warn = (...args) => warnOutput.push(args.join(" "));

  try {
    // Change to temp directory and set up test environment
    process.chdir(tmpDir);
    process.env.MCP_TEST_ENDPOINT = "http://test.example.com";
    process.env.MCP_DEMO_ENDPOINT = "http://demo.example.com";

    // Run main function
    main();

    // Verify artifacts directory was created
    const artifactsDir = path.join(tmpDir, "artifacts");
    assert.ok(fs.existsSync(artifactsDir), "Artifacts directory should be created");

    // Verify gemini_mcp_endpoints.json was created
    const endpointsPath = path.join(artifactsDir, "gemini_mcp_endpoints.json");
    assert.ok(fs.existsSync(endpointsPath), "gemini_mcp_endpoints.json should be created");

    const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    assert.ok(endpoints.keys, "Should have keys array");
    assert.ok(endpoints.entries, "Should have entries array");
    assert.ok(endpoints.endpoints, "Should have endpoints object");
    assert.strictEqual(endpoints.endpoints.MCP_TEST_ENDPOINT, "http://test.example.com");
    assert.strictEqual(endpoints.endpoints.MCP_DEMO_ENDPOINT, "http://demo.example.com");

    // Verify console output
    assert.ok(logOutput.some((line) => line.includes("MCP endpoints captured for Gemini")), "Should log MCP endpoints message");
    assert.ok(
      logOutput.some((line) => line.includes("MCP_TEST_ENDPOINT") || line.includes("MCP_DEMO_ENDPOINT")),
      "Should log endpoint keys"
    );
    assert.ok(logOutput.some((line) => line.includes("Suggested env export for Gemini")), "Should log suggested env export");
    assert.ok(logOutput.some((line) => line.includes("Config written")), "Should log config written message");

    // Verify warning about missing gemini-instructions.md
    assert.ok(
      warnOutput.some((line) => line.includes("No gemini-instructions.md found")),
      "Should warn about missing gemini-instructions.md"
    );
  } finally {
    // Restore original state
    process.chdir(originalCwd);
    console.log = originalLog;
    console.warn = originalWarn;
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

// Test main function with existing gemini-instructions.md
(function testMainFunctionWithGeminiInstructions() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logOutput = [];
  const warnOutput = [];

  console.log = (...args) => logOutput.push(args.join(" "));
  console.warn = (...args) => warnOutput.push(args.join(" "));

  try {
    // Create gemini-instructions.md file
    const instructionsContent = "# Gemini Test Instructions\n\nTest content for Gemini.";
    fs.writeFileSync(path.join(tmpDir, "gemini-instructions.md"), instructionsContent, "utf8");

    process.chdir(tmpDir);
    process.env.MCP_SAMPLE_ENDPOINT = "http://sample.example.com";

    main();

    // Verify no warning about missing instructions
    assert.ok(
      !warnOutput.some((line) => line.includes("No gemini-instructions.md found")),
      "Should not warn when gemini-instructions.md exists"
    );

    // Verify log about instructions path
    assert.ok(
      logOutput.some((line) => line.includes("Gemini instructions path")),
      "Should log instructions path when file exists"
    );

    // Verify endpoints file contains expected data
    const endpointsPath = path.join(tmpDir, "artifacts", "gemini_mcp_endpoints.json");
    const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    assert.strictEqual(endpoints.endpoints.MCP_SAMPLE_ENDPOINT, "http://sample.example.com");
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
    console.warn = originalWarn;
    fs.rmSync(tmpDir, { recursive: true, force: true });

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("MCP_") && !originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  }
})();

// Test main function with custom GEMINI_INSTRUCTIONS_PATH
(function testMainFunctionWithCustomInstructionsPath() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logOutput = [];

  console.log = (...args) => logOutput.push(args.join(" "));
  console.warn = (...args) => {};

  try {
    // Create custom instructions file
    const customPath = path.join(tmpDir, "custom-gemini.md");
    fs.writeFileSync(customPath, "# Custom Gemini Instructions", "utf8");

    process.chdir(tmpDir);
    process.env.GEMINI_INSTRUCTIONS_PATH = customPath;

    main();

    // Verify custom path is logged
    assert.ok(logOutput.some((line) => line.includes("custom-gemini.md")), "Should log custom instructions path");
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
    console.warn = originalWarn;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.GEMINI_INSTRUCTIONS_PATH;
    Object.assign(process.env, originalEnv);
  }
})();

// Test main function with no MCP endpoints
(function testMainFunctionWithNoEndpoints() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logOutput = [];

  console.log = (...args) => logOutput.push(args.join(" "));
  console.warn = (...args) => {};

  try {
    // Remove all MCP endpoints from environment
    const mcpKeys = Object.keys(process.env).filter((key) => key.startsWith("MCP_") && key.endsWith("_ENDPOINT"));
    mcpKeys.forEach((key) => {
      delete process.env[key];
    });

    process.chdir(tmpDir);

    main();

    // Verify endpoints file was still created but with empty endpoints
    const endpointsPath = path.join(tmpDir, "artifacts", "gemini_mcp_endpoints.json");
    assert.ok(fs.existsSync(endpointsPath), "Should create endpoints file even with no endpoints");

    const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
    assert.ok(endpoints.keys, "Should have keys array");
    assert.ok(endpoints.endpoints, "Should have endpoints object");

    // Verify console output shows endpoints were captured (even if empty)
    assert.ok(logOutput.some((line) => line.includes("MCP endpoints captured for Gemini")), "Should log capture message");
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
    console.warn = originalWarn;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Object.assign(process.env, originalEnv);
  }
})();

// Test main function creates proper JSON structure
(function testMainFunctionJsonStructure() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  const originalLog = console.log;
  const originalWarn = console.warn;

  console.log = () => {};
  console.warn = () => {};

  try {
    process.chdir(tmpDir);
    process.env.MCP_PRIORITY_ENDPOINT = "http://priority.example.com";

    main();

    const endpointsPath = path.join(tmpDir, "artifacts", "gemini_mcp_endpoints.json");
    const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));

    // Verify JSON structure matches expected format
    assert.ok(Array.isArray(endpoints.keys), "keys should be an array");
    assert.ok(Array.isArray(endpoints.entries), "entries should be an array");
    assert.ok(typeof endpoints.endpoints === "object", "endpoints should be an object");
    assert.ok(typeof endpoints.envString === "string", "envString should be a string");

    // Verify envString is valid JSON
    const parsedEnvString = JSON.parse(endpoints.envString);
    assert.strictEqual(typeof parsedEnvString, "object", "envString should parse to an object");

    // Verify entries have correct structure
    if (endpoints.entries.length > 0) {
      const entry = endpoints.entries[0];
      assert.ok(entry.key, "entry should have key property");
      assert.ok(entry.hasOwnProperty("url"), "entry should have url property");
    }
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
    console.warn = originalWarn;
    fs.rmSync(tmpDir, { recursive: true, force: true });

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("MCP_") && !originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  }
})();

console.log("launch_gemini_mcp.js tests completed successfully.");
