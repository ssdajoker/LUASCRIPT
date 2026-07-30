"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const reportRelativePath =
  "artifacts/conformance/denali-compatibility-matrix-report.json";
const reportPath = path.join(repoRoot, reportRelativePath);
const runtimeProbeTimeoutMs = 7000;

const expectedNodeEngine = ">=14.17.0";
const expectedProductionDependencies = {
  acorn: "^8.15.0",
  esprima: "^4.0.1",
  luaparse: "^0.3.1",
  typescript: "5.9.3"
};

const expectedLanes = [
  {
    npmScript: "language:javascript:bidirectional",
    id: "javascript",
    sourceTools: ["node"]
  },
  {
    npmScript: "language:typescript:bidirectional",
    id: "typescript",
    sourceTools: ["node"]
  },
  {
    npmScript: "language:luascript:bidirectional",
    id: "luascript",
    sourceTools: ["python", "lua"]
  },
  {
    npmScript: "language:lua:bidirectional",
    id: "lua",
    sourceTools: ["lua"]
  },
  {
    npmScript: "language:python:bidirectional",
    id: "python",
    sourceTools: ["python"]
  },
  {
    npmScript: "language:csharp:bidirectional",
    id: "csharp",
    sourceTools: ["csharp"]
  },
  {
    npmScript: "language:c:bidirectional",
    id: "c",
    sourceTools: ["c"]
  },
  {
    npmScript: "language:cpp:bidirectional",
    id: "cpp",
    sourceTools: ["cpp"]
  },
  {
    npmScript: "language:java:bidirectional",
    id: "java_native",
    sourceTools: ["javac", "java"]
  },
  {
    npmScript: "language:rust:bidirectional",
    id: "rust_native",
    sourceTools: ["rust"]
  },
  {
    npmScript: "language:ruby:bidirectional",
    id: "ruby",
    sourceTools: ["ruby"]
  },
  {
    npmScript: "language:php:bidirectional",
    id: "php",
    sourceTools: ["php"]
  },
  {
    npmScript: "language:dart:bidirectional",
    id: "dart",
    sourceTools: ["dart"]
  },
  {
    npmScript: "language:go:bidirectional",
    id: "go_native",
    sourceTools: ["go"]
  },
  {
    npmScript: "language:kotlin:bidirectional",
    id: "kotlin_native",
    sourceTools: ["kotlin", "java"]
  },
  {
    npmScript: "language:elm:bidirectional",
    id: "elm_native",
    sourceTools: ["elm", "node"]
  },
  {
    npmScript: "language:gleam:bidirectional",
    id: "gleam_native",
    sourceTools: ["gleam"]
  }
];

const targetTools = {
  lua: ["lua"],
  javascript: ["node"],
  luascript: ["python", "lua"],
  python: ["python"],
  csharp: ["csharp"],
  c: ["c"],
  cpp: ["cpp"]
};

const documentationPaths = [
  "docs/LANGUAGE_SUPPORT_MATRIX.md",
  "docs/LANGUAGE_COMPLETION_RULES.md",
  "docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md",
  "docs/LUASCRIPT_DENALI_PACKAGE_MIGRATION_NOTES.md"
];

const boundManifestSpecs = [
  {
    id: "actual-programs",
    path: "tests/actual_programs/manifest.json",
    collections: [{ field: "programs", identity: "name" }]
  },
  {
    id: "lua-input",
    path: "tests/lua_input/manifest.json",
    collections: [{ field: "fixtures", identity: "name" }]
  },
  {
    id: "roundtrip",
    path: "tests/roundtrip/manifest.json",
    collections: [{ field: "fixtures", identity: "name" }]
  },
  {
    id: "source-identity",
    path: "tests/roundtrip/source_identity_manifest.json",
    collections: [{ field: "fixtures", identity: "name" }]
  },
  {
    id: "conformance",
    path: "tests/conformance/manifest.json",
    collections: [{ field: "fixtures", identity: "name" }]
  },
  {
    id: "edge-matrix",
    path: "tests/edge_matrix/manifest.json",
    collections: [{ field: "cases", identity: "id" }]
  },
  {
    id: "clarity-canon",
    path: "tests/clarity_canon/manifest.json",
    collections: [
      { field: "dogfoodFixtures", identity: "name" },
      { field: "strictCanonScripts", identity: "name" }
    ]
  },
  {
    id: "language-qualification",
    path: "tests/clarity_canon/language_qualification_manifest.json",
    collections: [{ field: "languages", identity: "language" }],
    verifyNpmScripts: true
  },
  {
    id: "stub-inventory",
    path: "tests/clarity_canon/stub_inventory_manifest.json",
    collections: [
      { field: "activeRoots", identity: null, pathValues: true },
      { field: "rules", identity: "id" }
    ]
  }
];

const releaseSchemaPaths = {
  latest: "docs/canonical_ir.schema.json",
  pinned: "docs/schema/1.0.0/canonical_ir.schema.json",
  majorAlias: "docs/schema/1.x/canonical_ir.schema.json"
};

const releaseReportSpecs = [
  {
    id: "schema-artifact-mapping",
    path: "artifacts/conformance/schema-artifact-mapping-report.json",
    kind: "luascript:schema-artifact-mapping"
  },
  {
    id: "dual-surface-compatibility-bridge",
    path: "artifacts/conformance/dual-surface-compatibility-bridge-report.json",
    kind: "luascript:dual-surface-compatibility-bridge"
  }
];

const setupNotes = {
  node:
    "Install a Node.js release satisfying package.json engines.node (>=14.17.0) and make node available on PATH.",
  python:
    "Install Python 3 and expose python3 or python on PATH; LUASCRIPT compilation uses src/luascript_compiler.py.",
  lua:
    "Install LuaJIT or Lua and expose luajit or lua on PATH; emitted Lua and .ls execution depend on it.",
  c:
    "Set CC or install clang, gcc, or cc. The harness can also use its existing bundled .NET Emscripten clang fallback.",
  cpp:
    "Set CXX or install clang++, g++, or c++. The harness can also use its existing bundled .NET Emscripten clang++ fallback.",
  csharp:
    "Install a .NET SDK and expose dotnet on PATH. Version visibility does not by itself prove the net9.0 lane can build.",
  java:
    "Install a JRE/JDK that exposes java on PATH.",
  javac:
    "Install a JDK that exposes javac on PATH; a Java runtime alone is insufficient.",
  go: "Install the Go toolchain and expose go on PATH.",
  kotlin:
    "Install the Kotlin compiler and expose kotlinc or kotlinc.cmd on PATH; Kotlin execution also requires Java.",
  ruby: "Install Ruby and expose ruby on PATH.",
  php: "Install PHP CLI and expose php on PATH.",
  rust: "Install Rust and expose rustc on PATH.",
  dart: "Install the Dart SDK and expose dart on PATH.",
  elm:
    "Install Elm and expose elm on PATH; compiled Elm JavaScript execution also requires Node.js.",
  gleam:
    "Install Gleam and expose gleam on PATH. Gleam project/package and Erlang availability remain outside this version-only probe."
};

function normalizeOutput(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function normalizeRepoPath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "");
}

function hashBuffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashFile(absolutePath) {
  return hashBuffer(fs.readFileSync(absolutePath));
}

function entrySha256(value) {
  return hashBuffer(Buffer.from(JSON.stringify(value), "utf8"));
}

function repoAbsolutePath(relativePath) {
  const normalized = normalizeRepoPath(relativePath);
  const absolute = path.resolve(repoRoot, normalized);
  const relative = path.relative(repoRoot, absolute);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return absolute;
}

function fileEvidence(relativePath) {
  const normalized = normalizeRepoPath(relativePath);
  const absolute = repoAbsolutePath(normalized);
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) {
    throw new Error(`Expected a file: ${normalized}`);
  }
  return {
    path: normalized,
    sha256: hashFile(absolute),
    sizeBytes: stat.size
  };
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoAbsolutePath(relativePath), "utf8"));
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

function sameJson(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function withoutTopLevelId(value) {
  const clone = JSON.parse(JSON.stringify(value));
  delete clone.$id;
  return clone;
}

function versionAtLeast(actual, minimum) {
  const actualMatch = String(actual).match(/^v?(\d+)\.(\d+)\.(\d+)/);
  const minimumMatch = String(minimum).match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!actualMatch || !minimumMatch) return false;
  for (let index = 1; index <= 3; index += 1) {
    const actualPart = Number(actualMatch[index]);
    const minimumPart = Number(minimumMatch[index]);
    if (actualPart > minimumPart) return true;
    if (actualPart < minimumPart) return false;
  }
  return true;
}

function commandInvocation(command, args) {
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(command)) {
    return { command: "cmd.exe", args: ["/c", command, ...args] };
  }
  return { command, args };
}

function commandProbeArgs(command) {
  const executable = path
    .basename(command)
    .toLowerCase()
    .replace(/\.(exe|cmd|bat)$/, "");
  if (executable === "go") return [["version"]];
  if (executable === "kotlinc") return [["-version"]];
  return [["--version"], ["-v"]];
}

function runProbe(command, args) {
  const invocation = commandInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: runtimeProbeTimeoutMs,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
    env: {
      ...process.env,
      NO_COLOR: "1",
      PYTHONIOENCODING: "utf-8"
    }
  });
  return {
    args,
    invocation: {
      command: invocation.command,
      args: invocation.args
    },
    status: result.status,
    signal: result.signal,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    error: result.error ? String(result.error.message || result.error) : null
  };
}

const reportedRuntimeProbeCache = new Map();

function replayReportedRuntimeProbe(command, args) {
  const key = JSON.stringify([command, args]);
  if (!reportedRuntimeProbeCache.has(key)) {
    reportedRuntimeProbeCache.set(key, runProbe(command, args));
  }
  return reportedRuntimeProbeCache.get(key);
}

