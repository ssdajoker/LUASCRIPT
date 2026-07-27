"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const minimumPassPercent = Number.parseFloat(process.env.BETA_MIN_PASS_PERCENT || "90");
const requireAllNative = process.argv.includes("--strict-native") || process.env.BETA_REQUIRE_ALL_NATIVE === "1";
const reportPath = path.join(repoRoot, "artifacts", "beta_readiness.json");

const implementedLanes = [
  { id: "javascript", tier: "native", manifest: "javascript.json", report: "javascript-report.json" },
  { id: "typescript", tier: "native", manifest: "typescript.json", report: "typescript-report.json" },
  { id: "luascript", tier: "native", manifest: "luascript.json", report: "luascript-report.json" },
  { id: "lua", tier: "native", manifest: "lua.json", report: "lua-report.json" },
  { id: "python", tier: "native", manifest: "python.json", report: "python-report.json" },
  { id: "csharp", tier: "native", manifest: "csharp.json", report: "csharp-report.json" },
  { id: "c", tier: "native", manifest: "c.json", report: "c-report.json" },
  { id: "cpp", tier: "native", manifest: "cpp.json", report: "cpp-report.json" },
  { id: "go_ir", tier: "target-runtime", manifest: "go.json", report: "go-report.json" },
  { id: "rust_ir", tier: "target-runtime", manifest: "rust.json", report: "rust-report.json" },
  { id: "kotlin_ir", tier: "target-runtime", manifest: "kotlin.json", report: "kotlin-report.json" },
  { id: "ruby_ir", tier: "target-runtime", manifest: "ruby_ir.json", report: "ruby_ir-report.json" },
  { id: "php_ir", tier: "target-runtime", manifest: "php_ir.json", report: "php_ir-report.json" },
  { id: "dart_ir", tier: "target-runtime", manifest: "dart_ir.json", report: "dart_ir-report.json" },
  { id: "java_ir", tier: "target-runtime", manifest: "java.json", report: "java-report.json" },
  { id: "elm_ir", tier: "target-runtime", manifest: "elm_ir.json", report: "elm_ir-report.json" },
  { id: "gleam_ir", tier: "target-runtime", manifest: "gleam_ir.json", report: "gleam_ir-report.json" }
];

