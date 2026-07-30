#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const releaseRoot = path.join(repoRoot, "builds", "denali");
const evidencePath = path.join(
  repoRoot,
  "artifacts",
  "release_evidence",
  "denali-release-evidence-bundle.json"
);
const packageReportPath = path.join(
  repoRoot,
  "artifacts",
  "conformance",
  "public-api-runtime-package-report.json"
);
const copiedFiles = Object.freeze([
  ["artifacts/release_evidence/denali-release-evidence-bundle.json", "evidence/denali-release-evidence-bundle.json"],
  ["artifacts/conformance/public-api-runtime-package-report.json", "evidence/public-api-runtime-package-report.json"],
  ["artifacts/conformance/denali-compatibility-matrix-report.json", "evidence/denali-compatibility-matrix-report.json"],
  ["artifacts/conformance/dual-surface-compatibility-bridge-report.json", "evidence/dual-surface-compatibility-bridge-report.json"],
  ["artifacts/conformance/roundtrip-probe-report.json", "evidence/roundtrip-probe-report.json"],
  ["artifacts/conformance/source-identity-probe-report.json", "evidence/source-identity-probe-report.json"],
  ["docs/releases/LUASCRIPT_DENALI_v1.0.1.md", "RELEASE_NOTES.md"],
  ["docs/LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md", "MIGRATION_NOTES.md"],
  ["CHANGELOG.md", "CHANGELOG.md"],
  ["package.json", "package.json"]
]);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error) {
    fail(`${command} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(
      `${command} ${args.join(" ")} failed with exit ${result.status}\n` +
      `${result.stdout || ""}${result.stderr || ""}`
    );
  }
  return (result.stdout || "").trim();
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function relativeUnix(base, filePath) {
  return path.relative(base, filePath).split(path.sep).join("/");
}

function listFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const resolved = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(resolved);
      } else if (entry.isFile()) {
        files.push(resolved);
      }
    }
  }
  visit(root);
  return files.sort((left, right) =>
    relativeUnix(root, left).localeCompare(relativeUnix(root, right))
  );
}

function assertReleaseInputs(packageJson, evidence, packageReport) {
  if (!/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
    fail(`Package version must be stable SemVer, received ${packageJson.version}`);
  }
  if (
    !packageJson.luascript ||
    packageJson.luascript.version !== packageJson.version ||
    packageJson.luascript.releaseTrack !== "stable Denali"
  ) {
    fail("package.json Denali release metadata is not aligned");
  }
  if (!evidence.summary || evidence.summary.releaseReady !== true) {
    fail("Denali release evidence is not release-ready");
  }
  if (
    !packageReport.expected ||
    !packageReport.expected.package ||
    packageReport.expected.package.version !== packageJson.version ||
    !packageReport.tarball ||
    packageReport.tarball.version !== packageJson.version ||
    !packageReport.installedConsumer ||
    !packageReport.installedConsumer.package ||
    packageReport.installedConsumer.package.version !== packageJson.version
  ) {
    fail("Package contract evidence does not match the release version");
  }
  if (
    !evidence.contentIdentity ||
    !/^[0-9a-f]{64}$/.test(evidence.contentIdentity.evidenceSetSha256 || "") ||
    !/^[0-9a-f]{64}$/.test(evidence.contentIdentity.bundlePayloadSha256 || "")
  ) {
    fail("Release evidence identities are missing or malformed");
  }
}

function releaseDirectory(version) {
  return path.join(releaseRoot, `v${version}`);
}

function verifyRelease(version) {
  const target = releaseDirectory(version);
  const manifestPath = path.join(target, "release-manifest.json");
  const checksumPath = path.join(target, "SHA256SUMS");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(checksumPath)) {
    fail(`Release manifest or checksums are missing from ${target}`);
  }

  const manifest = readJson(manifestPath);
  if (manifest.version !== version || manifest.tag !== `v${version}`) {
    fail("Release manifest identity does not match package.json");
  }
  for (const artifact of manifest.artifacts || []) {
    const absolute = path.resolve(target, artifact.path);
    if (!absolute.startsWith(`${path.resolve(target)}${path.sep}`)) {
      fail(`Manifest path escapes release folder: ${artifact.path}`);
    }
    if (!fs.existsSync(absolute)) {
      fail(`Manifest artifact is missing: ${artifact.path}`);
    }
    const stat = fs.statSync(absolute);
    if (stat.size !== artifact.sizeBytes || hashFile(absolute) !== artifact.sha256) {
      fail(`Manifest artifact failed verification: ${artifact.path}`);
    }
  }

  const checksumLines = fs.readFileSync(checksumPath, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (const line of checksumLines) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (!match) {
      fail(`Malformed SHA256SUMS line: ${line}`);
    }
    const absolute = path.resolve(target, match[2]);
    if (!absolute.startsWith(`${path.resolve(target)}${path.sep}`)) {
      fail(`Checksum path escapes release folder: ${match[2]}`);
    }
    if (!fs.existsSync(absolute) || hashFile(absolute) !== match[1]) {
      fail(`Checksum verification failed: ${match[2]}`);
    }
  }

  console.log(`Verified Denali release build: ${relativeUnix(repoRoot, target)}`);
  console.log(`Artifacts: ${(manifest.artifacts || []).length}`);
  console.log(`Commit: ${manifest.commit}`);
  return manifest;
}

function buildRelease() {
  const packageJson = readJson(path.join(repoRoot, "package.json"));
  const evidence = readJson(evidencePath);
  const packageReport = readJson(packageReportPath);
  assertReleaseInputs(packageJson, evidence, packageReport);

  const version = packageJson.version;
  const tag = `v${version}`;
  const status = run("git", ["status", "--porcelain"]);
  if (status) {
    fail("Release build requires a clean Git worktree");
  }
  const commit = run("git", ["rev-parse", "HEAD"]);
  const tagCommit = run("git", ["rev-list", "-n", "1", tag]);
  if (tagCommit !== commit) {
    fail(`${tag} does not point at the current HEAD`);
  }

  const target = releaseDirectory(version);
  if (fs.existsSync(target)) {
    fail(`Release folder already exists: ${target}`);
  }
  fs.mkdirSync(releaseRoot, { recursive: true });
  const temp = fs.mkdtempSync(path.join(releaseRoot, `.v${version}-`));

  try {
    const packOutput = run(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["pack", "--json", "--pack-destination", temp],
      { cwd: repoRoot }
    );
    const packRecords = JSON.parse(packOutput);
    if (!Array.isArray(packRecords) || packRecords.length !== 1) {
      fail("npm pack did not return exactly one package record");
    }
    const packRecord = packRecords[0];
    if (
      packRecord.name !== packageJson.name ||
      packRecord.version !== version ||
      packRecord.filename !== `${packageJson.name}-${version}.tgz`
    ) {
      fail("npm pack identity does not match the release package");
    }
    fs.writeFileSync(
      path.join(temp, "npm-pack.json"),
      `${JSON.stringify(packRecord, null, 2)}\n`,
      "utf8"
    );

    run("git", [
      "archive",
      "--format=zip",
      `--output=${path.join(temp, `luascript-denali-${tag}-source.zip`)}`,
      tag
    ]);

    for (const [sourceRelative, destinationRelative] of copiedFiles) {
      const source = path.join(repoRoot, ...sourceRelative.split("/"));
      const destination = path.join(temp, ...destinationRelative.split("/"));
      if (!fs.existsSync(source)) {
        fail(`Required release input is missing: ${sourceRelative}`);
      }
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }

    const commitEpoch = Number(run("git", ["show", "-s", "--format=%ct", commit]));
    const artifactFiles = listFiles(temp);
    const artifacts = artifactFiles.map(filePath => ({
      path: relativeUnix(temp, filePath),
      sizeBytes: fs.statSync(filePath).size,
      sha256: hashFile(filePath)
    }));
    const manifest = {
      schemaVersion: 1,
      kind: "luascript:denali-release-build",
      name: packageJson.name,
      version,
      releaseName: "Denali",
      tag,
      commit,
      sourceDateEpoch: commitEpoch,
      npmRegistryPublished: false,
      evidenceIdentity: {
        evidenceSetSha256: evidence.contentIdentity.evidenceSetSha256,
        bundlePayloadSha256: evidence.contentIdentity.bundlePayloadSha256
      },
      artifacts
    };
    fs.writeFileSync(
      path.join(temp, "release-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    );

    const checksumFiles = listFiles(temp)
      .filter(filePath => path.basename(filePath) !== "SHA256SUMS");
    const checksums = checksumFiles.map(filePath =>
      `${hashFile(filePath)}  ${relativeUnix(temp, filePath)}`
    );
    fs.writeFileSync(
      path.join(temp, "SHA256SUMS"),
      `${checksums.join("\n")}\n`,
      "utf8"
    );

    fs.renameSync(temp, target);
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }

  return verifyRelease(version);
}

function main() {
  const packageJson = readJson(path.join(repoRoot, "package.json"));
  if (process.argv.includes("--verify")) {
    verifyRelease(packageJson.version);
  } else {
    buildRelease();
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  assertReleaseInputs,
  buildRelease,
  releaseDirectory,
  verifyRelease
};
