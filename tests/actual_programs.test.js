"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const manifestRelativePath = "tests/actual_programs/manifest.json";
const manifestPath = path.join(repoRoot, manifestRelativePath);
const reportRelativePath = "artifacts/conformance/actual-programs-report.json";
const reportPath = path.join(repoRoot, reportRelativePath);
const command = "npm run test:actual-programs";
const startedAt = Date.now();

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileEvidence(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const absolutePath = path.join(repoRoot, normalizedPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return {
      path: normalizedPath,
      sha256: null,
      sizeBytes: null,
      exists: false
    };
  }
  const contents = fs.readFileSync(absolutePath);
  return {
    path: normalizedPath,
    sha256: sha256Buffer(contents),
    sizeBytes: contents.length,
    exists: true
  };
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function normalizeOutput(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function commandInvocation(cmd, args) {
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(cmd)) {
    return { cmd: "cmd.exe", args: ["/c", cmd, ...args] };
  }
  return { cmd, args };
}

function probeCommand(cmd) {
  const executable = path.basename(cmd).toLowerCase().replace(/\.(exe|cmd|bat)$/, "");
  const candidateArgs = executable === "lua" || executable === "luajit"
    ? [["-v"], ["--version"]]
    : [["--version"], ["-v"]];
  for (const args of candidateArgs) {
    const invocation = commandInvocation(cmd, args);
    const result = spawnSync(invocation.cmd, invocation.args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000
    });
    if (result.status === 0) {
      return {
        args,
        status: result.status,
        signal: result.signal,
        stdout: normalizeOutput(result.stdout),
        stderr: normalizeOutput(result.stderr),
        error: result.error ? String(result.error.message || result.error) : null
      };
    }
  }
  return null;
}

function findCommand(candidates, label) {
  const toolsDir = path.join(repoRoot, ".tools");

  function tryCommand(cmd) {
    return probeCommand(cmd) ? cmd : null;
  }

  for (const cmd of candidates) {
    const found = tryCommand(cmd);
    if (found) return found;
  }

  if (fs.existsSync(toolsDir)) {
    const toolSubdirs = fs.readdirSync(toolsDir);
    for (const subdir of toolSubdirs) {
      const toolPath = path.join(toolsDir, subdir);
      if (fs.statSync(toolPath).isDirectory()) {
        for (const cmd of candidates) {
          const suffix = process.platform === "win32" ? ".exe" : "";
          const cmdInTool = path.join(toolPath, cmd + suffix);
          if (fs.existsSync(cmdInTool)) {
            const found = tryCommand(cmdInTool);
            if (found) return found;
          }
          const cmdInBin = path.join(toolPath, "bin", cmd + suffix);
          if (fs.existsSync(cmdInBin)) {
            const found = tryCommand(cmdInBin);
            if (found) return found;
          }
        }
      }
    }
  }

  throw new Error(`Missing required dependency: ${label} (${candidates.join(" or ")})`);
}

function runCommand(cmd, args, label, options = {}) {
  const invocation = commandInvocation(cmd, args);
  const result = spawnSync(invocation.cmd, invocation.args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONIOENCODING: "utf-8", ...options.env },
    timeout: options.timeout || 30000
  });

  const commandResult = {
    status: result.status,
    signal: result.signal,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    error: result.error ? String(result.error.message || result.error) : null
  };

  if (!options.allowFailure && result.status !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(`${label} failed with status ${result.status}: ${message}`);
  }

  return commandResult;
}