const nativeRuntimeBlockers = [
  { id: "ruby_native", manifest: "ruby.json", report: "ruby-report.json", commands: ["ruby"] },
  { id: "php_native", manifest: "php.json", report: "php-report.json", commands: ["php"] },
  { id: "dart_native", manifest: "dart.json", report: "dart-report.json", commands: ["dart"] },
  { id: "java_native", manifest: "java_native.json", report: "java_native-report.json", commands: ["java", "javac"] },
  { id: "go_native", manifest: "go_native.json", report: "go_native-report.json", commands: ["go"] },
  { id: "rust_native", manifest: "rust_native.json", report: "rust_native-report.json", commands: ["rustc"] },
  { id: "kotlin_native", manifest: "kotlin_native.json", report: "kotlin_native-report.json", commands: ["kotlinc"] },
  { id: "elm_native", manifest: "elm_native.json", report: "elm_native-report.json", commands: ["elm"] },
  { id: "gleam_native", manifest: "gleam_native.json", report: "gleam_native-report.json", commands: ["gleam"] }
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function safeReadJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function manifestPath(fileName) {
  return path.join("tests", "language_completion", "manifests", fileName);
}

function reportFilePath(fileName) {
  return path.join("artifacts", "language_completion", fileName);
}

function commandExists(command) {
  const probeArgs = command === "go" ? ["version"] : (command === "kotlinc" ? ["-version"] : ["--version"]);
  const candidates = process.platform === "win32"
    ? [command, `${command}.cmd`, `${command}.bat`]
    : [command];

  for (const candidate of candidates) {
    const isCmdShim = process.platform === "win32" && /\.(cmd|bat)$/i.test(candidate);
    const result = spawnSync(isCmdShim ? "cmd.exe" : candidate, isCmdShim ? ["/c", candidate, ...probeArgs] : probeArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (!result.error && result.status === 0) {
      return true;
    }
  }
  return false;
}

function mtime(relativePath) {
  return fs.statSync(path.join(repoRoot, relativePath)).mtimeMs;
}

function evaluateImplementedLane(lane) {
  const manifestRelative = manifestPath(lane.manifest);
  const reportRelative = reportFilePath(lane.report);
  const manifest = readJson(manifestRelative);
  const report = safeReadJson(reportRelative);
  const fixtureCount = Array.isArray(manifest.fixtures) ? manifest.fixtures.length : 0;
  const expectedFailures = (manifest.fixtures || []).filter((fixture) => fixture.expectedFailure).length;

  const result = {
    id: lane.id,
    tier: lane.tier,
    language: manifest.language,
    supportSlice: manifest.supportSlice || null,
    manifest: manifestRelative,
    report: reportRelative,
    manifestStatus: manifest.status,
    fixtureCount,
    expectedFailures,
    runnableFixtures: fixtureCount - expectedFailures,
    passed: 0,
    failed: fixtureCount,
    passPercent: 0,
    betaReady: false,
    failures: []
  };

  if (manifest.status !== "qualified") {
    result.failures.push(`manifest status is ${JSON.stringify(manifest.status)}, expected "qualified"`);
  }
  if (fixtureCount === 0) {
    result.failures.push("manifest has no fixtures");
  }
  if (!Array.isArray(manifest.targets) || manifest.targets.length === 0) {
    result.failures.push("manifest has no emitted target runtimes");
  }
  if (!report) {
    result.failures.push("missing language completion report; run the matching language gate first");
    return result;
  }

  const summary = report.summary || {};
  result.passed = Number(summary.passed || 0);
  result.failed = Number(summary.failed || 0);
  result.passPercent = summary.total ? Number(((result.passed / summary.total) * 100).toFixed(2)) : 0;

  if (summary.total !== fixtureCount) {
    result.failures.push(`report fixture total ${summary.total} does not match manifest fixture count ${fixtureCount}`);
  }
  if (result.passPercent < minimumPassPercent) {
    result.failures.push(`pass percent ${result.passPercent}% is below beta threshold ${minimumPassPercent}%`);
  }
  if (mtime(reportRelative) < mtime(manifestRelative)) {
    result.failures.push("report is older than its manifest; rerun the matching language gate");
  }

  result.betaReady = result.failures.length === 0;
  return result;
}

function evaluateNativeBlocker(blocker) {
  const manifestRelative = manifestPath(blocker.manifest);
  const reportRelative = reportFilePath(blocker.report);
  const manifest = readJson(manifestRelative);
  const report = safeReadJson(reportRelative);
  const fixtureCount = Array.isArray(manifest.fixtures) ? manifest.fixtures.length : 0;
  const commandStatus = blocker.commands.map((command) => ({
    command,
    available: commandExists(command)
  }));
  const allCommandsAvailable = commandStatus.every((item) => item.available);
  const failures = [];

  if (allCommandsAvailable) {
    if (manifest.status !== "qualified") {
      failures.push(`manifest status is ${JSON.stringify(manifest.status)}, expected "qualified"`);
    }
    if (fixtureCount === 0) {
      failures.push("manifest has no fixtures");
    }
    if (!report) {
      failures.push("missing native language completion report; run the matching native language gate");
    } else {
      const summary = report.summary || {};
      const passed = Number(summary.passed || 0);
      const total = Number(summary.total || 0);
      if (total !== fixtureCount) {
        failures.push(`report fixture total ${total} does not match manifest fixture count ${fixtureCount}`);
      }
      if (passed !== total) {
        failures.push(`native report is not fully passing (${passed}/${total})`);
      }
      if (mtime(reportRelative) < mtime(manifestRelative)) {
        failures.push("native report is older than its manifest; rerun the matching native language gate");
      }
    }
  }

  return {
    id: blocker.id,
    language: manifest.language,
    supportSlice: manifest.supportSlice || null,
    manifest: manifestRelative,
    report: reportRelative,
    manifestStatus: manifest.status,
    commands: commandStatus,
    setupBlocked: !allCommandsAvailable,
    passed: report && report.summary ? Number(report.summary.passed || 0) : 0,
    total: report && report.summary ? Number(report.summary.total || 0) : fixtureCount,
    nativeReady: allCommandsAvailable && failures.length === 0,
    failures,
    failure: failures.length ? failures.join("; ") : null
  };
}

function main() {
  const pkg = readJson("package.json");
  const startedAt = Date.now();
  const lanes = implementedLanes.map(evaluateImplementedLane);
  const nativeBlockers = nativeRuntimeBlockers.map(evaluateNativeBlocker);
  const failedLanes = lanes.filter((lane) => !lane.betaReady);
  const unblockedNativeFailures = nativeBlockers.filter((blocker) => blocker.failure);
  const setupBlockedNative = nativeBlockers.filter((blocker) => blocker.setupBlocked);
  const readyPercent = Number((((lanes.length - failedLanes.length) / lanes.length) * 100).toFixed(2));
  const overallStrictReady = failedLanes.length === 0 &&
    unblockedNativeFailures.length === 0 &&
    setupBlockedNative.length === 0;

  const report = {
    schemaVersion: 1,
    kind: "luascript:beta-readiness",
    betaTarget: "pre-production beta v0.1",
    packageVersion: pkg.version,
    generatedAt: new Date().toISOString(),
    minimumPassPercent,
    summary: {
      implementedLanes: lanes.length,
      betaReadyLanes: lanes.length - failedLanes.length,
      failedLanes: failedLanes.length,
      readyPercent,
      strictNativeRequired: requireAllNative,
      overallStrictReady,
      nativeSetupBlockedLanes: nativeBlockers.filter((blocker) => blocker.setupBlocked).length,
      elapsedMs: Date.now() - startedAt
    },
    lanes,
    nativeBlockers
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("LUASCRIPT beta readiness audit");
  console.log(`Target: ${report.betaTarget}`);
  console.log(`Package version: ${pkg.version}`);
  console.log(`Threshold: ${minimumPassPercent}% fixture pass per implemented lane`);
  console.log(`Strict native requirement: ${requireAllNative ? "enabled" : "disabled"}`);
  console.log("");

  for (const lane of lanes) {
    const marker = lane.betaReady ? "PASS" : "FAIL";
    console.log(`${marker} ${lane.id}: ${lane.passPercent}% (${lane.passed}/${lane.fixtureCount}) ${lane.supportSlice}`);
    for (const failure of lane.failures) {
      console.log(`  - ${failure}`);
    }
  }

  console.log("");
  console.log("Native runtime setup blockers:");
  for (const blocker of nativeBlockers) {
    const missing = blocker.commands.filter((item) => !item.available).map((item) => item.command);
    const status = blocker.failure ? "FAIL" : (blocker.setupBlocked ? "BLOCKED" : "READY");
    const evidence = missing.length ? `missing ${missing.join(", ")}` : `runtime commands available (${blocker.passed}/${blocker.total})`;
    console.log(`${status} ${blocker.id}: ${evidence}`);
    for (const failure of blocker.failures) {
      console.log(`  - ${failure}`);
    }
  }

  console.log("");
  if (overallStrictReady) {
    console.log("Overall native-complete beta status: READY");
  } else {
    console.log("Overall native-complete beta status: NOT READY");
  }
  console.log("");
  console.log(`Readiness report: ${path.relative(repoRoot, reportPath)}`);

  if (
    failedLanes.length > 0 ||
    unblockedNativeFailures.length > 0 ||
    (requireAllNative && setupBlockedNative.length > 0)
  ) {
    process.exit(1);
  }
}

main();
