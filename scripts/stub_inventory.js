"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "tests", "clarity_canon", "stub_inventory_manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const checkMode = process.argv.includes("--check");

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function isExcluded(relativePath) {
  const posix = toPosix(relativePath);
  if (manifest.excludePathIncludes.some(excluded => posix.includes(excluded))) {
    return true;
  }

  const ext = path.extname(relativePath).toLowerCase();
  return manifest.excludeFileExtensions.includes(ext);
}

function listFiles(entry, files = []) {
  const absolute = path.join(repoRoot, entry);
  if (!fs.existsSync(absolute)) {
    return files;
  }

  const stats = fs.statSync(absolute);
  if (stats.isFile()) {
    if (!isExcluded(entry)) {
      files.push(entry);
    }
    return files;
  }

  for (const name of fs.readdirSync(absolute)) {
    const child = path.join(entry, name);
    if (isExcluded(child)) {
      continue;
    }

    const childStats = fs.statSync(path.join(repoRoot, child));
    if (childStats.isDirectory()) {
      listFiles(child, files);
    } else if (childStats.isFile()) {
      files.push(child);
    }
  }

  return files;
}

function ruleApplies(rule, relativePath) {
  const posix = toPosix(relativePath);
  if (rule.pathIncludes && !rule.pathIncludes.some(include => posix.includes(include))) {
    return false;
  }
  if (rule.pathExcludes && rule.pathExcludes.some(exclude => posix.includes(exclude))) {
    return false;
  }
  return true;
}

function ownerAreaFor(filePath, fallback) {
  if (fallback) return fallback;
  if (filePath.startsWith("src/optimizers/")) return "optimizer";
  if (filePath.startsWith("src/parsers/")) return "parser";
  if (filePath.startsWith("src/generators/")) return "generator";
  if (filePath.startsWith("src/backends/")) return "backend";
  if (filePath.startsWith("tests/") || filePath.startsWith("test/")) return "tests";
  if (filePath.startsWith("docs/") || filePath.endsWith(".md")) return "docs";
  return "active";
}

function scanFile(relativePath) {
  const absolute = path.join(repoRoot, relativePath);
  let text;
  try {
    text = fs.readFileSync(absolute, "utf8");
  } catch {
    return [];
  }

  const lines = text.split(/\r?\n/);
  const findings = [];

  for (const rule of manifest.rules) {
    if (!ruleApplies(rule, relativePath)) {
      continue;
    }

    const regex = new RegExp(rule.pattern, "i");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!regex.test(line)) {
        continue;
      }

      findings.push({
        file: toPosix(relativePath),
        line: index + 1,
        classification: rule.classification,
        ruleId: rule.id,
        ownerArea: ownerAreaFor(toPosix(relativePath), rule.ownerArea),
        recommendedFix: rule.recommendedFix,
        text: line.trim()
      });
    }
  }

  return findings;
}

function main() {
  const files = [];
  for (const root of manifest.activeRoots) {
    listFiles(root, files);
  }

  const uniqueFiles = [...new Set(files.map(file => toPosix(file)))].sort();
  const findings = uniqueFiles.flatMap(file => scanFile(file));
  const byClass = findings.reduce((acc, finding) => {
    acc[finding.classification] = (acc[finding.classification] || 0) + 1;
    return acc;
  }, {});
  const mustFix = findings.filter(finding => finding.classification === "must-fix");

  console.log("LUASCRIPT active stub inventory");
  console.log(`Mode: ${checkMode ? "check" : "scan"}`);
  console.log(`Files scanned: ${uniqueFiles.length}`);
  console.log(`Findings: ${findings.length}`);
  for (const [classification, count] of Object.entries(byClass).sort()) {
    console.log(`  ${classification}: ${count}`);
  }

  if (findings.length > 0) {
    console.log("");
    for (const finding of findings) {
      console.log(`${finding.classification.toUpperCase()} ${finding.file}:${finding.line}`);
      console.log(`  rule: ${finding.ruleId}`);
      console.log(`  area: ${finding.ownerArea}`);
      console.log(`  text: ${finding.text}`);
      console.log(`  fix: ${finding.recommendedFix}`);
    }
  }

  if (checkMode && mustFix.length > 0) {
    console.error(`\nStub gate failed: ${mustFix.length} must-fix active stub finding(s).`);
    process.exitCode = 1;
  }
}

main();