function assertRegex(actual, pattern, label) {
  const regex = new RegExp(pattern, "i");
  if (!regex.test(actual)) {
    throw new Error(`${label} did not match /${pattern}/i. Actual output: ${JSON.stringify(actual)}`);
  }
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "luascript-actual-"));
  try {
    return fn(dir);
  } catch (error) {
    error.actualProgramTempDir = dir;
    throw error;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function classifyProgram(program) {
  if (program.expectedFailure) return "expected-compile-diagnostic";
  if (program.expectedRuntimeFailure) return "expected-runtime-diagnostic";
  return "positive-runtime";
}

function sanitizeFailureMessage(message, tempDir) {
  let sanitized = String(message || "Unknown actual-program failure").replace(/\r\n/g, "\n");
  if (tempDir) {
    sanitized = sanitized.split(tempDir).join("<temporary-directory>");
    sanitized = sanitized.split(tempDir.replace(/\\/g, "/")).join("<temporary-directory>");
  }
  return sanitized;
}

function makeResult(program) {
  const sourceEvidence = fileEvidence(program.source);
  return {
    name: String(program.name || ""),
    source: sourceEvidence.path,
    sourceSha256: sourceEvidence.sha256,
    sourceSizeBytes: sourceEvidence.sizeBytes,
    classification: classifyProgram(program),
    status: "not-run",
    checks: {
      sourcePresent: sourceEvidence.exists,
      compileStatus: null,
      executionStatus: null,
      expectedOutputAlternativeCount: Array.isArray(program.expectedOutputIncludes)
        ? program.expectedOutputIncludes.length
        : 0,
      expectedCompileDiagnosticCount: Array.isArray(program.expectedFailurePatterns)
        ? program.expectedFailurePatterns.length
        : 0,
      expectedRuntimeDiagnosticCount: Array.isArray(program.expectedRuntimeFailurePatterns)
        ? program.expectedRuntimeFailurePatterns.length
        : 0,
      matchedExpectationCount: 0
    }
  };
}

function executeProgram(program, result, pythonCmd, luaCmd, luaRuntimePath) {
  const sourcePath = path.join(repoRoot, program.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing actual-program fixture: ${program.source}`);
  }

  withTempDir((tmpDir) => {
    const tempSource = path.join(tmpDir, `${program.name}.ls`);
    const compiledPath = path.join(tmpDir, `${program.name}.lua`);
    fs.copyFileSync(sourcePath, tempSource);

    console.log(`-> ${program.name}: compiling`);
    const compile = runCommand(
      pythonCmd,
      [path.join("src", "luascript_compiler.py"), "compile", tempSource, "-o", compiledPath],
      `${program.name} compile`,
      { allowFailure: Boolean(program.expectedFailure) }
    );
    result.checks.compileStatus = compile.status;

    if (program.expectedFailure) {
      if (compile.status === 0) {
        throw new Error(`${program.name} unexpectedly compiled successfully`);
      }
      const combined = `${compile.stdout}\n${compile.stderr}`.trim();
      for (const pattern of program.expectedFailurePatterns || []) {
        assertRegex(combined, pattern, `${program.name} expected compile diagnostic`);
        result.checks.matchedExpectationCount += 1;
      }
      return;
    }

    const compiled = fs.readFileSync(compiledPath, "utf8");
    if (!compiled.trim()) {
      throw new Error(`${program.name} compile produced empty Lua`);
    }
    if (/Unhandled node type|not yet supported/i.test(compiled)) {
      throw new Error(`${program.name} compile emitted placeholder Lua`);
    }

    console.log(`-> ${program.name}: executing`);
    const execution = program.expectedRuntimeFailure
      ? runCommand(luaCmd, [compiledPath], `${program.name} lua`, {
        allowFailure: true,
        env: { LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}` }
      })
      : runCommand(
        pythonCmd,
        [path.join("src", "luascript_compiler.py"), "run", tempSource],
        `${program.name} run`
      );
    result.checks.executionStatus = execution.status;

    if (program.expectedRuntimeFailure) {
      if (execution.status === 0) {
        throw new Error(`${program.name} unexpectedly ran successfully`);
      }
      const combined = `${execution.stdout}\n${execution.stderr}`.trim();
      for (const pattern of program.expectedRuntimeFailurePatterns || []) {
        assertRegex(combined, pattern, `${program.name} expected runtime diagnostic`);
        result.checks.matchedExpectationCount += 1;
      }
      return;
    }

    const expectedOutputs = program.expectedOutputIncludes || [];

    function normalizeProgramOutput(output) {
      return output.replace(/(\d+)(\.0)(\s|\t|$)/g, "$1$3");
    }

    const normalizedOutput = normalizeProgramOutput(execution.stdout);
    const matched = expectedOutputs.some((expected) =>
      normalizedOutput.includes(expected) || execution.stdout.includes(expected)
    );
    if (!matched) {
      throw new Error(
        `${program.name} output missing any of ${JSON.stringify(expectedOutputs)}. Actual output: ${JSON.stringify(execution.stdout)}`
      );
    }
    result.checks.matchedExpectationCount = 1;
  });
}

