"use strict";

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function fileHash(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function hashText(value) {
  return crypto
    .createHash("sha256")
    .update(String(value || ""), "utf8")
    .digest("hex");
}

function commandVersion(command, args) {
  const result = childProcess.spawnSync(command, args, {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8"
    }
  });

  if (result.error) {
    return {
      command,
      args,
      available: false,
      error: String(result.error.message || result.error)
    };
  }

  return {
    command,
    args,
    available: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function environmentMetadata() {
  return {
    node: process.version,
    npm: commandVersion(process.platform === "win32" ? "cmd.exe" : "npm", process.platform === "win32" ? ["/c", "npm", "-v"] : ["-v"]),
    platform: process.platform,
    arch: process.arch,
    os: {
      type: os.type(),
      release: os.release()
    },
    cwd: repoRoot,
    generatedBy: "LUASCRIPT conformance report harness"
  };
}

function supportMatrixTraceability(extra = {}) {
  return {
    supportMatrix: "docs/LANGUAGE_SUPPORT_MATRIX.md",
    evidenceBinder: "docs/LUASCRIPT_CONFORMANCE_EVIDENCE_BINDER.md",
    exitCriteria: "docs/LUASCRIPT_1_0_EXIT_CRITERIA.md",
    bidirectionalityContract: "docs/LUASCRIPT_BIDIRECTIONALITY_CONTRACT.md",
    denaliLedger: "docs/LUASCRIPT_DENALI_1_0_SUMMIT_LEDGER.md",
    boundary: "Report evidence applies only to named manifest slices and does not claim source-preserving round-trip identity, ISO certification, or true omni-language 100%.",
    ...extra
  };
}

function writeJsonReport(reportPath, report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function manifestEvidence(manifestPath, manifest, fixtureNames) {
  return {
    path: relativePath(manifestPath),
    sha256: fileHash(manifestPath),
    status: manifest.status || null,
    version: manifest.version || manifest.schemaVersion || null,
    fixtureCount: fixtureNames.length,
    fixtureHashes: fixtureNames.map((name) => ({
      name,
      sha256: hashText(JSON.stringify((manifest.fixtures || manifest.cases || []).find((item) => item.name === name || item.id === name) || name))
    }))
  };
}

module.exports = {
  repoRoot,
  relativePath,
  fileHash,
  hashText,
  environmentMetadata,
  supportMatrixTraceability,
  writeJsonReport,
  manifestEvidence
};
