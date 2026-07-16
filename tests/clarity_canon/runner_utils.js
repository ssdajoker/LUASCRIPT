"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");

function normalizeOutput(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function findCommand(candidates, label) {
  const toolsDir = path.join(repoRoot, ".tools");

  function commandProbeArgs(cmd) {
    const executable = path.basename(cmd).toLowerCase().replace(/\.(exe|cmd|bat)$/, "");
    if (executable === "go") {
      return [["version"]];
    }
    if (executable === "kotlinc") {
      return [["-version"]];
    }
    return [["--version"], ["-v"]];
  }
  
  function tryCommand(cmd) {
    for (const probeArgs of commandProbeArgs(cmd)) {
      const spawn = commandInvocation(cmd, probeArgs);
      const result = spawnSync(spawn.cmd, spawn.args, { encoding: "utf8" });
      if (result.status === 0) return cmd;
    }
    return null;
  }
  
  for (const cmd of candidates) {
    const found = tryCommand(cmd);
    if (found) return found;
  }
  
  if (fs.existsSync(toolsDir)) {
    const toolSubdirs = fs.readdirSync(toolsDir);
    for (const subdir of toolSubdirs) {
      const toolPath = path.join(toolsDir, subdir);
      if (fs.statSync(toolPath).isDirectory()) {
        for (const cmd of candidates) {
          const cmdInTool = path.join(toolPath, cmd + (process.platform === "win32" ? ".exe" : ""));
          if (fs.existsSync(cmdInTool)) {
            const found = tryCommand(cmdInTool);
            if (found) return cmdInTool;
          }
          const binDir = path.join(toolPath, "bin");
          if (fs.existsSync(binDir)) {
            const cmdInBin = path.join(binDir, cmd + (process.platform === "win32" ? ".exe" : ""));
            if (fs.existsSync(cmdInBin)) {
              const found = tryCommand(cmdInBin);
              if (found) return cmdInBin;
            }
          }
        }
      }
    }
  }
  
  throw new Error(`Missing required dependency: ${label} (${candidates.join(" or ")})`);
}

function commandInvocation(cmd, args) {
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(cmd)) {
    return { cmd: "cmd.exe", args: ["/c", cmd, ...args] };
  }
  return { cmd, args };
}

function runCommand(cmd, args, label, options = {}) {
  const spawn = commandInvocation(cmd, args);
  const result = spawnSync(spawn.cmd, spawn.args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 30000,
    maxBuffer: options.maxBuffer || 20 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      ...options.env
    }
  });

  return {
    label,
    cmd,
    args,
    status: result.status,
    signal: result.signal,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    error: result.error
  };
}

function withTempDir(prefix, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJsonReport(reportPath, report) {
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function commandSummary(result) {
  if (!result) return null;
  return {
    label: result.label,
    cmd: result.cmd,
    args: result.args,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error ? String(result.error.message || result.error) : null
  };
}

function parseCsvEnv(value) {
  return (value || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
}

function parseShard(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid shard format ${JSON.stringify(value)}; expected INDEX/TOTAL such as 1/4`);
  }

  const index = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || index < 1 || index > total) {
    throw new Error(`Invalid shard value ${JSON.stringify(value)}; INDEX must be between 1 and TOTAL`);
  }

  return { index, total };
}

function hasAnyTag(item, requiredTags) {
  if (requiredTags.length === 0) return true;
  const itemTags = new Set(item.tags || []);
  return requiredTags.some(tag => itemTags.has(tag));
}

function assertIncludes(actual, expected, label) {
  if (!actual.includes(expected)) {
    throw new Error(`${label} output missing ${JSON.stringify(expected)}. Actual output: ${JSON.stringify(actual)}`);
  }
}

function assertRegex(actual, pattern, label) {
  const regex = new RegExp(pattern, "i");
  if (!regex.test(actual)) {
    throw new Error(`${label} output did not match /${pattern}/i. Actual output: ${JSON.stringify(actual)}`);
  }
}

function assertNoPlaceholderLua(luaSource, label) {
  const placeholderPattern = /Unhandled node type|not yet supported|\bnil\s*(?:\r?\n\s*nil\b){2,}/i;
  if (placeholderPattern.test(luaSource)) {
    throw new Error(`${label} emitted placeholder or stub Lua`);
  }
}

module.exports = {
  repoRoot,
  normalizeOutput,
  findCommand,
  runCommand,
  withTempDir,
  writeJsonReport,
  commandSummary,
  parseCsvEnv,
  parseShard,
  hasAnyTag,
  assertIncludes,
  assertRegex,
  assertNoPlaceholderLua
};
