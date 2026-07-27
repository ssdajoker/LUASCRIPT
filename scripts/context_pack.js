#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const docs = [
  "PROJECT_STATUS.md",
  "docs/LUASCRIPT_MEGA_PLAN.md",
  "docs/LANGUAGE_SUPPORT_MATRIX.md",
  "docs/LANGUAGE_COMPLETION_RULES.md"
];

function readFirstLines(relPath, maxLines = 80) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    return [`missing: ${relPath}`];
  }
  return fs.readFileSync(absPath, "utf8").split(/\r?\n/).slice(0, maxLines);
}

function gitStatus() {
  const result = spawnSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024
  });
  if (result.status !== 0) {
    return [`git status unavailable: ${result.stderr || result.error || "unknown error"}`];
  }
  return result.stdout.trim().split(/\r?\n/).filter(Boolean).slice(0, 120);
}

function main() {
  console.log("# LUASCRIPT Context Pack");
  console.log("");
  console.log("## Canonical Docs");
  for (const doc of docs) {
    console.log(`- ${doc}`);
  }

  for (const doc of docs) {
    console.log("");
    console.log(`## ${doc}`);
    console.log(readFirstLines(doc).join("\n"));
  }

  console.log("");
  console.log("## Git Status Sample");
  const status = gitStatus();
  if (status.length === 0) {
    console.log("clean");
  } else {
    console.log(status.join("\n"));
  }
}

if (require.main === module) {
  main();
}