function makeReport(manifest, results, runtimeEvidence, failures, fatalFailure) {
  const classifications = {
    positiveRuntime: results.filter((entry) => entry.classification === "positive-runtime").length,
    expectedCompileDiagnostic: results.filter(
      (entry) => entry.classification === "expected-compile-diagnostic"
    ).length,
    expectedRuntimeDiagnostic: results.filter(
      (entry) => entry.classification === "expected-runtime-diagnostic"
    ).length
  };
  const failed = results.filter((entry) => entry.status === "failed").length;
  const notRun = results.filter((entry) => entry.status === "not-run").length;
  const effectiveFailureCount = failures.length + (fatalFailure && failures.length === 0 ? 1 : 0);
  return {
    schemaVersion: 1,
    kind: "luascript:actual-programs:repository-legacy",
    command,
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    status: failed === 0 && notRun === 0 && effectiveFailureCount === 0 ? "passed" : "failed",
    boundary: {
      evidenceScope: "repository-local legacy compiler and runtime behavior",
      packageCompatibilityClaimed: false,
      statement:
        "This suite exercises src/luascript_compiler.py and the repository runtime; it is not evidence for the installed public JavaScript package API."
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      os: {
        type: os.type(),
        release: os.release()
      },
      cwd: repoRoot,
      runtimeTimeoutMs: 30000
    },
    inputs: {
      manifest: fileEvidence(manifestRelativePath),
      harness: fileEvidence("tests/actual_programs.test.js"),
      implementationEvidence: [
        "src/luascript_compiler.py",
        "src/lexer/enhanced_lexer.py",
        "src/parser/enhanced_parser.py",
        "src/transpiler/enhanced_transpiler.py",
        "runtime/runtime.lua",
        "runtime/core/enhanced_runtime.lua"
      ].map(fileEvidence),
      sourceCount: manifest && Array.isArray(manifest.programs) ? manifest.programs.length : 0
    },
    runtimeEvidence,
    results,
    summary: {
      total: results.length,
      passed: results.filter((entry) => entry.status === "passed").length,
      failed: failed + (fatalFailure && failed === 0 ? 1 : 0),
      notRun,
      ...classifications
    },
    failures: failures.length > 0
      ? failures
      : fatalFailure
        ? [{ name: "harness", message: sanitizeFailureMessage(fatalFailure.message) }]
        : []
  };
}

let manifest = null;
let results = [];
let runtimeEvidence = [];
let fatalFailure = null;
const failures = [];

try {
  delete require.cache[require.resolve(manifestPath)];
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.programs)) {
    throw new Error("Actual-program manifest must contain a programs array");
  }
  results = manifest.programs.map(makeResult);

  const pythonCmd = findCommand(["python3", "python"], "Python 3");
  const luaCmd = findCommand(["luajit", "lua"], "Lua interpreter");
  runtimeEvidence = [
    {
      name: "python",
      command: pythonCmd,
      probe: probeCommand(pythonCmd)
    },
    {
      name: "lua",
      command: luaCmd,
      probe: probeCommand(luaCmd)
    }
  ];
  const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");

  console.log("Running LUASCRIPT actual-program tests...");

  for (let index = 0; index < manifest.programs.length; index += 1) {
    const program = manifest.programs[index];
    const result = results[index];
    try {
      executeProgram(program, result, pythonCmd, luaCmd, luaRuntimePath);
      result.status = "passed";
    } catch (error) {
      result.status = "failed";
      const message = sanitizeFailureMessage(error.message, error.actualProgramTempDir);
      result.failure = message;
      failures.push({ name: result.name, message });
      throw error;
    }
  }

  console.log("All LUASCRIPT actual-program tests passed.");
} catch (error) {
  fatalFailure = error;
} finally {
  writeReport(makeReport(manifest, results, runtimeEvidence, failures, fatalFailure));
}

if (fatalFailure) {
  throw fatalFailure;
}
