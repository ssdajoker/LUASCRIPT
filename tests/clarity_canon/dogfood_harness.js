"use strict";

const fs = require("fs");
const path = require("path");

const {
  repoRoot,
  findCommand,
  runCommand,
  withTempDir,
  writeJsonReport,
  commandSummary,
  parseCsvEnv,
  parseShard,
  hasAnyTag,
  assertIncludes,
  assertRegex,
  assertNoPlaceholderLua
} = require("./runner_utils");

const manifest = require("./manifest.json");

const pythonCmd = findCommand(["python3", "python"], "Python 3");
const luaCmd = findCommand(["luajit", "lua"], "Lua interpreter");
const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");
const reportPath = path.isAbsolute(process.env.CLARITY_DOGFOOD_REPORT || "")
  ? process.env.CLARITY_DOGFOOD_REPORT
  : path.join(repoRoot, process.env.CLARITY_DOGFOOD_REPORT || path.join("artifacts", "clarity_canon", "dogfood-report.json"));

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function copyFixture(source, tmpDir, name) {
  const sourcePath = path.join(repoRoot, source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing dogfood fixture: ${source}`);
  }

  const tempSource = path.join(tmpDir, `${name}.ls`);
  fs.copyFileSync(sourcePath, tempSource);
  return tempSource;
}

function runCompile(sourcePath, outputPath, label) {
  return runCommand(
    pythonCmd,
    [path.join("src", "luascript_compiler.py"), "compile", sourcePath, "-o", outputPath],
    `${label} compile`,
    { timeout: 10000 }
  );
}

function runLuaProgram(luaPath, label) {
  return runCommand(
    luaCmd,
    [luaPath],
    `${label} lua`,
    {
      timeout: 5000,
      env: {
        LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    }
  );
}

function verifyExpectedFailure(fixture) {
  return withTempDir("luascript-clarity-dogfood-", (tmpDir) => {
    const tempSource = copyFixture(fixture.source, tmpDir, fixture.name);
    const compiledPath = path.join(tmpDir, `${fixture.name}.lua`);
    const compile = runCompile(tempSource, compiledPath, fixture.name);
    const combinedOutput = `${compile.stdout}\n${compile.stderr}`.trim();
    const details = { compile: commandSummary(compile), runtime: null };

    if (compile.status === 0) {
      fail(`${fixture.name} unexpectedly compiled successfully; remove it from quarantine or update support status`, details);
    }

    for (const pattern of fixture.expectedFailurePatterns || []) {
      assertRegex(combinedOutput, pattern, `${fixture.name} expected failure`);
    }

    return details;
  });
}

function verifyRunnableFixture(fixture) {
  return withTempDir("luascript-clarity-dogfood-", (tmpDir) => {
    const tempSource = copyFixture(fixture.source, tmpDir, fixture.name);
    const compiledPath = path.join(tmpDir, `${fixture.name}.lua`);

    const compile = runCompile(tempSource, compiledPath, fixture.name);
    const details = { compile: commandSummary(compile), runtime: null };
    if (compile.status !== 0) {
      fail(`${fixture.name} compile failed: ${compile.stderr || compile.stdout}`, details);
    }

    const compiled = fs.readFileSync(compiledPath, "utf8");
    if (!compiled.trim()) {
      fail(`${fixture.name} compile produced empty Lua`, details);
    }
    assertNoPlaceholderLua(compiled, fixture.name);

    const result = runLuaProgram(compiledPath, fixture.name);
    details.runtime = commandSummary(result);

    if (fixture.expectedRuntimeFailure) {
      if (result.status === 0) {
        fail(`${fixture.name} unexpectedly ran successfully`, details);
      }

      const combinedOutput = `${result.stdout}\n${result.stderr}`.trim();
      for (const pattern of fixture.expectedRuntimeFailurePatterns || []) {
        assertRegex(combinedOutput, pattern, `${fixture.name} expected runtime failure`);
      }

      return details;
    }

    if (result.status !== 0) {
      fail(`${fixture.name} run failed: ${result.stderr || result.stdout}`, details);
    }

    if (Object.prototype.hasOwnProperty.call(fixture, "expectedOutputExact")) {
      if (result.stdout !== fixture.expectedOutputExact) {
        fail(`${fixture.name} output mismatch. Expected ${JSON.stringify(fixture.expectedOutputExact)}, got ${JSON.stringify(result.stdout)}`, details);
      }
    }

    const expectedOutputs = fixture.expectedOutputIncludes || [];
    
    function normalizeFloatOutput(str) {
      return str.replace(/(\d+)(\.0)(\s|\t|\n|$|,|\]|\}|\/)/g, '$1$3');
    }
    
    const normalizedOutput = normalizeFloatOutput(result.stdout);
    const matched = expectedOutputs.some(expected => 
      normalizedOutput.includes(expected) || result.stdout.includes(expected)
    );
    if (!matched) {
      throw new Error(
        `${fixture.name} output missing any of ${JSON.stringify(expectedOutputs)}. Actual output: ${JSON.stringify(result.stdout)}`
      );
    }

    return details;
  });
}

function selectFixtures() {
  const filter = process.env.CLARITY_DOGFOOD_FILTER
    ? new RegExp(process.env.CLARITY_DOGFOOD_FILTER)
    : null;
  const tags = parseCsvEnv(process.env.CLARITY_DOGFOOD_TAGS);
  const shard = parseShard(process.env.CLARITY_DOGFOOD_SHARD);

  let fixtures = (manifest.dogfoodFixtures || []).filter((fixture) =>
    (!filter || filter.test(fixture.name) || filter.test(fixture.source)) &&
    hasAnyTag(fixture, tags)
  );

  if (shard) {
    fixtures = fixtures.filter((_, index) => index % shard.total === shard.index - 1);
  }

  return { fixtures, filters: { filter: process.env.CLARITY_DOGFOOD_FILTER || null, tags, shard } };
}

function runFixture(fixture) {
  const startedAt = Date.now();
  const record = {
    name: fixture.name,
    source: fixture.source,
    tags: fixture.tags || [],
    expectedFailure: Boolean(fixture.expectedFailure),
    expectedRuntimeFailure: Boolean(fixture.expectedRuntimeFailure),
    compile: null,
    runtime: null,
    status: "failed",
    elapsedMs: 0,
    failureReason: null
  };

  try {
    const details = fixture.expectedFailure
      ? verifyExpectedFailure(fixture)
      : verifyRunnableFixture(fixture);
    record.compile = details.compile;
    record.runtime = details.runtime;
    record.status = "passed";
  } catch (error) {
    if (error.details) {
      record.compile = error.details.compile || null;
      record.runtime = error.details.runtime || null;
    }
    record.failureReason = error.message;
  } finally {
    record.elapsedMs = Date.now() - startedAt;
  }

  return record;
}

function main() {
  const startedAt = Date.now();
  const { fixtures, filters } = selectFixtures();
  let passed = 0;
  const results = [];

  console.log("Running unified Clarity Canon live dogfood harness...");
  console.log(`Selected fixtures: ${fixtures.length}/${(manifest.dogfoodFixtures || []).length}`);

  if (fixtures.length === 0) {
    const report = {
      schemaVersion: 1,
      kind: "clarity:dogfood",
      generatedAt: new Date().toISOString(),
      repoRoot,
      filters,
      summary: { total: 0, passed: 0, failed: 1, elapsedMs: Date.now() - startedAt },
      results: [],
      failureReason: "No dogfood fixtures selected"
    };
    writeJsonReport(reportPath, report);
    console.error("FAIL: no dogfood fixtures selected");
    process.exitCode = 1;
    return;
  }

  for (const fixture of fixtures) {
    const result = runFixture(fixture);
    results.push(result);
    if (result.status === "passed") {
      passed++;
      console.log(`PASS ${fixture.expectedFailure ? "quarantine" : "dogfood"}: ${fixture.name}`);
    } else {
      console.error(`FAIL ${fixture.name}: ${result.failureReason}`);
    }
  }

  const failures = results.filter(result => result.status !== "passed");
  const report = {
    schemaVersion: 1,
    kind: "clarity:dogfood",
    generatedAt: new Date().toISOString(),
    repoRoot,
    filters,
    summary: {
      total: fixtures.length,
      passed,
      failed: failures.length,
      elapsedMs: Date.now() - startedAt
    },
    results
  };
  writeJsonReport(reportPath, report);

  console.log(`\nDogfood results: ${passed}/${fixtures.length} passed`);
  console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