function bundledDotnetClangExecutable(executableName) {
  const dotnetPackRoot = path.join(
    "C:",
    "Program Files",
    "dotnet",
    "packs",
    "Microsoft.NET.Runtime.Emscripten.3.1.56.Sdk.win-x64"
  );
  if (!fs.existsSync(dotnetPackRoot)) return null;
  const versions = fs.readdirSync(dotnetPackRoot).sort().reverse();
  for (const version of versions) {
    const candidate = path.join(
      dotnetPackRoot,
      version,
      "tools",
      "bin",
      executableName
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function runtimeSpecifications() {
  return [
    { name: "node", label: "Node.js", candidates: ["node"] },
    {
      name: "python",
      label: "Python 3",
      candidates: ["python3", "python"]
    },
    {
      name: "lua",
      label: "Lua interpreter",
      candidates: ["luajit", "lua"]
    },
    {
      name: "c",
      label: "C compiler",
      candidates: [
        process.env.CC,
        "clang",
        "gcc",
        "cc",
        bundledDotnetClangExecutable("clang.exe")
      ].filter(Boolean)
    },
    {
      name: "cpp",
      label: "C++ compiler",
      candidates: [
        process.env.CXX,
        "clang++",
        "g++",
        "c++",
        bundledDotnetClangExecutable("clang++.exe")
      ].filter(Boolean)
    },
    {
      name: "csharp",
      label: ".NET SDK",
      candidates: ["dotnet"]
    },
    { name: "java", label: "Java runtime", candidates: ["java"] },
    { name: "javac", label: "Java compiler", candidates: ["javac"] },
    { name: "go", label: "Go toolchain", candidates: ["go"] },
    {
      name: "kotlin",
      label: "Kotlin compiler",
      candidates: ["kotlinc", "kotlinc.cmd"]
    },
    { name: "ruby", label: "Ruby runtime", candidates: ["ruby"] },
    { name: "php", label: "PHP runtime", candidates: ["php"] },
    { name: "rust", label: "Rust compiler", candidates: ["rustc"] },
    { name: "dart", label: "Dart runtime", candidates: ["dart"] },
    { name: "elm", label: "Elm runtime", candidates: ["elm"] },
    { name: "gleam", label: "Gleam runtime", candidates: ["gleam"] }
  ];
}

function resolveExecutablePath(command) {
  if (path.isAbsolute(command) && fs.existsSync(command)) {
    return {
      executablePath: path.resolve(command),
      resolution: {
        method: "absolute-path",
        status: 0,
        stdout: path.resolve(command),
        stderr: "",
        error: null
      }
    };
  }

  const locator = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(locator, [command], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: runtimeProbeTimeoutMs,
    maxBuffer: 1024 * 1024,
    windowsHide: true
  });
  const lines = normalizeOutput(result.stdout)
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
  return {
    executablePath: lines[0] || null,
    resolution: {
      method: locator,
      status: result.status,
      stdout: normalizeOutput(result.stdout),
      stderr: normalizeOutput(result.stderr),
      error: result.error ? String(result.error.message || result.error) : null
    }
  };
}

function probeRuntime(specification) {
  const attempts = [];

  function tryCandidate(command, source) {
    for (const args of commandProbeArgs(command)) {
      const probe = runProbe(command, args);
      attempts.push({ command, source, probe });
      if (probe.status === 0 && !probe.error) {
        const resolved = resolveExecutablePath(command);
        const versionOutput =
          normalizeOutput(`${probe.stdout}\n${probe.stderr}`)
            .split("\n")
            .filter(Boolean)[0] || null;
        return {
          available: true,
          selected: {
            command,
            source,
            executablePath: resolved.executablePath,
            versionOutput,
            probe,
            resolution: resolved.resolution
          }
        };
      }
    }
    return null;
  }

  for (const candidate of specification.candidates) {
    const selected = tryCandidate(candidate, "candidate-order");
    if (selected) {
      return {
        name: specification.name,
        label: specification.label,
        candidates: specification.candidates,
        fallbackRoot: ".tools",
        setupNote: setupNotes[specification.name],
        attempts,
        ...selected
      };
    }
  }

  const toolsDirectory = path.join(repoRoot, ".tools");
  const searchedFallbacks = [];
  if (fs.existsSync(toolsDirectory)) {
    for (const subdirectory of fs.readdirSync(toolsDirectory)) {
      const toolPath = path.join(toolsDirectory, subdirectory);
      if (!fs.statSync(toolPath).isDirectory()) continue;
      for (const candidate of specification.candidates) {
        const suffix = process.platform === "win32" ? ".exe" : "";
        const rootCandidate = path.join(toolPath, `${candidate}${suffix}`);
        searchedFallbacks.push(rootCandidate);
        if (fs.existsSync(rootCandidate)) {
          const selected = tryCandidate(rootCandidate, `.tools/${subdirectory}`);
          if (selected) {
            return {
              name: specification.name,
              label: specification.label,
              candidates: specification.candidates,
              fallbackRoot: ".tools",
              searchedFallbacks,
              setupNote: setupNotes[specification.name],
              attempts,
              ...selected
            };
          }
        }

        const binDirectory = path.join(toolPath, "bin");
        if (fs.existsSync(binDirectory)) {
          const binCandidate = path.join(binDirectory, `${candidate}${suffix}`);
          searchedFallbacks.push(binCandidate);
          if (fs.existsSync(binCandidate)) {
            const selected = tryCandidate(
              binCandidate,
              `.tools/${subdirectory}/bin`
            );
            if (selected) {
              return {
                name: specification.name,
                label: specification.label,
                candidates: specification.candidates,
                fallbackRoot: ".tools",
                searchedFallbacks,
                setupNote: setupNotes[specification.name],
                attempts,
                ...selected
              };
            }
          }
        }
      }
    }
  }

  return {
    name: specification.name,
    label: specification.label,
    candidates: specification.candidates,
    fallbackRoot: ".tools",
    searchedFallbacks,
    setupNote: setupNotes[specification.name],
    attempts,
    available: false,
    selected: null
  };
}

function npmCliPath() {
  const candidates = [
    process.env.npm_execpath,
    path.join(
      path.dirname(process.execPath),
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js"
    )
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function quoteCmdArgument(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function probeNpmVersion() {
  const options = {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: runtimeProbeTimeoutMs,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    env: {
      ...process.env,
      NO_COLOR: "1",
      npm_config_color: "false"
    }
  };
  const cliPath = npmCliPath();
  let result;
  let command;
  if (cliPath) {
    command = [process.execPath, cliPath, "--version"];
    result = spawnSync(process.execPath, [cliPath, "--version"], options);
  } else if (process.platform === "win32") {
    const comspec = process.env.ComSpec || process.env.COMSPEC || "cmd.exe";
    const npmCommand = path.join(path.dirname(process.execPath), "npm.cmd");
    const commandLine = [npmCommand, "--version"]
      .map(quoteCmdArgument)
      .join(" ");
    command = [comspec, "/d", "/s", "/c", commandLine];
    result = spawnSync(
      comspec,
      ["/d", "/s", "/c", commandLine],
      options
    );
  } else {
    command = ["npm", "--version"];
    result = spawnSync("npm", ["--version"], options);
  }
  return {
    command,
    status: result.status,
    signal: result.signal,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    error: result.error ? String(result.error.message || result.error) : null
  };
}

function collectPathHashRecords(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectPathHashRecords(item, output);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  if (
    typeof value.path === "string" &&
    typeof value.sha256 === "string"
  ) {
    output.push({ path: normalizeRepoPath(value.path), sha256: value.sha256 });
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      collectPathHashRecords(nested, output);
    }
  }
  return output;
}

function validatePathHashRecords(records) {
  const issues = [];
  for (const record of records) {
    try {
      const live = fileEvidence(record.path);
      if (live.sha256 !== record.sha256) {
        issues.push(
          `${record.path} hash is stale: report ${record.sha256}, live ${live.sha256}`
        );
      }
    } catch (error) {
      issues.push(`${record.path}: ${error.message}`);
    }
  }
  return issues;
}

function collectFailedCounters(value, currentPath = "$", output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectFailedCounters(item, `${currentPath}[${index}]`, output)
    );
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = `${currentPath}.${key}`;
    if (key === "failed" && typeof nested === "number" && nested !== 0) {
      output.push({ path: nestedPath, value: nested });
    }
    if (nested && typeof nested === "object") {
      collectFailedCounters(nested, nestedPath, output);
    }
  }
  return output;
}

function collectNpmScriptReferences(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach(item => collectNpmScriptReferences(item, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, nested] of Object.entries(value)) {
    if (key === "npmScript" && typeof nested === "string") {
      output.push(nested);
    } else if (nested && typeof nested === "object") {
      collectNpmScriptReferences(nested, output);
    }
  }
  return output;
}

function looksLikeRepoFile(value) {
  if (typeof value !== "string") return false;
  return /^(?:tests?|src|docs|examples|scripts|runtime)\//.test(
    normalizeRepoPath(value)
  );
}

function sourceEvidenceForEntry(entry) {
  if (!entry || typeof entry !== "object") return [];
  const records = [];
  for (const key of ["sourcePath", "script", "source"]) {
    if (typeof entry[key] !== "string") continue;
    const value = entry[key];
    const isFile = key !== "source" || looksLikeRepoFile(value);
    if (isFile) {
      records.push({
        field: key,
        kind: "file",
        ...fileEvidence(value)
      });
    } else {
      records.push({
        field: key,
        kind: "inline",
        sha256: hashBuffer(Buffer.from(value, "utf8")),
        sizeBytes: Buffer.byteLength(value, "utf8")
      });
    }
  }
  return records;
}

function verifyBoundManifest(specification, packageJson) {
  const issues = [];
  let manifest = null;
  let manifestEvidence = null;
  const collections = [];
  try {
    manifest = readJson(specification.path);
    manifestEvidence = fileEvidence(specification.path);
  } catch (error) {
    issues.push(error.message);
    return {
      id: specification.id,
      path: specification.path,
      manifest: manifestEvidence,
      collections,
      issues
    };
  }

  for (const collectionSpec of specification.collections) {
    const values = manifest[collectionSpec.field];
    const collectionRecord = {
      field: collectionSpec.field,
      count: Array.isArray(values) ? values.length : 0,
      identities: [],
      entries: []
    };
    collections.push(collectionRecord);
    if (!Array.isArray(values)) {
      issues.push(`${specification.path}.${collectionSpec.field} is not an array`);
      continue;
    }
    if (values.length === 0) {
      issues.push(`${specification.path}.${collectionSpec.field} is empty`);
    }

    const identities = new Set();
    values.forEach((entry, index) => {
      let identity;
      if (collectionSpec.pathValues) {
        identity = typeof entry === "string" ? entry : null;
      } else {
        identity =
          entry && typeof entry === "object"
            ? entry[collectionSpec.identity]
            : null;
      }
      if (typeof identity !== "string" || identity.length === 0) {
        issues.push(
          `${specification.path}.${collectionSpec.field}[${index}] lacks identity ${collectionSpec.identity || "path value"}`
        );
        identity = `INVALID-${index}`;
      }
      if (identities.has(identity)) {
        issues.push(
          `${specification.path}.${collectionSpec.field} duplicates identity ${identity}`
        );
      }
      identities.add(identity);
      collectionRecord.identities.push(identity);

      const entryRecord = {
        identity,
        identityKey: `${specification.id}:${collectionSpec.field}:${identity}`,
        entrySha256: entrySha256(entry),
        sources: []
      };
      if (collectionSpec.pathValues) {
        try {
          const absolute = repoAbsolutePath(entry);
          const stat = fs.statSync(absolute);
          entryRecord.sources.push({
            field: collectionSpec.field,
            kind: stat.isFile() ? "file" : "directory",
            path: normalizeRepoPath(entry),
            sha256: stat.isFile() ? hashFile(absolute) : null,
            sizeBytes: stat.isFile() ? stat.size : null
          });
        } catch (error) {
          issues.push(`${specification.path} active root ${identity}: ${error.message}`);
        }
      } else {
        try {
          entryRecord.sources = sourceEvidenceForEntry(entry);
        } catch (error) {
          issues.push(
            `${specification.path}.${collectionSpec.field}[${index}] ${identity}: ${error.message}`
          );
        }
      }
      collectionRecord.entries.push(entryRecord);
    });
  }

  if (specification.verifyNpmScripts) {
    const references = [...new Set(collectNpmScriptReferences(manifest))];
    const missing = references.filter(
      scriptName =>
        !packageJson.scripts ||
        typeof packageJson.scripts[scriptName] !== "string"
    );
    collections.push({
      field: "npmScriptReferences",
      count: references.length,
      identities: references,
      missing
    });
    if (missing.length > 0) {
      issues.push(`missing package.json scripts: ${missing.join(", ")}`);
    }
  }

  return {
    id: specification.id,
    path: specification.path,
    manifest: manifestEvidence,
    collections,
    issues
  };
}

function requiredToolsForLane(lane, manifest) {
  const required = new Set(lane.sourceTools);
  const targets = new Set(Array.isArray(manifest.targets) ? manifest.targets : []);
  for (const fixture of manifest.fixtures || []) {
    for (const target of fixture.targets || []) targets.add(target);
  }
  for (const target of targets) {
    for (const tool of targetTools[target] || []) required.add(tool);
  }
  return {
    sourceTools: lane.sourceTools,
    targets: [...targets],
    all: [...required]
  };
}

function currentRuntimeTimeoutMs() {
  const configured = Number.parseInt(
    process.env.LANGUAGE_RUNTIME_TIMEOUT_MS || "15000",
    10
  );
  return Number.isFinite(configured) && configured > 0 ? configured : 15000;
}

function validateLanguageReportV2(
  report,
  reportRelative,
  manifest,
  manifestEvidence,
  fixtureEvidence,
  requiredTools,
  runtimeByName
) {
  const issues = [];
  if (report.schemaVersion !== 2) {
    issues.push(
      `${reportRelative} schemaVersion is ${JSON.stringify(report.schemaVersion)}; exact v2 provenance is required`
    );
    return issues;
  }
  if (report.kind !== "language:bidirectional") {
    issues.push(`unexpected kind ${JSON.stringify(report.kind)}`);
  }
  if (report.language !== manifest.language) {
    issues.push(
      `language mismatch: report ${JSON.stringify(report.language)}, manifest ${JSON.stringify(manifest.language)}`
    );
  }
  if (report.supportSlice !== manifest.supportSlice) {
    issues.push("supportSlice does not match the live manifest");
  }
  if (
    !report.summary ||
    report.summary.total !== fixtureEvidence.length ||
    report.summary.passed !== fixtureEvidence.length ||
    report.summary.failed !== 0
  ) {
    issues.push("summary does not prove every live manifest fixture passed");
  }
  if (!Array.isArray(report.results) || report.results.length !== fixtureEvidence.length) {
    issues.push("results do not have one entry per live manifest fixture");
  } else {
    fixtureEvidence.forEach((fixture, index) => {
      const result = report.results[index];
      if (
        !result ||
        result.name !== fixture.name ||
        normalizeRepoPath(result.source || "") !== fixture.source ||
        result.sourceSha256 !== fixture.sourceSha256 ||
        result.status !== "passed"
      ) {
        issues.push(
          `results[${index}] does not match live fixture ${fixture.name}`
        );
      }
    });
  }

  const reportManifest = report.manifest;
  const manifestVersion =
    manifest.version !== undefined
      ? manifest.version
      : manifest.schemaVersion !== undefined
        ? manifest.schemaVersion
        : null;
  if (!reportManifest || typeof reportManifest !== "object") {
    issues.push("manifest provenance object is missing");
  } else {
    if (
      normalizeRepoPath(reportManifest.path || "") !== manifestEvidence.path ||
      reportManifest.sha256 !== manifestEvidence.sha256 ||
      reportManifest.status !== manifest.status ||
      reportManifest.version !== manifestVersion ||
      reportManifest.supportSlice !== manifest.supportSlice ||
      reportManifest.fixtureCount !== fixtureEvidence.length
    ) {
      issues.push("manifest provenance header does not match the live manifest");
    }
    if (
      !Array.isArray(reportManifest.fixtures) ||
      reportManifest.fixtures.length !== fixtureEvidence.length
    ) {
      issues.push("manifest fixture provenance is incomplete");
    } else {
      fixtureEvidence.forEach((fixture, index) => {
        const reported = reportManifest.fixtures[index];
        if (
          !reported ||
          reported.name !== fixture.name ||
          normalizeRepoPath(reported.source || "") !== fixture.source ||
          reported.manifestEntrySha256 !== fixture.manifestEntrySha256 ||
          reported.sourceSha256 !== fixture.sourceSha256 ||
          reported.sizeBytes !== fixture.sizeBytes
        ) {
          issues.push(
            `manifest.fixtures[${index}] does not match live fixture ${fixture.name}`
          );
        }
      });
    }
  }

  const implementationEvidence = Array.isArray(report.implementationEvidence)
    ? report.implementationEvidence
    : [];
  if (implementationEvidence.length === 0) {
    issues.push("implementationEvidence is missing or empty");
  } else {
    issues.push(...validatePathHashRecords(implementationEvidence));
    if (
      !implementationEvidence.some(
        record =>
          normalizeRepoPath(record.path || "") ===
          "tests/language_completion/bidirectional_harness.js"
      )
    ) {
      issues.push("implementationEvidence does not bind the bidirectional harness");
    }
  }

  const traceabilityRecords = collectPathHashRecords(
    report.supportMatrixTraceability
  );
  if (traceabilityRecords.length === 0) {
    issues.push("supportMatrixTraceability has no path/hash records");
  } else {
    issues.push(...validatePathHashRecords(traceabilityRecords));
    for (const requiredPath of [
      "docs/LANGUAGE_SUPPORT_MATRIX.md",
      "docs/LANGUAGE_COMPLETION_RULES.md"
    ]) {
      if (!traceabilityRecords.some(record => record.path === requiredPath)) {
        issues.push(`supportMatrixTraceability does not bind ${requiredPath}`);
      }
    }
  }

  const expectedEnvironment = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    os: {
      type: os.type(),
      release: os.release()
    },
    cwd: repoRoot,
    runtimeTimeoutMs: currentRuntimeTimeoutMs()
  };
  const actualEnvironment = report.environment;
  if (
    !actualEnvironment ||
    actualEnvironment.node !== expectedEnvironment.node ||
    actualEnvironment.platform !== expectedEnvironment.platform ||
    actualEnvironment.arch !== expectedEnvironment.arch ||
    !actualEnvironment.os ||
    actualEnvironment.os.type !== expectedEnvironment.os.type ||
    actualEnvironment.os.release !== expectedEnvironment.os.release ||
    path.resolve(actualEnvironment.cwd || ".") !== expectedEnvironment.cwd ||
    actualEnvironment.runtimeTimeoutMs !== expectedEnvironment.runtimeTimeoutMs
  ) {
    issues.push("environment provenance does not match the current host and harness timeout");
  }

  const runtimeEvidence = Array.isArray(report.runtimeEvidence)
    ? report.runtimeEvidence
    : [];
  for (const toolName of requiredTools.all) {
    const current = runtimeByName[toolName];
    const reported = runtimeEvidence.find(record => record.name === toolName);
    if (!reported) {
      issues.push(`runtimeEvidence is missing ${toolName}`);
      continue;
    }
    if (!current || !current.available || !current.selected) {
      issues.push(`current runtime ${toolName} is unavailable`);
      continue;
    }
    const reportedProbe = reported.probe || {};
    const reportedArgs = reportedProbe.args;
    if (
      typeof reported.command !== "string" ||
      !Array.isArray(reportedArgs) ||
      reportedArgs.some(argument => typeof argument !== "string")
    ) {
      issues.push(`runtimeEvidence for ${toolName} has an invalid command or args`);
      continue;
    }
    const liveReportedProbe = replayReportedRuntimeProbe(
      reported.command,
      reportedArgs
    );
    if (
      reported.command !== current.selected.command ||
      reportedProbe.status !== 0 ||
      reportedProbe.error ||
      reportedProbe.status !== liveReportedProbe.status ||
      reportedProbe.signal !== liveReportedProbe.signal ||
      normalizeOutput(reportedProbe.stdout) !== liveReportedProbe.stdout ||
      normalizeOutput(reportedProbe.stderr) !== liveReportedProbe.stderr ||
      (reportedProbe.error || null) !== (liveReportedProbe.error || null)
    ) {
      issues.push(
        `runtimeEvidence for ${toolName} does not match a live replay of its recorded probe`
      );
    }
  }

  return issues;
}

