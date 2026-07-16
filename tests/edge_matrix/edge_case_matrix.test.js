"use strict";

const fs = require("fs");
const path = require("path");

const {
  repoRoot,
  findCommand,
  runCommand,
  withTempDir,
  writeJsonReport,
  commandSummary
} = require("../clarity_canon/runner_utils");
const {
  environmentMetadata,
  manifestEvidence,
  supportMatrixTraceability
} = require("../conformance/report_utils");
const {
  CoreLanguageBridge
} = require("../../src/compilers");

const manifestPath = path.join(repoRoot, "tests", "edge_matrix", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const bridge = new CoreLanguageBridge();
const runtimeTimeoutMs = 10000;
const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");
const runtimeCommands = {};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compactOutput(value) {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map(line => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function runtime(name) {
  if (!runtimeCommands[name]) {
    const runtimes = {
      javascript: () => findCommand(["node"], "Node.js"),
      python: () => findCommand(["python3", "python"], "Python 3"),
      lua: () => findCommand(["luajit", "lua"], "Lua interpreter")
    };
    if (!runtimes[name]) {
      throw new Error(`No runtime command configured for ${name}`);
    }
    runtimeCommands[name] = runtimes[name]();
  }
  return runtimeCommands[name];
}

function extension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    lua: "lua"
  };
  if (!extensions[language]) {
    throw new Error(`No source extension configured for ${language}`);
  }
  return extensions[language];
}

function runLuaSource(luaSource, label) {
  return withTempDir("luascript-edge-lua-", (tmpDir) => {
    const luaPath = path.join(tmpDir, `${label}.lua`);
    const luaWithPolyfill = `-- math.pow polyfill for Lua 5.4 compatibility
if not math.pow then math.pow = function(x, y) return x ^ y end end

${luaSource}`;
    fs.writeFileSync(luaPath, luaWithPolyfill, "utf8");
    return runCommand(runtime("lua"), [luaPath], `${label} lua`, {
      timeout: runtimeTimeoutMs,
      env: {
        LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
  });
}

function runLuascriptSource(lsSource, label) {
  return withTempDir("luascript-edge-ls-", (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.ls`);
    const luaPath = path.join(tmpDir, `${label}.lua`);
    fs.writeFileSync(sourcePath, lsSource, "utf8");

    const compile = runCommand(
      runtime("python"),
      [path.join("src", "luascript_compiler.py"), "compile", sourcePath, "-o", luaPath],
      `${label} luascript compile`,
      { timeout: runtimeTimeoutMs }
    );
    if (compile.status !== 0) {
      return {
        status: compile.status,
        signal: compile.signal,
        stdout: compile.stdout,
        stderr: compile.stderr,
        compile,
        runtime: null
      };
    }

    const result = runCommand(runtime("lua"), [luaPath], `${label} luascript runtime`, {
      timeout: runtimeTimeoutMs,
      env: {
        LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
    result.compile = compile;
    return result;
  });
}

function runSource(language, source, label) {
  if (language === "lua") {
    return runLuaSource(source, label);
  }

  if (language === "luascript") {
    return runLuascriptSource(source, label);
  }

  return withTempDir(`luascript-edge-${language}-`, (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.${extension(language)}`);
    fs.writeFileSync(sourcePath, source, "utf8");
    return runCommand(runtime(language), [sourcePath], `${label} ${language}`, {
      timeout: runtimeTimeoutMs,
      env: {
        PYTHONIOENCODING: "utf-8"
      }
    });
  });
}

function assertCommandPassed(result, label) {
  if (result.status !== 0) {
    fail(`${label} failed: ${result.stderr || result.stdout || result.error || "unknown failure"}`, {
      command: commandSummary(result)
    });
  }
}

function assertCommandFailedWith(result, expectedPattern, label) {
  if (result.status === 0) {
    fail(`${label} unexpectedly passed`, {
      command: commandSummary(result)
    });
  }

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  const regex = new RegExp(expectedPattern, "i");
  if (!regex.test(combined)) {
    fail(`${label} failed with wrong diagnostic. Expected /${expectedPattern}/i, got ${JSON.stringify(compactOutput(combined))}`, {
      command: commandSummary(result)
    });
  }
}

function assertExpectedOutput(result, expectedOutput, label) {
  const actual = compactOutput(result.stdout);
  if (actual !== expectedOutput) {
    fail(`${label} output mismatch. Expected ${JSON.stringify(expectedOutput)}, got ${JSON.stringify(actual)}`, {
      command: commandSummary(result)
    });
  }
}

function validateManifest() {
  if (manifest.schemaVersion !== 1) {
    fail("edge matrix manifest schemaVersion must be 1");
  }
  if (manifest.name !== "canonical-edge-case-matrix-v0") {
    fail("edge matrix manifest keeps canonical-edge-case-matrix-v0 name");
  }
  if (!Array.isArray(manifest.requiredCategories) || manifest.requiredCategories.length === 0) {
    fail("edge matrix manifest must declare requiredCategories");
  }
  if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
    fail("edge matrix manifest must declare cases");
  }

  const requiredCategories = new Set(manifest.requiredCategories);
  const seenCategories = new Set();
  const seenIds = new Set();

  for (const item of manifest.cases) {
    if (!item.id || seenIds.has(item.id)) {
      fail(`edge matrix case has missing or duplicate id: ${item.id || "<missing>"}`);
    }
    seenIds.add(item.id);

    if (!requiredCategories.has(item.category)) {
      fail(`${item.id} has unknown category ${item.category}`);
    }
    seenCategories.add(item.category);

    if (!item.sourceLanguage || !item.source) {
      fail(`${item.id} must declare sourceLanguage and source`);
    }
    if (!item.feature || !item.claim) {
      fail(`${item.id} must declare feature and claim`);
    }
    if (item.category === "unsupported-diagnostics" && !item.expectedDiagnosticPattern) {
      fail(`${item.id} unsupported-diagnostics cases must declare expectedDiagnosticPattern`);
    }
    if (item.category === "errors" && !(item.targets || []).some(target => target.expectedRuntimeError)) {
      fail(`${item.id} errors cases must include at least one expectedRuntimeError target`);
    }
  }

  for (const category of requiredCategories) {
    if (!seenCategories.has(category)) {
      fail(`edge matrix category has no seeded case: ${category}`);
    }
  }
}

function verifyExpectedDiagnostic(item) {
  try {
    bridge.compileToIR(item.source, item.sourceLanguage);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const regex = new RegExp(item.expectedDiagnosticPattern, "i");
    if (!regex.test(message)) {
      fail(`${item.id} failed with the wrong diagnostic: ${message}`);
    }
    return {
      id: item.id,
      category: item.category,
      feature: item.feature,
      status: "passed",
      diagnostic: message
    };
  }

  fail(`${item.id} unexpectedly compiled; remove it from unsupported-diagnostics or update the matrix`);
}

function verifyRunnableTarget(item, ir, target) {
  const targetLanguage = target.language;
  const emitted = bridge.emitFromIR(deepClone(ir), targetLanguage, item.sourceLanguage);

  if (target.includes) {
    for (const expected of target.includes) {
      if (!emitted.includes(expected)) {
        fail(`${item.id} -> ${targetLanguage} emitted output missing ${JSON.stringify(expected)}`);
      }
    }
  }

  if (target.excludes) {
    for (const unexpected of target.excludes) {
      if (emitted.includes(unexpected)) {
        fail(`${item.id} -> ${targetLanguage} emitted unexpected ${JSON.stringify(unexpected)}`);
      }
    }
  }

  if (target.expectedOutput) {
    const result = runSource(targetLanguage, emitted, `${item.id}-${targetLanguage}`);
    assertCommandPassed(result, `${item.id} -> ${targetLanguage}`);
    assertExpectedOutput(result, target.expectedOutput, `${item.id} -> ${targetLanguage}`);
    return {
      language: targetLanguage,
      mode: "runtime-output",
      status: "passed",
      command: commandSummary(result)
    };
  }

  if (target.expectedRuntimeError) {
    const result = runSource(targetLanguage, emitted, `${item.id}-${targetLanguage}`);
    assertCommandFailedWith(result, target.expectedRuntimeError, `${item.id} -> ${targetLanguage}`);
    return {
      language: targetLanguage,
      mode: "runtime-error",
      status: "passed",
      command: commandSummary(result)
    };
  }

  return {
    language: targetLanguage,
    mode: "emitted-shape",
    status: "passed"
  };
}

function verifyCase(item) {
  if (item.expectedDiagnosticPattern) {
    return verifyExpectedDiagnostic(item);
  }

  const ir = bridge.compileToIR(item.source, item.sourceLanguage);
  if (!ir || !Array.isArray(ir.body) || ir.body.length === 0) {
    fail(`${item.id} produced empty canonical IR`);
  }

  return {
    id: item.id,
    category: item.category,
    feature: item.feature,
    status: "passed",
    targets: (item.targets || []).map(target => verifyRunnableTarget(item, ir, target))
  };
}

function buildMatrix(results) {
  const matrix = {};
  for (const category of manifest.requiredCategories) {
    matrix[category] = {
      total: 0,
      passed: 0,
      cases: []
    };
  }

  for (const result of results) {
    if (!matrix[result.category]) {
      matrix[result.category] = { total: 0, passed: 0, cases: [] };
    }
    matrix[result.category].total += 1;
    if (result.status === "passed") {
      matrix[result.category].passed += 1;
    }
    matrix[result.category].cases.push(result.id);
  }

  return matrix;
}

function buildCategoryCounts(matrix) {
  return Object.fromEntries(
    Object.entries(matrix).map(([category, entry]) => [category, entry.total])
  );
}

function main() {
  const results = [];
  const failures = [];

  console.log(`Running ${manifest.name} (${manifest.status})...`);

  try {
    validateManifest();
  } catch (error) {
    failures.push({ id: "manifest", message: error.message, details: error.details || null });
  }

  if (failures.length === 0) {
    for (const item of manifest.cases) {
      try {
        const result = verifyCase(item);
        results.push(result);
        console.log(`PASS ${item.id}`);
      } catch (error) {
        failures.push({ id: item.id, message: error.message, details: error.details || null });
        results.push({
          id: item.id,
          category: item.category,
          feature: item.feature,
          status: "failed",
          error: error.message
        });
        console.error(`FAIL ${item.id}: ${error.message}`);
      }
    }
  }

  const matrix = buildMatrix(results);
  const categoryCounts = buildCategoryCounts(matrix);
  const report = {
    schemaVersion: 1,
    kind: "luascript:edge-case-matrix",
    generatedAt: new Date().toISOString(),
    environment: environmentMetadata(),
    manifest: {
      ...manifestEvidence(manifestPath, manifest, manifest.cases.map(item => item.id)),
      name: manifest.name,
      status: manifest.status,
      requiredCategories: manifest.requiredCategories,
      categoryCounts
    },
    supportMatrixTraceability: supportMatrixTraceability({
      supportRows: [
        "The first seeded edge-case matrix generator",
        "LUASCRIPT `.ls` JS-like syntax plus V0.16 meta layer to Lua/Python/JavaScript/`.ls`",
        "Python V1.3 sequence-slice slice",
        "Lua input V2.1 table-index Python-target support slice"
      ],
      evidenceRole: "Scoped 25-case edge-case matrix across value, control, scope, data, errors, target-specific behavior, and unsupported diagnostics.",
      boundary: "Report evidence applies only to named edge matrix cases and does not claim exhaustive edge coverage, canonical 1.0 completion, ISO certification, or true omni-language 100%."
    }),
    summary: {
      total: manifest.cases.length,
      passed: results.filter(result => result.status === "passed").length,
      failed: failures.length,
      categoryCounts,
      runtimeTargetChecks: results.reduce((total, result) => total + ((result.targets || []).filter(target => target.mode === "runtime-output").length), 0),
      runtimeErrorChecks: results.reduce((total, result) => total + ((result.targets || []).filter(target => target.mode === "runtime-error").length), 0),
      unsupportedDiagnosticChecks: results.filter(result => result.diagnostic).length
    },
    matrix,
    results,
    failures
  };
  const reportPath = path.join(repoRoot, manifest.artifact || "artifacts/edge_matrix/edge-case-matrix-report.json");
  writeJsonReport(reportPath, report);

  console.log(`Edge-case matrix results: ${report.summary.passed}/${report.summary.total} passed`);
  console.log(`Edge-case matrix report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
