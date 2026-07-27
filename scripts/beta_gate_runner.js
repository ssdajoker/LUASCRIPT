"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const useCmdShim = process.platform === "win32";
const npmCmd = useCmdShim ? "cmd.exe" : "npm";

const profiles = {
  preflight: [
    [
      "clarity:dogfood",
      "clarity:canon:fast"
    ],
    [
      "status:check",
      "stubs:check",
      "claims:check"
    ],
    [
      "verify"
    ]
  ],
  full: [
    [
      "clarity:dogfood",
      "clarity:canon:fast",
      "clarity:canon:legacy"
    ],
    [
      "clarity:canon:languages",
      "clarity:canon:setup-blocked",
      "clarity:canon:heavy"
    ],
    [
      "status:check",
      "stubs:check",
      "claims:check"
    ],
    [
      "verify",
      "test"
    ]
  ]
};

function reportPathFor(profile) {
  return path.join(repoRoot, "artifacts", "beta_gates", `${profile}-report.json`);
}

function relativeReportPath(profile) {
  return path.relative(repoRoot, reportPathFor(profile));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeReport(profileName, currentProfileDef, startedAt, batches, failures) {
  const report = {
    schemaVersion: 1,
    kind: "luascript:beta-gates",
    profile: profileName,
    generatedAt: new Date().toISOString(),
    summary: {
      batches: currentProfileDef.length,
      completedBatches: batches.length,
      failedScripts: failures.length,
      elapsedMs: Date.now() - startedAt
    },
    batches,
    failures
  };

  ensureDir(path.dirname(reportPathFor(profileName)));
  fs.writeFileSync(reportPathFor(profileName), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function runNpmScript(scriptName) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const args = useCmdShim ? ["/c", `npm run ${scriptName}`] : ["run", scriptName];
    const child = spawn(npmCmd, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code, signal) => {
      resolve({
        script: scriptName,
        code,
        signal,
        elapsedMs: Date.now() - startedAt,
        stdout,
        stderr
      });
    });
  });
}

function summarizeFailure(result) {
  const lines = `${result.stdout || ""}\n${result.stderr || ""}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(-20);
}

async function runBatch(batchIndex, scripts) {
  console.log(`\n== Beta batch ${batchIndex + 1}/${currentProfile.length} ==`);
  console.log(`Scripts: ${scripts.join(", ")}`);
  const results = await Promise.all(scripts.map(runNpmScript));
  return results;
}

const profile = process.argv[2] || "preflight";
const currentProfile = profiles[profile];

if (!currentProfile) {
  console.error(`Unknown beta gate profile: ${profile}`);
  process.exit(1);
}

(async function main() {
  const startedAt = Date.now();
  const batches = [];
  const failures = [];

  for (let index = 0; index < currentProfile.length; index++) {
    const scripts = currentProfile[index];
    const results = await runBatch(index, scripts);
    batches.push({
      index: index + 1,
      scripts,
      results: results.map((result) => ({
        script: result.script,
        code: result.code,
        signal: result.signal,
        elapsedMs: result.elapsedMs
      }))
    });

    for (const result of results) {
      if (result.code !== 0) {
        failures.push({
          script: result.script,
          code: result.code,
          signal: result.signal,
          elapsedMs: result.elapsedMs,
          tail: summarizeFailure(result)
        });
      }
    }

    writeReport(profile, currentProfile, startedAt, batches, failures);

    if (failures.length > 0) {
      break;
    }
  }
  writeReport(profile, currentProfile, startedAt, batches, failures);

  console.log(`\nBeta gate report: ${relativeReportPath(profile)}`);

  if (failures.length > 0) {
    console.error("Beta gate runner failed.");
    for (const failure of failures) {
      console.error(`- ${failure.script} exited with ${failure.code === null ? failure.signal : failure.code}`);
    }
    process.exit(1);
  }
})();
