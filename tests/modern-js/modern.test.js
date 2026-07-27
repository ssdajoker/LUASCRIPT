#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const harness = path.join(repoRoot, "tests", "language_completion", "bidirectional_harness.js");

const result = spawnSync(process.execPath, [harness, "javascript"], {
  cwd: repoRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  maxBuffer: 20 * 1024 * 1024,
  env: {
    ...process.env,
    PYTHONIOENCODING: "utf-8"
  }
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "modern JavaScript smoke failed\n");
  process.exit(result.status || 1);
}

process.stdout.write(result.stdout);
console.log("Modern JavaScript smoke passed.");

