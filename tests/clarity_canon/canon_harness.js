"use strict";

const path = require("path");
const { repoRoot, runCommand } = require("./runner_utils");
const {
  writeJsonReport,
  commandSummary,
  parseCsvEnv,
  parseShard,
  hasAnyTag
} = require("./runner_utils");
const manifest = require("./manifest.json");

const reportPath = path.isAbsolute(process.env.CLARITY_CANON_REPORT || "")
  ? process.env.CLARITY_CANON_REPORT
  : path.join(repoRoot, process.env.CLARITY_CANON_REPORT || path.join("artifacts", "clarity_canon", "canon-report.json"));

const TRANSIENT_PROCESS_FAILURES = [
  /VirtualAlloc failed/i,
  /RAW: Check new_pages != nullptr failed/i,
  /spawnSync .*ETIMEDOUT/i,
  /spawnSync .*UNKNOWN/i,
  /\bETIMEDOUT\b/i,
  /\bUNKNOWN\b/i,
  /status=null/i,
  /signal=SIGTERM/i
];

function combinedOutput(result) {
  return [
    result.stdout || "",
    result.stderr || "",
    result.error ? String(result.error.message || result.error) : "",
    result.signal ? `signal=${result.signal}` : "",
    result.status === null ? "status=null" : ""
  ].filter(Boolean).join("\n").trim();
}

function isTransientProcessFailure(result) {
  return TRANSIENT_PROCESS_FAILURES.some(pattern => pattern.test(combinedOutput(result)));
}

function runCanonEntry(entry) {
  const attempts = (entry.transientRetries || manifest.transientRetries || 1) + 1;
  let result = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    result = runCommand(
      process.execPath,
      [entry.script, ...(entry.args || [])],
      entry.name || entry.script,
      { timeout: entry.timeoutMs || manifest.defaultTimeoutMs || 120000, maxBuffer: 40 * 1024 * 1024 }
    );

    if (result.status === 0 || !isTransientProcessFailure(result) || attempt === attempts) {
      return result;
    }

    console.log(`WARN transient process failure in ${entry.name || entry.script}; retrying (${attempt}/${attempts - 1})`);
  }
  return result;
}

function selectScripts() {
  const filter = process.env.CLARITY_CANON_FILTER
    ? new RegExp(process.env.CLARITY_CANON_FILTER)
    : null;
  const tags = parseCsvEnv(process.env.CLARITY_CANON_TAGS);
  const shard = parseShard(process.env.CLARITY_CANON_SHARD);

  let scripts = (manifest.strictCanonScripts || []).filter((entry) =>
    (!filter || filter.test(entry.name || "") || filter.test(entry.script || "")) &&
    hasAnyTag(entry, tags)
  );

  if (shard) {
    scripts = scripts.filter((_, index) => index % shard.total === shard.index - 1);
  }

  return {
    scripts,
    filters: {
      filter: process.env.CLARITY_CANON_FILTER || null,
      tags,
      shard
    }
  };
}

function main() {
  const startedAt = Date.now();
  const { scripts, filters } = selectScripts();
  let passed = 0;
  const failures = [];
  const results = [];

  console.log("Running unified Clarity Canon strict legacy gates...");
  console.log(`Selected scripts: ${scripts.length}/${(manifest.strictCanonScripts || []).length}`);

  if (scripts.length === 0) {
    const report = {
      schemaVersion: 1,
      kind: "clarity:canon",
      generatedAt: new Date().toISOString(),
      repoRoot,
      filters,
      summary: {
        total: 0,
        passed: 0,
        failed: 1,
        elapsedMs: Date.now() - startedAt
      },
      results: [],
      failureReason: "No canon scripts selected"
    };
    writeJsonReport(reportPath, report);
    console.error("FAIL: no canon scripts selected");
    process.exitCode = 1;
    return;
  }

  for (const entry of scripts) {
    const scriptStartedAt = Date.now();
    const result = runCanonEntry(entry);

    const combined = `${result.stdout}\n${result.stderr}`;
    const reportedFailure = /(?:Failed:\s*[1-9]|❌|ISSUES DETECTED|FAILED\s*\(|test\(s\) failed)/i.test(combined);
    const record = {
      name: entry.name || entry.script,
      script: entry.script,
      args: entry.args || [],
      tags: entry.tags || [],
      status: "failed",
      elapsedMs: Date.now() - scriptStartedAt,
      command: commandSummary(result),
      reportedFailure,
      failureReason: null
    };

    if (result.status !== 0 || reportedFailure) {
      record.failureReason = result.status !== 0
        ? `Process exited with status ${result.status}`
        : "Script output reported failed tests";
      failures.push({ entry, result, reportedFailure });
      console.error(`FAIL ${entry.name || entry.script}`);
      console.error((result.stderr || result.stdout || "").split(/\r?\n/).slice(-20).join("\n"));
    } else {
      passed++;
      record.status = "passed";
      console.log(`PASS ${entry.name || entry.script}`);
    }
    results.push(record);
  }

  const report = {
    schemaVersion: 1,
    kind: "clarity:canon",
    generatedAt: new Date().toISOString(),
    repoRoot,
    filters,
    summary: {
      total: scripts.length,
      passed,
      failed: failures.length,
      elapsedMs: Date.now() - startedAt
    },
    results
  };
  writeJsonReport(reportPath, report);

  console.log(`\nStrict canon results: ${passed}/${scripts.length} passed`);
  console.log(`Repo root: ${repoRoot}`);
  console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
