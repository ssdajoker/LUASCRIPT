#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const activeRoots = [
  "README.md",
  "PROJECT_STATUS.md",
  "CHANGELOG.md",
  "package.json",
  "docs",
  "scripts",
  "src",
  "tests"
];
const allowedDocsTopLevel = new Set([
  "BETA_RELEASE_HANDOFF_V0_1.md",
  "INDEX.md",
  "LANGUAGE_COMPLETION_RULES.md",
  "LANGUAGE_SUPPORT_MATRIX.md",
  "LUASCRIPT_BIG_REMAINING_CLIMB_MASTER_LEDGER.md",
  "LUASCRIPT_1_0_EXIT_CRITERIA.md",
  "LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md",
  "LUASCRIPT_CANONICAL_IR_SEMANTICS_INVENTORY.md",
  "LUASCRIPT_CANONICAL_IR_SEMANTICS_SPEC_V0.md",
  "LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md",
  "LUASCRIPT_CONFORMANCE_EVIDENCE_BUNDLE_INDEX.md",
  "LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md",
  "LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md",
  "LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md",
  "LUASCRIPT_DENALI_COMPATIBILITY_MATRIX.md",
  "LUASCRIPT_DENALI_RELEASE_BLOCKING_POLICY.md",
  "LUASCRIPT_DENALI_SOLOIST_LEDGER.md",
  "LUASCRIPT_LANGUAGE_ACCESSION_RULES.md",
  "LUASCRIPT_LIVING_META_LANGUAGE.md",
  "LUASCRIPT_MATHEMATICAL_NOTATION_CORE.md",
  "LUASCRIPT_MEGA_PLAN.md",
  "LUASCRIPT_META_LANGUAGE_V0.md",
  "LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md",
  "REPOCALYPSE_SYNC.md",
  "VERSIONING.md",
  "canonical_ir.schema.json",
  "canonical_ir_spec.md",
  "OLD LUASCRIPT DOCS",
  "adr",
  "architecture",
  "ir",
  "quick-start",
  "reference",
  "releases",
  "schema"
]);
const excludedParts = new Set([
  "OLD LUASCRIPT DOCS",
  "OLD&Deprecated",
  "artifacts",
  "node_modules",
  ".git",
  ".nyc_output",
  "coverage"
]);
const textExtensions = new Set([
  ".cjs",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".ts"
]);

function walk(relPath, files) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) return;

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    const parts = relPath.split(/[\\/]/).filter(Boolean);
    if (parts.some(part => excludedParts.has(part))) return;
    for (const entry of fs.readdirSync(absPath)) {
      walk(path.join(relPath, entry), files);
    }
    return;
  }

  if (textExtensions.has(path.extname(relPath))) {
    files.push(relPath);
  }
}

function isAllowedArchiveMention(relPath, line) {
  const mentionsLegacyArchive = line.includes("OLD&Deprecated");
  const mentionsCurrentArchive = line.includes("OLD LUASCRIPT DOCS");
  if (!mentionsLegacyArchive && !mentionsCurrentArchive) return true;
  if (relPath === path.join("scripts", "archive_audit.js")) return true;
  if (line.includes("ARCHIVE_MANIFEST.md")) return true;
  if (line.includes("OLD LUASCRIPT DOCS/README.md")) return true;
  if (relPath === path.join("tests", "clarity_canon", "stub_inventory_manifest.json")) return true;
  if (relPath.startsWith("docs" + path.sep) || relPath === "README.md") {
    return !/\]\([^)]*(OLD&Deprecated(?!\/ARCHIVE_MANIFEST\.md)|OLD LUASCRIPT DOCS(?!\/README\.md|\/OLD&Deprecated\/ARCHIVE_MANIFEST\.md))/.test(line);
  }
  return false;
}

function checkUniversalParserReference(failures) {
  const universalPath = path.join(repoRoot, "src", "transpiler_universal.js");
  if (!fs.existsSync(universalPath)) return;
  const source = fs.readFileSync(universalPath, "utf8");
  if (source.includes("require(\"../parser\")") || source.includes("require('../parser')")) {
    failures.push({
      file: "src/transpiler_universal.js",
      line: 1,
      reason: "legacy universal transpiler still references missing ../parser"
    });
  }
}

function parseArchiveManifest() {
  const manifestPath = path.join(repoRoot, "docs", "OLD LUASCRIPT DOCS", "OLD&Deprecated", "ARCHIVE_MANIFEST.md");
  if (!fs.existsSync(manifestPath)) return new Map();
  const rows = new Map();
  const text = fs.readFileSync(manifestPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\| `([^`]+)` \| `([^`]+)` \|/);
    if (match) {
      rows.set(match[1], match[2]);
    }
  }
  return rows;
}

