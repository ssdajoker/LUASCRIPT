"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { main } = require("../../scripts/launch_gemini_mcp");

// Helper function to create a temporary test directory
function createTempDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-gemini-test-"));
  return tmpDir;
}

// Helper function to clean up temporary directory
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Helper function to capture console output
function captureConsole(fn) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logs = [];
  const warnings = [];

  console.log = (...args) => logs.push(args.join(" "));
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    fn();
    return { logs, warnings };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

// Helper function to save and restore environment
function withCleanEnv(fn) {
  const originalCwd = process.cwd();
  const savedEnvKeys = Object.keys(process.env);
  const savedEnvValues = {};
  savedEnvKeys.forEach(key => {
    savedEnvValues[key] = process.env[key];
  });

  try {
    return fn();
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Remove any keys that were added
    Object.keys(process.env).forEach(key => {
      if (!savedEnvKeys.includes(key)) {
        delete process.env[key];
      }
    });
    
    // Restore original values
    savedEnvKeys.forEach(key => {
      if (savedEnvValues[key] !== undefined) {
        process.env[key] = savedEnvValues[key];
      } else {
        delete process.env[key];
      }
    });
  }
}

// Helper function to clear MCP endpoint environment variables
function clearMcpEndpoints() {
  Object.keys(process.env).forEach((key) => {
    if (/^MCP_.*_ENDPOINT$/.test(key)) {
      delete process.env[key];
    }
  });
}

// Helper function to clear gemini instructions path
function clearGeminiInstructions() {
  delete process.env.GEMINI_INSTRUCTIONS_PATH;
}

(function testMainCreatesArtifactsDirectory() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();

    captureConsole(() => main());

    const artifactsDir = path.join(testDir, "artifacts");
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    assert.ok(
      fs.statSync(artifactsDir).isDirectory(),
      "artifacts should be a directory"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainWritesEndpointsJsonFile() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();

    captureConsole(() => main());

    const endpointsPath = path.join(testDir, "artifacts", "gemini_mcp_endpoints.json");
    assert.ok(fs.existsSync(endpointsPath), "gemini_mcp_endpoints.json should be created");

    const content = fs.readFileSync(endpointsPath, "utf8");
    const data = JSON.parse(content);

    assert.ok(typeof data === "object", "endpoints file should contain JSON object");
    assert.ok(Array.isArray(data.keys), "data should have keys array");
    assert.ok(Array.isArray(data.entries), "data should have entries array");
    assert.ok(typeof data.endpoints === "object", "data should have endpoints object");
  });

  cleanupTempDir(testDir);
})();

(function testMainCollectsEnvironmentMcpEndpoints() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();
    process.env.MCP_DOC_INDEX_ENDPOINT = "https://example.com/docs";
    process.env.MCP_FLAKE_DB_ENDPOINT = "https://example.com/flakes";

    captureConsole(() => main());

    const endpointsPath = path.join(testDir, "artifacts", "gemini_mcp_endpoints.json");
    const content = fs.readFileSync(endpointsPath, "utf8");
    const data = JSON.parse(content);

    assert.ok(
      data.keys.includes("MCP_DOC_INDEX_ENDPOINT"),
      "keys should include MCP_DOC_INDEX_ENDPOINT"
    );
    assert.ok(
      data.keys.includes("MCP_FLAKE_DB_ENDPOINT"),
      "keys should include MCP_FLAKE_DB_ENDPOINT"
    );
    assert.strictEqual(
      data.endpoints.MCP_DOC_INDEX_ENDPOINT,
      "https://example.com/docs",
      "endpoints should include doc index URL"
    );
    assert.strictEqual(
      data.endpoints.MCP_FLAKE_DB_ENDPOINT,
      "https://example.com/flakes",
      "endpoints should include flake DB URL"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainOutputsExpectedConsoleMessages() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();
    process.env.MCP_TEST_ENDPOINT = "https://example.com/test";

    const { logs } = captureConsole(() => main());

    const allOutput = logs.join("\n");
    assert.ok(
      allOutput.includes("MCP endpoints captured for Gemini:"),
      "should output header message"
    );
    assert.ok(
      allOutput.includes("MCP_TEST_ENDPOINT"),
      "should output MCP endpoint keys"
    );
    assert.ok(
      allOutput.includes("Suggested env export for Gemini:"),
      "should output env export suggestion"
    );
    assert.ok(
      allOutput.includes("Config written:"),
      "should output config written message"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainWarnsWhenGeminiInstructionsNotFound() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();

    const { warnings } = captureConsole(() => main());

    const allWarnings = warnings.join("\n");
    assert.ok(
      allWarnings.includes("No gemini-instructions.md found"),
      "should warn about missing gemini-instructions.md"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainReadsGeminiInstructionsWhenExists() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    const instructionsPath = path.join(testDir, "gemini-instructions.md");
    const instructionsContent = "# Gemini Instructions\nTest content here.";
    fs.writeFileSync(instructionsPath, instructionsContent, "utf8");

    const { logs } = captureConsole(() => main());

    const allOutput = logs.join("\n");
    assert.ok(
      allOutput.includes("Gemini instructions path:"),
      "should output instructions path"
    );
    assert.ok(
      allOutput.includes("gemini-instructions.md"),
      "should reference gemini-instructions.md"
    );
    assert.ok(
      allOutput.includes("bytes"),
      "should output file size in bytes"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainUsesCustomGeminiInstructionsPath() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    const customPath = path.join(testDir, "custom-gemini-instructions.md");
    const instructionsContent = "# Custom Instructions\nCustom content.";
    fs.writeFileSync(customPath, instructionsContent, "utf8");
    process.env.GEMINI_INSTRUCTIONS_PATH = customPath;

    const { logs } = captureConsole(() => main());

    const allOutput = logs.join("\n");
    assert.ok(
      allOutput.includes("custom-gemini-instructions.md"),
      "should use custom instructions path from environment"
    );
  });

  cleanupTempDir(testDir);
})();

(function testMainHandlesEmptyMcpEndpoints() {
  const testDir = createTempDir();

  withCleanEnv(() => {
    process.chdir(testDir);
    clearGeminiInstructions();
    clearMcpEndpoints();

    captureConsole(() => main());

    const endpointsPath = path.join(testDir, "artifacts", "gemini_mcp_endpoints.json");
    const content = fs.readFileSync(endpointsPath, "utf8");
    const data = JSON.parse(content);

    // Should still have priority keys but with no URLs
    assert.ok(Array.isArray(data.keys), "should have keys array");
    assert.ok(typeof data.endpoints === "object", "should have endpoints object");

    // Priority keys should be present in keys array
    const priorityKeys = [
      "MCP_DOC_INDEX_ENDPOINT",
      "MCP_FLAKE_DB_ENDPOINT",
      "MCP_IR_SCHEMA_ENDPOINT",
    ];
    priorityKeys.forEach((key) => {
      assert.ok(data.keys.includes(key), `should include priority key ${key}`);
    });
  });

  cleanupTempDir(testDir);
})();

console.log("All launch_gemini_mcp tests passed!");
