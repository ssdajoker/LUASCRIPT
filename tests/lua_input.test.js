"use strict";

const fs = require("fs");
const path = require("path");

const {
  repoRoot,
  findCommand,
  runCommand,
  withTempDir,
  commandSummary
} = require("./clarity_canon/runner_utils");
const {
  CoreLanguageBridge
} = require("../src/compilers");

const manifest = require("./lua_input/manifest.json");

const nodeCmd = findCommand(["node"], "Node.js");
const pythonCmd = findCommand(["python3", "python"], "Python 3");
const luaCmd = findCommand(["luajit", "lua"], "Lua interpreter");
const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");
const bridge = new CoreLanguageBridge();

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

function runLuaSource(luaSource, label) {
  return withTempDir("luascript-lua-input-lua-", (tmpDir) => {
    const luaPath = path.join(tmpDir, `${label}.lua`);
    fs.writeFileSync(luaPath, luaSource, "utf8");
    return runCommand(luaCmd, [luaPath], `${label} lua`, {
      timeout: 5000,
      env: {
        LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
  });
}

function runJavaScriptSource(jsSource, label) {
  return withTempDir("luascript-lua-input-js-", (tmpDir) => {
    const jsPath = path.join(tmpDir, `${label}.js`);
    fs.writeFileSync(jsPath, jsSource, "utf8");
    return runCommand(nodeCmd, [jsPath], `${label} javascript`, { timeout: 5000 });
  });
}

function runPythonSource(pythonSource, label) {
  return withTempDir("luascript-lua-input-python-", (tmpDir) => {
    const pythonPath = path.join(tmpDir, `${label}.py`);
    fs.writeFileSync(pythonPath, pythonSource, "utf8");
    return runCommand(pythonCmd, [pythonPath], `${label} python`, {
      timeout: 5000,
      env: {
        PYTHONIOENCODING: "utf-8"
      }
    });
  });
}

function runLuascriptSource(lsSource, label) {
  return withTempDir("luascript-lua-input-ls-", (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.ls`);
    const luaPath = path.join(tmpDir, `${label}.lua`);
    fs.writeFileSync(sourcePath, lsSource, "utf8");

    const compile = runCommand(
      pythonCmd,
      [path.join("src", "luascript_compiler.py"), "compile", sourcePath, "-o", luaPath],
      `${label} luascript compile`,
      { timeout: 10000 }
    );
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }

    const runtime = runCommand(luaCmd, [luaPath], `${label} luascript runtime`, {
      timeout: 5000,
      env: {
        LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
    return { compile, runtime };
  });
}

function assertCommandPassed(result, label) {
  if (result.status !== 0) {
    fail(`${label} failed: ${result.stderr || result.stdout}`, {
      command: commandSummary(result)
    });
  }
}

function assertOutput(result, expected, label) {
  const actual = compactOutput(result.stdout);
  if (actual !== expected) {
    fail(`${label} output mismatch. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, {
      command: commandSummary(result)
    });
  }
}

function verifyExpectedFailure(fixture, source) {
  try {
    bridge.compileToIR(source, "lua");
  } catch (error) {
    const pattern = new RegExp(fixture.expectedDiagnosticPattern, "i");
    if (!pattern.test(error.message)) {
      fail(`${fixture.name} failed with the wrong diagnostic: ${error.message}`);
    }
    return;
  }

  fail(`${fixture.name} unexpectedly passed; remove it from unsupported quarantine`);
}

function verifyRunnableFixture(fixture, source) {
  const root = bridge.compileToIR(source, "lua");

  if (!root || !Array.isArray(root.body) || root.body.length === 0) {
    fail(`${fixture.name} produced an empty canonical IR artifact`);
  }

  const luaSource = bridge.emitFromIR(root, "lua", "lua");
  const jsSource = bridge.emitFromIR(root, "javascript", "lua");
  const lsSource = bridge.emitFromIR(root, "luascript", "lua");
  const pythonSource = bridge.emitFromIR(root, "python", "lua");

  const lua = runLuaSource(luaSource, fixture.name);
  assertCommandPassed(lua, `${fixture.name} Lua target`);
  assertOutput(lua, fixture.expectedOutput, `${fixture.name} Lua target`);

  const js = runJavaScriptSource(jsSource, fixture.name);
  assertCommandPassed(js, `${fixture.name} JavaScript target`);
  assertOutput(js, fixture.expectedOutput, `${fixture.name} JavaScript target`);

  const ls = runLuascriptSource(lsSource, fixture.name);
  assertCommandPassed(ls.compile, `${fixture.name} LUASCRIPT compile`);
  assertCommandPassed(ls.runtime, `${fixture.name} LUASCRIPT runtime`);
  assertOutput(ls.runtime, fixture.expectedOutput, `${fixture.name} LUASCRIPT target`);

  const python = runPythonSource(pythonSource, fixture.name);
  assertCommandPassed(python, `${fixture.name} Python target`);
  assertOutput(python, fixture.expectedOutput, `${fixture.name} Python target`);
}

function main() {
  let passed = 0;
  let failed = 0;

  console.log(`Running Lua input ${manifest.supportSlice} qualification...`);

  for (const fixture of manifest.fixtures) {
    try {
      const sourcePath = path.join(repoRoot, fixture.source);
      const source = fs.readFileSync(sourcePath, "utf8");

      if (fixture.expectedFailure) {
        verifyExpectedFailure(fixture, source);
      } else {
        verifyRunnableFixture(fixture, source);
      }

      passed++;
      console.log(`PASS ${fixture.name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${fixture.name}: ${error.message}`);
    }
  }

  console.log(`Lua input ${manifest.supportSlice} qualification results: ${passed}/${manifest.fixtures.length} passed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