function validatePublicPackageReport(report, reportEvidence) {
  const issues = [];
  if (
    report.schemaVersion !== 1 ||
    report.kind !== "luascript:public-api-runtime-package-contract"
  ) {
    issues.push("unexpected package report schema or kind");
  }
  if (
    !report.summary ||
    !Array.isArray(report.checks) ||
    report.summary.total < 30 ||
    report.summary.total !== report.checks.length ||
    report.summary.passed !== report.summary.total ||
    report.summary.failed !== 0 ||
    report.checks.some(check => !check || check.passed !== true)
  ) {
    issues.push(
      "package report does not prove a passing, internally consistent check set at or above the 30-check baseline"
    );
  }
  if (Array.isArray(report.failures) && report.failures.length > 0) {
    issues.push("package report contains failures");
  }
  if (
    !report.nodeFloor ||
    report.nodeFloor.declaredFloor !== expectedNodeEngine ||
    report.nodeFloor.requestedExecutableProbe !== "node@14.17.1" ||
    report.nodeFloor.status !== 0 ||
    report.nodeFloor.error ||
    !report.nodeFloor.observed ||
    report.nodeFloor.observed.nodeVersion !== "v14.17.1"
  ) {
    issues.push("Node 14.17.1 installed-consumer floor evidence is not passing");
  }
  const inputRecords = collectPathHashRecords(report.inputs);
  if (inputRecords.length === 0) {
    issues.push("package report has no path/hash inputs");
  } else {
    issues.push(...validatePathHashRecords(inputRecords));
  }
  if (
    !report.expected ||
    !report.expected.package ||
    !sameJson(
      report.expected.package.runtimeDependencies,
      expectedProductionDependencies
    ) ||
    !sameJson(report.expected.package.engines, { node: expectedNodeEngine })
  ) {
    issues.push("package report expected dependency or engine contract drifted");
  }
  return {
    report: reportEvidence,
    summary: report.summary || null,
    nodeFloor: report.nodeFloor || null,
    inputEvidence: inputRecords,
    issues
  };
}

