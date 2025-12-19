"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { writeContextArtifacts } = require("../../scripts/context_pack");

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

(function testWriteContextArtifactsCreatesDirectory() {
  const testDir = path.join(__dirname, "tmp_test_context_pack");
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
    
    clearMcpEndpoints();
    
    const harnessSummary = { cases: 5, slowest: { name: "test", durationMs: 100 } };
    const result = writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    assert.ok(fs.existsSync(artifactsDir), "artifacts directory should be created");
    assert.ok(result.payload, "result should include payload");
    assert.ok(result.contextPack, "result should include contextPack");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsCreatesExpectedFiles() {
  const testDir = path.join(__dirname, "tmp_test_context_files");
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
    
    const harnessSummary = { cases: 3, slowest: { name: "slowTest", durationMs: 250 } };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    // Check that all expected files are created
    const harnessFile = path.join(artifactsDir, "harness_results.json");
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const geminiPackFile = path.join(artifactsDir, "context_pack_gemini.json");
    
    assert.ok(fs.existsSync(harnessFile), "harness_results.json should be created");
    assert.ok(fs.existsSync(contextPackFile), "context_pack.json should be created");
    assert.ok(fs.existsSync(geminiPackFile), "context_pack_gemini.json should be created");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesCopilotInstructions() {
  const testDir = path.join(__dirname, "tmp_test_copilot_instructions");
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
    
    // Create a copilot-instructions.md file
    const copilotContent = "# Copilot Instructions\n\nTest instructions for Copilot";
    fs.writeFileSync(path.join(testDir, "copilot-instructions.md"), copilotContent);
    
    const harnessSummary = { cases: 2 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.instructions, "context pack should include instructions");
    assert.strictEqual(content.instructions.exists, true, "instructions should exist");
    assert.ok(content.instructions.bytes > 0, "instructions should have content");
    assert.ok(content.instructions.excerpt.includes("Copilot Instructions"), "instructions excerpt should contain header");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesGeminiInstructions() {
  const testDir = path.join(__dirname, "tmp_test_gemini_instructions");
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
    
    // Create a gemini-instructions.md file
    const geminiContent = "# Gemini Instructions\n\nTest instructions for Gemini AI";
    fs.writeFileSync(path.join(testDir, "gemini-instructions.md"), geminiContent);
    
    const harnessSummary = { cases: 4 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const geminiPackFile = path.join(artifactsDir, "context_pack_gemini.json");
    const content = JSON.parse(fs.readFileSync(geminiPackFile, "utf8"));
    
    assert.strictEqual(content.target, "gemini", "gemini pack should have target field");
    assert.ok(content.instructions, "gemini pack should include gemini instructions");
    assert.strictEqual(content.instructions.exists, true, "gemini instructions should exist");
    assert.ok(content.instructions.bytes > 0, "gemini instructions should have content");
    assert.ok(content.instructions.excerpt.includes("Gemini Instructions"), "gemini instructions excerpt should contain header");
    assert.ok(content.copilotInstructions, "gemini pack should also include copilot instructions reference");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesCoordinationDoc() {
  const testDir = path.join(__dirname, "tmp_test_coordination");
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
    
    // Create an assistant_coordination.md file
    const coordContent = "# Assistant Coordination\n\nTest coordination document";
    fs.writeFileSync(path.join(testDir, "assistant_coordination.md"), coordContent);
    
    const harnessSummary = { cases: 1 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.coordination, "context pack should include coordination");
    assert.strictEqual(content.coordination.exists, true, "coordination should exist");
    assert.ok(content.coordination.bytes > 0, "coordination should have content");
    assert.ok(content.coordination.excerpt.includes("Assistant Coordination"), "coordination excerpt should contain header");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesMissingInstructions() {
  const testDir = path.join(__dirname, "tmp_test_missing_instructions");
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
    
    // Don't create any instruction files
    const harnessSummary = { cases: 3 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.instructions, "context pack should include instructions field");
    assert.strictEqual(content.instructions.exists, false, "instructions should not exist");
    assert.strictEqual(content.instructions.bytes, 0, "instructions should have zero bytes");
    
    assert.ok(content.geminiInstructions, "context pack should include geminiInstructions field");
    assert.strictEqual(content.geminiInstructions.exists, false, "gemini instructions should not exist");
    
    assert.ok(content.coordination, "context pack should include coordination field");
    assert.strictEqual(content.coordination.exists, false, "coordination should not exist");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesCustomInstructionPaths() {
  const testDir = path.join(__dirname, "tmp_test_custom_paths");
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
    
    // Create custom instruction files with custom paths
    const customCopilotPath = "my-copilot.md";
    const customGeminiPath = "my-gemini.md";
    const customCoordPath = "my-coord.md";
    
    fs.writeFileSync(path.join(testDir, customCopilotPath), "# Custom Copilot\n\nCustom content");
    fs.writeFileSync(path.join(testDir, customGeminiPath), "# Custom Gemini\n\nCustom content");
    fs.writeFileSync(path.join(testDir, customCoordPath), "# Custom Coordination\n\nCustom content");
    
    process.env.COPILOT_INSTRUCTIONS_PATH = customCopilotPath;
    process.env.GEMINI_INSTRUCTIONS_PATH = customGeminiPath;
    process.env.ASSISTANT_COORD_PATH = customCoordPath;
    
    const harnessSummary = { cases: 2 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.strictEqual(content.instructions.path, customCopilotPath, "should use custom copilot path");
    assert.strictEqual(content.geminiInstructions.path, customGeminiPath, "should use custom gemini path");
    assert.strictEqual(content.coordination.path, customCoordPath, "should use custom coordination path");
    
    assert.ok(content.instructions.excerpt.includes("Custom Copilot"), "should load custom copilot content");
    assert.ok(content.geminiInstructions.excerpt.includes("Custom Gemini"), "should load custom gemini content");
    assert.ok(content.coordination.excerpt.includes("Custom Coordination"), "should load custom coordination content");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesMcpEndpoints() {
  const testDir = path.join(__dirname, "tmp_test_mcp_endpoints");
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
    process.env.MCP_IR_SCHEMA_ENDPOINT = "http://localhost:8082/schema";
    process.env.MCP_TEST_ENDPOINT = "http://localhost:8083/test";
    
    const harnessSummary = { cases: 6 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.mcp, "context pack should include mcp field");
    assert.ok(content.mcp.keys, "mcp should have keys array");
    assert.ok(content.mcp.endpoints, "mcp should have endpoints object");
    assert.ok(content.mcp.envString, "mcp should have envString");
    
    assert.ok(content.mcp.keys.includes("MCP_DOC_INDEX_ENDPOINT"), "should include DOC endpoint key");
    assert.ok(content.mcp.keys.includes("MCP_FLAKE_DB_ENDPOINT"), "should include FLAKE endpoint key");
    assert.ok(content.mcp.keys.includes("MCP_IR_SCHEMA_ENDPOINT"), "should include IR_SCHEMA endpoint key");
    assert.ok(content.mcp.keys.includes("MCP_TEST_ENDPOINT"), "should include TEST endpoint key");
    
    assert.strictEqual(content.mcp.endpoints.MCP_DOC_INDEX_ENDPOINT, "http://localhost:8080/doc");
    assert.strictEqual(content.mcp.endpoints.MCP_FLAKE_DB_ENDPOINT, "http://localhost:8081/flake");
    assert.strictEqual(content.mcp.endpoints.MCP_IR_SCHEMA_ENDPOINT, "http://localhost:8082/schema");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsHandlesRunInfo() {
  const testDir = path.join(__dirname, "tmp_test_run_info");
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
    
    const harnessSummary = { cases: 5 };
    const runInfo = {
      gitSha: "abc123def456",
      runId: "12345",
      runUrl: "https://github.com/test/repo/actions/runs/12345"
    };
    
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir, runInfo });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.run, "context pack should include run field");
    assert.strictEqual(content.run.gitSha, "abc123def456", "run should include gitSha");
    assert.strictEqual(content.run.runId, "12345", "run should include runId");
    assert.strictEqual(content.run.runUrl, "https://github.com/test/repo/actions/runs/12345", "run should include runUrl");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsIncludesTimestamp() {
  const testDir = path.join(__dirname, "tmp_test_timestamp");
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
    
    const beforeTime = new Date();
    const harnessSummary = { cases: 3 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    const afterTime = new Date();
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.generatedAt, "context pack should include generatedAt field");
    const generatedTime = new Date(content.generatedAt);
    assert.ok(generatedTime >= beforeTime, "generatedAt should be after start time");
    assert.ok(generatedTime <= afterTime, "generatedAt should be before end time");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsIncludesHarnessSummary() {
  const testDir = path.join(__dirname, "tmp_test_harness_summary");
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
    
    const harnessSummary = { 
      cases: 7, 
      slowest: { name: "complexTest", durationMs: 500 },
      summary: { passed: 7, failed: 0 }
    };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const contextPackFile = path.join(artifactsDir, "context_pack.json");
    const content = JSON.parse(fs.readFileSync(contextPackFile, "utf8"));
    
    assert.ok(content.harness, "context pack should include harness field");
    assert.strictEqual(content.harness.cases, 7, "harness should include cases count");
    assert.ok(content.harness.slowest, "harness should include slowest test");
    assert.strictEqual(content.harness.slowest.name, "complexTest", "harness should include slowest test name");
    assert.strictEqual(content.harness.slowest.durationMs, 500, "harness should include slowest test duration");
    assert.ok(content.harness.summary, "harness should include summary");
    
    const harnessFile = path.join(artifactsDir, "harness_results.json");
    const harnessContent = JSON.parse(fs.readFileSync(harnessFile, "utf8"));
    assert.strictEqual(harnessContent.cases, 7, "harness_results should include cases");
    assert.ok(harnessContent.slowest, "harness_results should include slowest");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

(function testWriteContextArtifactsGeminiPackStructure() {
  const testDir = path.join(__dirname, "tmp_test_gemini_structure");
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
    
    // Create both instruction files
    fs.writeFileSync(path.join(testDir, "copilot-instructions.md"), "# Copilot\n\nContent");
    fs.writeFileSync(path.join(testDir, "gemini-instructions.md"), "# Gemini\n\nContent");
    
    const harnessSummary = { cases: 4 };
    writeContextArtifacts({ harnessSummary, outDir: artifactsDir });
    
    const geminiPackFile = path.join(artifactsDir, "context_pack_gemini.json");
    const geminiPack = JSON.parse(fs.readFileSync(geminiPackFile, "utf8"));
    
    // Verify gemini pack has all expected fields
    assert.strictEqual(geminiPack.target, "gemini", "gemini pack should have target=gemini");
    assert.ok(geminiPack.generatedAt, "gemini pack should have generatedAt");
    assert.ok(geminiPack.run, "gemini pack should have run");
    assert.ok(geminiPack.instructions, "gemini pack should have instructions (gemini)");
    assert.ok(geminiPack.copilotInstructions, "gemini pack should have copilotInstructions");
    assert.ok(geminiPack.coordination, "gemini pack should have coordination");
    assert.ok(geminiPack.mcp, "gemini pack should have mcp");
    assert.ok(geminiPack.harness, "gemini pack should have harness");
    
    // Verify instructions fields point to correct files
    assert.ok(geminiPack.instructions.excerpt.includes("Gemini"), "instructions should be gemini instructions");
    assert.ok(geminiPack.copilotInstructions.excerpt.includes("Copilot"), "copilotInstructions should be copilot instructions");
    
  } finally {
    process.chdir(originalCwd);
    restoreEnv(originalEnv);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
})();

console.log("context_pack tests completed successfully.");