function gitDeletedPaths() {
  const result = spawnSync("git", ["status", "--porcelain=v1"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .filter(line => line.startsWith(" D"))
    .map(line => line.slice(3));
}

function checkArchivedDeletions(failures) {
  const manifestRows = parseArchiveManifest();
  const relocatedActiveFiles = new Map([
    ["examples/mathematical_showcase.ls", "examples/experimental/mathematical_showcase.ls"]
  ]);
  const docsArchiveRoot = path.join("docs", "OLD LUASCRIPT DOCS");

  for (const originalPath of gitDeletedPaths()) {
    const parts = originalPath.split(/[\\/]/).filter(Boolean);
    if (parts.some(part => excludedParts.has(part))) {
      continue;
    }
    if (relocatedActiveFiles.has(originalPath)) {
      const relocated = relocatedActiveFiles.get(originalPath);
      if (!fs.existsSync(path.join(repoRoot, relocated))) {
        failures.push({
          file: originalPath,
          line: 1,
          reason: `expected relocated active file is missing: ${relocated}`
        });
      }
      continue;
    }

    const archivePath = manifestRows.get(originalPath);
    const docsArchivePath = originalPath.startsWith("docs/")
      ? path.join(docsArchiveRoot, originalPath.slice("docs/".length))
      : null;

    if (!archivePath && docsArchivePath && fs.existsSync(path.join(repoRoot, docsArchivePath))) {
      continue;
    }

    if (!archivePath) {
      failures.push({
        file: originalPath,
        line: 1,
        reason: "deleted active-path file has no archive manifest entry"
      });
      continue;
    }

    if (!fs.existsSync(path.join(repoRoot, archivePath))) {
      if (docsArchivePath && fs.existsSync(path.join(repoRoot, docsArchivePath))) {
        continue;
      }
      failures.push({
        file: originalPath,
        line: 1,
        reason: `archive manifest target is missing: ${archivePath}`
      });
    }
  }
}

function checkPackageScriptReferences(failures) {
  const packagePath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(packagePath)) return;
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  for (const [scriptName, command] of Object.entries(packageJson.scripts || {})) {
    const matches = command.matchAll(/(?:node|tsx|mocha|python(?:3)?|bash)\s+([^&|;\s]+)/g);
    for (const match of matches) {
      const candidate = match[1].replace(/^['"]|['"]$/g, "");
      if (
        candidate.startsWith("-") ||
        candidate === "-e" ||
        candidate === "-lc" ||
        candidate.includes("$(")
      ) {
        continue;
      }
      if (!/^(scripts|src|test|tests|examples|verify-|verify_|[A-Za-z0-9_.-]+\.js)/.test(candidate)) {
        continue;
      }
      const normalized = candidate.replace(/\\/g, "/");
      if (!fs.existsSync(path.join(repoRoot, normalized))) {
        failures.push({
          file: "package.json",
          line: 1,
          reason: `${scriptName} references missing path ${normalized}`
        });
      }
    }
  }
}

function checkActiveDocsSurface(failures) {
  const docsRoot = path.join(repoRoot, "docs");
  if (!fs.existsSync(docsRoot)) return;

  for (const entry of fs.readdirSync(docsRoot)) {
    if (!allowedDocsTopLevel.has(entry)) {
      failures.push({
        file: path.join("docs", entry),
        line: 1,
        reason: "unexpected live docs entry outside the active docs whitelist"
      });
    }
  }
}

function main() {
  const files = [];
  for (const root of activeRoots) {
    walk(root, files);
  }

  const failures = [];
  for (const relPath of files) {
    const text = fs.readFileSync(path.join(repoRoot, relPath), "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!isAllowedArchiveMention(relPath, line)) {
        failures.push({
          file: relPath,
          line: index + 1,
          reason: "active file points at archived content outside the archive manifest"
        });
      }
    });
  }

  checkUniversalParserReference(failures);
  checkActiveDocsSurface(failures);
  checkArchivedDeletions(failures);
  checkPackageScriptReferences(failures);

  if (failures.length > 0) {
    console.error("Archive/working-tree audit failed:");
    for (const failure of failures) {
      console.error(`- ${failure.file}:${failure.line} ${failure.reason}`);
    }
    process.exit(1);
  }

  console.log(`Archive/working-tree audit passed (${files.length} active files scanned).`);
}

if (require.main === module) {
  main();
}