function validateReleaseReport(
  specification,
  report,
  reportEvidence,
  conformanceManifest,
  conformanceEvidence,
  schemaEvidence,
  releaseSurfaceContract
) {
  const issues = [];
  if (report.schemaVersion !== 1 || report.kind !== specification.kind) {
    issues.push("unexpected report schema or kind");
  }
  const failedCounters = collectFailedCounters(report.summary);
  if (failedCounters.length > 0) {
    issues.push(`nonzero failed counters: ${JSON.stringify(failedCounters)}`);
  }
  if (!report.summary || report.summary.failed !== 0) {
    issues.push("top-level report summary is not passing");
  }
  if (Array.isArray(report.failures) && report.failures.length > 0) {
    issues.push("report contains failures");
  }

  if (
    !report.manifest ||
    normalizeRepoPath(report.manifest.path || "") !== conformanceEvidence.path ||
    report.manifest.sha256 !== conformanceEvidence.sha256 ||
    report.manifest.fixtureCount !== conformanceManifest.fixtures.length
  ) {
    issues.push("report manifest binding does not match live conformance manifest");
  } else if (Array.isArray(report.manifest.fixtureHashes)) {
    const expectedHashes = conformanceManifest.fixtures.map(fixture => ({
      name: fixture.name,
      sha256: entrySha256(fixture)
    }));
    if (!sameJson(report.manifest.fixtureHashes, expectedHashes)) {
      issues.push("report conformance fixture hashes are stale");
    }
  } else {
    issues.push("report does not include conformance fixture hashes");
  }

  const pathHashRecords = collectPathHashRecords({
    manifest: report.manifest,
    schema: report.schema,
    governingContract: report.governingContract,
    implementationEvidence: report.implementationEvidence
  });
  if (pathHashRecords.length === 0) {
    issues.push("report has no live-bindable path/hash evidence");
  } else {
    issues.push(...validatePathHashRecords(pathHashRecords));
  }

  if (specification.id === "schema-artifact-mapping") {
    if (
      !report.schema ||
      normalizeRepoPath(report.schema.path || "") !== schemaEvidence.latest.path ||
      report.schema.sha256 !== schemaEvidence.latest.sha256
    ) {
      issues.push("schema-artifact report does not bind the live latest schema");
    }
  }

  if (specification.id === "dual-surface-compatibility-bridge") {
    if (
      !report.schema ||
      !report.schema.latest ||
      !report.schema.pinnedRc ||
      !report.schema.majorAlias ||
      report.schema.latest.sha256 !== schemaEvidence.latest.sha256 ||
      report.schema.pinnedRc.sha256 !== schemaEvidence.pinned.sha256 ||
      report.schema.majorAlias.sha256 !== schemaEvidence.majorAlias.sha256 ||
      report.schema.majorAlias.ref !== "../1.0.0/canonical_ir.schema.json" ||
      report.schema.latestAndPinnedSemanticParityExceptId !== true
    ) {
      issues.push("dual-surface report schema identity does not match live schemas");
    }
    if (!sameJson(report.releaseIrSurfaceContract, releaseSurfaceContract)) {
      issues.push("dual-surface report release IR contract snapshot is stale");
    }
  }

  return {
    id: specification.id,
    path: specification.path,
    report: reportEvidence,
    summary: report.summary || null,
    pathHashEvidence: pathHashRecords,
    issues
  };
}

function main() {
  const startedAt = Date.now();
  const checks = [];

  function addCheck(name, status, detail) {
    if (!["PASS", "OPEN", "FAIL"].includes(status)) {
      throw new Error(`Invalid check status ${status}`);
    }
    checks.push({
      name,
      status,
      passed: status === "PASS",
      detail
    });
  }

  const packageJson = readJson("package.json");
  const packageLock = readJson("package-lock.json");
  const npmProbe = probeNpmVersion();
  const environment = {
    node: process.version,
    npm: {
      available: npmProbe.status === 0 && !npmProbe.error,
      version: npmProbe.stdout || null,
      probe: npmProbe
    },
    platform: process.platform,
    arch: process.arch,
    os: {
      type: os.type(),
      release: os.release()
    },
    cwd: process.cwd(),
    repoRoot,
    runtimeProbeTimeoutMs
  };

  addCheck(
    "node-engine-declaration-and-current-version",
    packageJson.engines &&
      packageJson.engines.node === expectedNodeEngine &&
      packageLock.packages &&
      packageLock.packages[""] &&
      packageLock.packages[""].engines &&
      packageLock.packages[""].engines.node === expectedNodeEngine &&
      versionAtLeast(process.version, "14.17.0")
      ? "PASS"
      : "FAIL",
    {
      expected: expectedNodeEngine,
      packageJson: packageJson.engines || null,
      packageLock:
        packageLock.packages && packageLock.packages[""]
          ? packageLock.packages[""].engines || null
          : null,
      currentNode: process.version,
      currentSatisfiesFloor: versionAtLeast(process.version, "14.17.0")
    }
  );

  addCheck(
    "npm-version-visible",
    environment.npm.available ? "PASS" : "FAIL",
    npmProbe
  );

  const dependencyIssues = [];
  const productionDependencies = [];
  if (!sameJson(packageJson.dependencies, expectedProductionDependencies)) {
    dependencyIssues.push("package.json production dependencies are not the exact Denali set");
  }
  const rootLock =
    packageLock.packages && packageLock.packages[""]
      ? packageLock.packages[""]
      : null;
  if (
    !rootLock ||
    !sameJson(rootLock.dependencies, expectedProductionDependencies)
  ) {
    dependencyIssues.push("package-lock root production dependencies do not match package.json");
  }
  for (const [dependencyName, declaredSpec] of Object.entries(
    expectedProductionDependencies
  )) {
    const lockEntry =
      packageLock.packages &&
      packageLock.packages[`node_modules/${dependencyName}`];
    let installed = null;
    let installedEvidence = null;
    try {
      const installedPath = `node_modules/${dependencyName}/package.json`;
      installed = readJson(installedPath);
      installedEvidence = fileEvidence(installedPath);
    } catch (error) {
      dependencyIssues.push(`${dependencyName} is not installed: ${error.message}`);
    }
    if (!lockEntry) {
      dependencyIssues.push(`${dependencyName} has no package-lock package entry`);
    }
    if (
      lockEntry &&
      installed &&
      (installed.version !== lockEntry.version ||
        !sameJson(installed.engines || null, lockEntry.engines || null))
    ) {
      dependencyIssues.push(
        `${dependencyName} installed version/engines do not match package-lock`
      );
    }
    productionDependencies.push({
      name: dependencyName,
      declaredSpec,
      packageLockRootSpec:
        rootLock && rootLock.dependencies
          ? rootLock.dependencies[dependencyName] || null
          : null,
      packageLock: lockEntry
        ? {
            version: lockEntry.version || null,
            engines: lockEntry.engines || null,
            integrity: lockEntry.integrity || null
          }
        : null,
      installed: installed
        ? {
            version: installed.version || null,
            engines: installed.engines || null,
            packageJson: installedEvidence
          }
        : null
    });
  }
  addCheck(
    "production-dependency-lock-install-compatibility",
    dependencyIssues.length === 0 ? "PASS" : "FAIL",
    {
      expected: expectedProductionDependencies,
      dependencies: productionDependencies,
      issues: dependencyIssues
    }
  );

  const runtimeTools = runtimeSpecifications().map(probeRuntime);
  const runtimeByName = Object.fromEntries(
    runtimeTools.map(tool => [tool.name, tool])
  );
  for (const tool of runtimeTools) {
    addCheck(
      `runtime-tool-${tool.name}`,
      tool.available ? "PASS" : "FAIL",
      tool
    );
  }

  const expectedAggregate = expectedLanes
    .map(lane => `npm run ${lane.npmScript}`)
    .join(" && ");
  const actualAggregate =
    packageJson.scripts && packageJson.scripts["language:implemented:native"];
  const aggregateIssues = [];
  if (actualAggregate !== expectedAggregate) {
    aggregateIssues.push("language:implemented:native order or membership drifted");
  }
  for (const lane of expectedLanes) {
    const scriptBody =
      packageJson.scripts && packageJson.scripts[lane.npmScript];
    const expectedHarnessInvocation =
      `node tests/language_completion/bidirectional_harness.js ${lane.id}`;
    if (
      typeof scriptBody !== "string" ||
      !scriptBody.includes(expectedHarnessInvocation)
    ) {
      aggregateIssues.push(
        `${lane.npmScript} does not bind harness id ${lane.id}`
      );
    }
  }
  addCheck(
    "implemented-native-aggregate-order-and-harness-bindings",
    aggregateIssues.length === 0 ? "PASS" : "FAIL",
    {
      expected: expectedAggregate,
      actual: actualAggregate || null,
      issues: aggregateIssues
    }
  );

  const nativeLanes = [];
  for (const lane of expectedLanes) {
    const manifestRelative =
      `tests/language_completion/manifests/${lane.id}.json`;
    const languageReportRelative =
      `artifacts/language_completion/${lane.id}-report.json`;
    let manifest;
    let manifestEvidence;
    const manifestIssues = [];
    const fixtureEvidence = [];
    try {
      manifest = readJson(manifestRelative);
      manifestEvidence = fileEvidence(manifestRelative);
      if (manifest.status !== "qualified") {
        manifestIssues.push(`status is ${JSON.stringify(manifest.status)}, not qualified`);
      }
      if (typeof manifest.supportSlice !== "string" || !manifest.supportSlice) {
        manifestIssues.push("supportSlice is missing");
      }
      if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length === 0) {
        manifestIssues.push("fixtures are missing or empty");
      } else {
        const names = new Set();
        for (const fixture of manifest.fixtures) {
          if (typeof fixture.name !== "string" || !fixture.name) {
            manifestIssues.push("fixture has no name");
            continue;
          }
          if (names.has(fixture.name)) {
            manifestIssues.push(`duplicate fixture name ${fixture.name}`);
          }
          names.add(fixture.name);
          try {
            const source = fileEvidence(fixture.source);
            fixtureEvidence.push({
              name: fixture.name,
              source: source.path,
              manifestEntrySha256: entrySha256(fixture),
              sourceSha256: source.sha256,
              sizeBytes: source.sizeBytes
            });
          } catch (error) {
            manifestIssues.push(`${fixture.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      manifestIssues.push(error.message);
      manifest = { fixtures: [], targets: [] };
      manifestEvidence = null;
    }

    addCheck(
      `language-${lane.id}-manifest-and-sources`,
      manifestIssues.length === 0 ? "PASS" : "FAIL",
      {
        manifest: manifestEvidence,
        language: manifest.language || null,
        status: manifest.status || null,
        supportSlice: manifest.supportSlice || null,
        fixtureCount: fixtureEvidence.length,
        issues: manifestIssues
      }
    );

    const requiredTools = requiredToolsForLane(lane, manifest);
    const missingTools = requiredTools.all.filter(
      toolName => !runtimeByName[toolName] || !runtimeByName[toolName].available
    );
    addCheck(
      `language-${lane.id}-required-tools`,
      missingTools.length === 0 ? "PASS" : "FAIL",
      {
        requiredTools,
        missingTools,
        setupNotes: missingTools.map(toolName => ({
          tool: toolName,
          note: setupNotes[toolName]
        }))
      }
    );

    let report = null;
    let reportEvidence = null;
    let reportIssues = [];
    let reportStatus = "OPEN";
    try {
      report = readJson(languageReportRelative);
      reportEvidence = fileEvidence(languageReportRelative);
      if (
        report.summary &&
        typeof report.summary.failed === "number" &&
        report.summary.failed > 0
      ) {
        reportIssues.push("stored language report contains failures");
        reportStatus = "FAIL";
      } else if (manifestIssues.length > 0) {
        reportIssues.push("live manifest is invalid, so report provenance cannot bind");
      } else {
        reportIssues = validateLanguageReportV2(
          report,
          languageReportRelative,
          manifest,
          manifestEvidence,
          fixtureEvidence,
          requiredTools,
          runtimeByName
        );
        reportStatus = reportIssues.length === 0 ? "PASS" : "OPEN";
      }
    } catch (error) {
      reportIssues.push(error.message);
    }
    addCheck(
      `language-${lane.id}-stored-report-v2-provenance`,
      reportStatus,
      {
        report: reportEvidence,
        schemaVersion: report ? report.schemaVersion : null,
        generatedAt: report ? report.generatedAt || null : null,
        summary: report ? report.summary || null : null,
        issues: reportIssues,
        boundary:
          "Stored report identity and live provenance only; this matrix did not rerun the language lane."
      }
    );

    nativeLanes.push({
      order: nativeLanes.length + 1,
      npmScript: lane.npmScript,
      harnessId: lane.id,
      manifest: manifestEvidence,
      language: manifest.language || null,
      status: manifest.status || null,
      supportSlice: manifest.supportSlice || null,
      fixtureCount: fixtureEvidence.length,
      fixtures: fixtureEvidence,
      requiredTools,
      missingTools,
      report: reportEvidence,
      reportSchemaVersion: report ? report.schemaVersion : null,
      reportSummary: report ? report.summary || null : null,
      reportBindingStatus: reportStatus,
      reportIssues
    });
  }

  const totalNativeFixtures = nativeLanes.reduce(
    (total, lane) => total + lane.fixtureCount,
    0
  );
  addCheck(
    "implemented-native-17-lane-317-fixture-identity",
    nativeLanes.length === 17 && totalNativeFixtures === 317
      ? "PASS"
      : "FAIL",
    {
      laneCount: nativeLanes.length,
      fixtureCount: totalNativeFixtures,
      expectedLaneCount: 17,
      expectedFixtureCount: 317
    }
  );

  let publicPackageReport = null;
  let publicPackageBinding = null;
  let publicPackageStatus = "OPEN";
  try {
    const relative =
      "artifacts/conformance/public-api-runtime-package-report.json";
    publicPackageReport = readJson(relative);
    publicPackageBinding = validatePublicPackageReport(
      publicPackageReport,
      fileEvidence(relative)
    );
    publicPackageStatus =
      publicPackageBinding.issues.length === 0 ? "PASS" : "OPEN";
    if (
      publicPackageReport.summary &&
      publicPackageReport.summary.failed > 0
    ) {
      publicPackageStatus = "FAIL";
    }
  } catch (error) {
    publicPackageBinding = {
      path: "artifacts/conformance/public-api-runtime-package-report.json",
      issues: [error.message]
    };
  }
  addCheck(
    "public-api-runtime-package-report-binding",
    publicPackageStatus,
    publicPackageBinding
  );

  const documentationEvidence = [];
  const documentationIssues = [];
  for (const documentPath of documentationPaths) {
    try {
      documentationEvidence.push(fileEvidence(documentPath));
    } catch (error) {
      documentationIssues.push(error.message);
    }
  }
  addCheck(
    "denali-documentation-hashes",
    documentationIssues.length === 0 ? "PASS" : "FAIL",
    {
      documents: documentationEvidence,
      issues: documentationIssues
    }
  );

  const boundManifests = boundManifestSpecs.map(specification =>
    verifyBoundManifest(specification, packageJson)
  );
  for (const manifestBinding of boundManifests) {
    addCheck(
      `bound-manifest-${manifestBinding.id}`,
      manifestBinding.issues.length === 0 ? "PASS" : "FAIL",
      manifestBinding
    );
  }

  const releaseSchemaIssues = [];
  let schemaEvidence = null;
  let latestSchema = null;
  let pinnedSchema = null;
  let majorAliasSchema = null;
  try {
    latestSchema = readJson(releaseSchemaPaths.latest);
    pinnedSchema = readJson(releaseSchemaPaths.pinned);
    majorAliasSchema = readJson(releaseSchemaPaths.majorAlias);
    schemaEvidence = {
      latest: fileEvidence(releaseSchemaPaths.latest),
      pinned: fileEvidence(releaseSchemaPaths.pinned),
      majorAlias: fileEvidence(releaseSchemaPaths.majorAlias),
      latestAndPinnedSemanticParityExceptId: sameJson(
        withoutTopLevelId(latestSchema),
        withoutTopLevelId(pinnedSchema)
      ),
      majorAliasRef: majorAliasSchema.$ref || null
    };
    if (!schemaEvidence.latestAndPinnedSemanticParityExceptId) {
      releaseSchemaIssues.push(
        "latest and pinned schemas differ semantically beyond top-level $id"
      );
    }
    if (
      majorAliasSchema.$ref !== "../1.0.0/canonical_ir.schema.json"
    ) {
      releaseSchemaIssues.push("1.x schema alias does not point to pinned 1.0.0");
    }
  } catch (error) {
    releaseSchemaIssues.push(error.message);
  }
  addCheck(
    "release-ir-schema-identity",
    releaseSchemaIssues.length === 0 ? "PASS" : "FAIL",
    {
      schemas: schemaEvidence,
      issues: releaseSchemaIssues
    }
  );

  let releaseSurfaceContract = null;
  let releaseContractEvidence = null;
  const releaseContractIssues = [];
  try {
    releaseContractEvidence = fileEvidence(
      "src/ir/release_ir_surface_contract.js"
    );
    const modulePath = repoAbsolutePath(
      "src/ir/release_ir_surface_contract.js"
    );
    releaseSurfaceContract =
      require(modulePath).RELEASE_IR_SURFACE_CONTRACT;
    if (
      !releaseSurfaceContract ||
      releaseSurfaceContract.contractVersion !== "1.0.0-rc.1"
    ) {
      releaseContractIssues.push(
        "RELEASE_IR_SURFACE_CONTRACT.contractVersion is not 1.0.0-rc.1"
      );
    }
  } catch (error) {
    releaseContractIssues.push(error.message);
  }
  addCheck(
    "release-ir-surface-contract",
    releaseContractIssues.length === 0 ? "PASS" : "FAIL",
    {
      implementation: releaseContractEvidence,
      contractVersion:
        releaseSurfaceContract && releaseSurfaceContract.contractVersion,
      issues: releaseContractIssues
    }
  );

  let conformanceManifest = null;
  let conformanceEvidence = null;
  try {
    conformanceManifest = readJson("tests/conformance/manifest.json");
    conformanceEvidence = fileEvidence("tests/conformance/manifest.json");
  } catch (_error) {
    conformanceManifest = { fixtures: [] };
  }

  const releaseReports = [];
  for (const specification of releaseReportSpecs) {
    let binding;
    let status = "OPEN";
    try {
      const report = readJson(specification.path);
      if (
        !schemaEvidence ||
        !releaseSurfaceContract ||
        !conformanceEvidence
      ) {
        binding = {
          id: specification.id,
          path: specification.path,
          report: fileEvidence(specification.path),
          issues: [
            "live schema, release contract, or conformance manifest is unavailable"
          ]
        };
      } else {
        binding = validateReleaseReport(
          specification,
          report,
          fileEvidence(specification.path),
          conformanceManifest,
          conformanceEvidence,
          schemaEvidence,
          releaseSurfaceContract
        );
      }
      status = binding.issues.length === 0 ? "PASS" : "OPEN";
      if (report.summary && report.summary.failed > 0) status = "FAIL";
    } catch (error) {
      binding = {
        id: specification.id,
        path: specification.path,
        report: null,
        issues: [error.message]
      };
    }
    binding.bindingStatus = status;
    releaseReports.push(binding);
    addCheck(`release-report-${specification.id}`, status, binding);
  }

  const sourceEvidence = [];
  const sourceEvidenceIssues = [];
  for (const sourcePath of [
    "tests/compatibility/denali_compatibility_matrix.test.js",
    "tests/language_completion/bidirectional_harness.js",
    "tests/clarity_canon/runner_utils.js",
    "package.json",
    "package-lock.json"
  ]) {
    try {
      sourceEvidence.push(fileEvidence(sourcePath));
    } catch (error) {
      sourceEvidenceIssues.push(error.message);
    }
  }
  addCheck(
    "compatibility-matrix-source-hashes",
    sourceEvidenceIssues.length === 0 ? "PASS" : "FAIL",
    {
      sources: sourceEvidence,
      issues: sourceEvidenceIssues
    }
  );

  const openItems = checks.filter(check => check.status === "OPEN");
  const failures = checks.filter(check => check.status === "FAIL");
  const passed = checks.filter(check => check.status === "PASS");
  const report = {
    schemaVersion: 1,
    kind: "luascript:denali-compatibility-matrix",
    command:
      "node tests/compatibility/denali_compatibility_matrix.test.js",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    status:
      failures.length > 0
        ? "FAIL"
        : openItems.length > 0
          ? "OPEN"
          : "PASS",
    scope: {
      mode: "read-only-compatibility-evidence",
      proves: [
        "current host runtime and tool version availability",
        "declared Node floor and exact production dependency lock/install identity",
        "17 implemented-native manifest, support-slice, fixture, source, and v2 stored-report provenance",
        "current public package report identity including the Node 14.17.1 consumer probe",
        "release IR contract, schema aliases, passing report identity, documentation hashes, and bound manifest source identity"
      ],
      boundaries: [
        "This is not a language-gate rerun.",
        "This is not cross-platform certification.",
        "A successful --version probe is not a compile, link, package-cache, SDK-target, or runtime behavior proof.",
        "Stored language evidence is accepted only at schemaVersion 2 with exact live provenance.",
        "No language support, source identity, semantic equivalence, release, or public API claim is expanded by this report."
      ]
    },
    noReleaseActions: [
      "no package version change",
      "no Git branch, commit, tag, push, or pull request",
      "no npm publish or release",
      "no dependency installation",
      "no language gate or broad test-suite rerun",
      "no compiler, emitter, package API, manifest, support matrix, or claim mutation"
    ],
    environment,
    sourceEvidence,
    packageBoundary: {
      declaredNodeEngine: packageJson.engines
        ? packageJson.engines.node || null
        : null,
      productionDependencies,
      publicPackageReport: publicPackageBinding
    },
    runtimeTools,
    nativeAggregate: {
      npmScript: "language:implemented:native",
      command: actualAggregate || null,
      expectedCommand: expectedAggregate,
      laneCount: nativeLanes.length,
      fixtureCount: totalNativeFixtures
    },
    nativeLanes,
    releaseIr: {
      contract: {
        implementation: releaseContractEvidence,
        snapshot: releaseSurfaceContract
      },
      schemas: schemaEvidence,
      reports: releaseReports
    },
    documentation: documentationEvidence,
    boundManifests,
    setupNotes,
    boundaries: {
      evidenceFreshness:
        "All accepted hashes are compared to live files during this run. A stale generated report remains OPEN until its owning focused harness regenerates it.",
      tooling:
        "Candidate order mirrors tests/language_completion/bidirectional_harness.js and .tools fallback behavior mirrors runner_utils.js, with bounded probes added for safety.",
      crossPlatform:
        "Only the current host is probed. Other operating systems and architectures require their own matrix runs.",
      noRelease:
        "The matrix records compatibility evidence only and performs no release action."
    },
    checks,
    statusSummary: {
      pass: passed.length,
      open: openItems.length,
      fail: failures.length
    },
    summary: {
      total: checks.length,
      passed: passed.length,
      failed: checks.length - passed.length
    },
    openItems,
    failures
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `Denali compatibility matrix: ${passed.length}/${checks.length} PASS, ${openItems.length} OPEN, ${failures.length} FAIL`
  );
  console.log(`Report: ${reportRelativePath}`);
  if (openItems.length > 0) {
    for (const item of openItems) {
      console.error(`OPEN ${item.name}`);
    }
  }
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL ${failure.name}`);
    }
  }
  if (openItems.length > 0 || failures.length > 0) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
