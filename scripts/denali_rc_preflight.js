#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..");
const RECEIPT_PREFIX = "DENALI_RC_PREFLIGHT_RECEIPT ";

function command(id, label, script, npmArgs = ["run", script]) {
  return Object.freeze({
    id,
    label,
    script,
    npmArgs: Object.freeze([...npmArgs])
  });
}

// Order is policy: evidence producers run before their validators, and the
// release-evidence bundle is generated only after every blocking check passes.
const RELEASE_BLOCKING_COMMANDS = Object.freeze([
  command(
    "language-evidence",
    "Regenerate all implemented language evidence",
    "language:implemented:bidirectional"
  ),
  command(
    "public-package-contract",
    "Regenerate and validate the public package contract",
    "test:package-contract"
  ),
  command(
    "clarity-dogfood",
    "Regenerate Clarity dogfood evidence",
    "clarity:dogfood"
  ),
  command(
    "clarity-canon",
    "Regenerate Clarity canon evidence",
    "clarity:canon"
  ),
  command(
    "clarity-canon-super",
    "Regenerate Clarity super-canon evidence",
    "clarity:canon:super"
  ),
  command(
    "clarity-canon-languages",
    "Regenerate Clarity language-canon evidence",
    "clarity:canon:languages"
  ),
  command(
    "clarity-language-reports",
    "Validate implemented-language reports through Clarity",
    "clarity:languages:reports"
  ),
  command(
    "actual-programs",
    "Regenerate and validate actual-program evidence",
    "test:actual-programs"
  ),
  command(
    "parser-ownership",
    "Regenerate and validate parser-ownership evidence",
    "test:parser-ownership"
  ),
  command(
    "canonical-ir",
    "Regenerate and validate canonical IR conformance",
    "test:ir-conformance"
  ),
  command(
    "schema-artifact-map",
    "Regenerate and validate schema-to-artifact mapping",
    "test:schema-artifact-map"
  ),
  command(
    "dual-surface-ir",
    "Regenerate and validate dual-surface IR compatibility",
    "test:ir-compatibility-bridge"
  ),
  command(
    "edge-matrix",
    "Regenerate and validate the edge-case matrix",
    "test:edge-matrix"
  ),
  command(
    "roundtrip-probe",
    "Regenerate and validate roundtrip evidence",
    "test:roundtrip-probe"
  ),
  command(
    "source-identity-probe",
    "Regenerate and validate source-identity evidence",
    "test:source-identity-probe"
  ),
  command(
    "unsupported-diagnostics",
    "Regenerate and validate unsupported diagnostics",
    "test:unsupported-diagnostics"
  ),
  command(
    "compatibility-matrix",
    "Regenerate and validate the Denali compatibility matrix",
    "test:compatibility-matrix"
  ),
  command("status-consistency", "Validate status consistency", "status:check"),
  command("stub-inventory", "Validate the stub inventory", "stubs:check"),
  command("archive-audit", "Validate the archive boundary", "archive:audit"),
  command("claims", "Validate evidence-backed claims", "claims:check"),
  command("verify", "Run the deterministic verification gate", "verify"),
  command("npm-test", "Run the package test contract", "test", ["test"]),
  command(
    "performance-tests",
    "Run the release performance test contract",
    "test:performance"
  ),
  command("ci-gates", "Run CI completeness gates", "ci:gates"),
  command(
    "release-evidence",
    "Generate the final release-evidence bundle",
    "evidence:release"
  )
]);

const FORBIDDEN_SCRIPTS = new Set([
  "release",
  "release:major",
  "release:minor",
  "release:patch",
  "version:bump"
]);

function validateCommandList(commands = RELEASE_BLOCKING_COMMANDS) {
  if (!Array.isArray(commands) || commands.length === 0) {
    throw new Error("Denali RC preflight command list must not be empty");
  }

  const ids = new Set();
  for (const entry of commands) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof entry.label !== "string" ||
      typeof entry.script !== "string" ||
      !Array.isArray(entry.npmArgs) ||
      entry.npmArgs.length === 0 ||
      entry.npmArgs.some(argument => typeof argument !== "string")
    ) {
      throw new Error("Every Denali RC preflight command must be fully specified");
    }
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate Denali RC preflight command id: ${entry.id}`);
    }
    if (FORBIDDEN_SCRIPTS.has(entry.script)) {
      throw new Error(
        `Release-mutating command is forbidden in RC preflight: ${entry.script}`
      );
    }
    ids.add(entry.id);
  }

  const finalCommand = commands[commands.length - 1];
  if (finalCommand.script !== "evidence:release") {
    throw new Error("evidence:release must be the final Denali RC preflight step");
  }
  if (
    commands
      .slice(0, -1)
      .some(entry => entry.script === "evidence:release")
  ) {
    throw new Error("evidence:release may appear only as the final step");
  }

  return true;
}

function resolveNpmInvocation(args) {
  if (!Array.isArray(args)) {
    throw new TypeError("npm arguments must be an array");
  }

  if (process.platform !== "win32") {
    return { command: "npm", args: [...args] };
  }

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
  const npmCli = candidates.find(candidate => fs.existsSync(candidate));

  if (!npmCli) {
    throw new Error(
      "Unable to locate npm-cli.js for shell-free Windows RC preflight"
    );
  }

  return {
    command: process.execPath,
    args: [npmCli, ...args]
  };
}

function createSpawnRunner(options = {}) {
  const spawn = options.spawn || spawnSync;
  const resolveNpm = options.resolveNpm || resolveNpmInvocation;

  return function run(commandName, args, spawnOptions = {}) {
    if (!Array.isArray(args)) {
      throw new TypeError("command arguments must be an array");
    }
    const invocation =
      commandName === "npm"
        ? resolveNpm(args)
        : { command: commandName, args: [...args] };

    return spawn(invocation.command, invocation.args, {
      ...spawnOptions,
      shell: false
    });
  };
}

function formatDisplayCommand(entry) {
  return ["npm", ...entry.npmArgs].join(" ");
}

function listCommands(options = {}) {
  const stdout = options.stdout || process.stdout;
  validateCommandList(RELEASE_BLOCKING_COMMANDS);
  const lines = RELEASE_BLOCKING_COMMANDS.map(
    (entry, index) =>
      `${String(index + 1).padStart(2, "0")}. ${formatDisplayCommand(entry)}`
  );
  stdout.write(`${lines.join("\n")}\n`);
  return [...RELEASE_BLOCKING_COMMANDS];
}

function failureFromResult(result) {
  if (!result || typeof result !== "object") {
    return {
      exitCode: null,
      signal: null,
      error: "runner returned no process result"
    };
  }
  if (result.error) {
    return {
      exitCode: Number.isInteger(result.status) ? result.status : null,
      signal: result.signal || null,
      error: String(result.error.message || result.error)
    };
  }
  if (result.signal) {
    return {
      exitCode: Number.isInteger(result.status) ? result.status : null,
      signal: String(result.signal),
      error: `process terminated by signal ${result.signal}`
    };
  }
  if (!Number.isInteger(result.status)) {
    return {
      exitCode: null,
      signal: null,
      error: "runner did not return an integer exit status"
    };
  }
  if (result.status !== 0) {
    return {
      exitCode: result.status,
      signal: null,
      error: `process exited with status ${result.status}`
    };
  }
  return null;
}

function writeReceipt(stdout, receipt) {
  stdout.write(`${RECEIPT_PREFIX}${JSON.stringify(receipt)}\n`);
}

function runPreflight(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const runner = options.runner || createSpawnRunner();
  const stdout = options.stdout || process.stdout;
  const commands = options.commands || RELEASE_BLOCKING_COMMANDS;

  validateCommandList(commands);

  const receipt = {
    schemaVersion: 1,
    kind: "luascript:denali-rc-preflight-receipt",
    status: "running",
    repositoryRoot: repoRoot,
    totalSteps: commands.length,
    completedSteps: 0,
    failedStep: null,
    steps: []
  };

  for (let index = 0; index < commands.length; index += 1) {
    const entry = commands[index];
    stdout.write(
      `[${index + 1}/${commands.length}] ${entry.label}: ${formatDisplayCommand(
        entry
      )}\n`
    );

    let result;
    let failure;
    try {
      result = runner("npm", [...entry.npmArgs], {
        cwd: repoRoot,
        stdio: "inherit",
        shell: false
      });
      failure = failureFromResult(result);
    } catch (error) {
      failure = {
        exitCode: null,
        signal: null,
        error: String(error && error.message ? error.message : error)
      };
    }

    const stepReceipt = {
      index: index + 1,
      id: entry.id,
      script: entry.script,
      command: formatDisplayCommand(entry),
      status: failure ? "failed" : "passed",
      exitCode: failure ? failure.exitCode : 0,
      signal: failure ? failure.signal : null,
      error: failure ? failure.error : null
    };
    receipt.steps.push(stepReceipt);

    if (failure) {
      receipt.status = "failed";
      receipt.failedStep = {
        index: stepReceipt.index,
        id: stepReceipt.id,
        script: stepReceipt.script,
        exitCode: stepReceipt.exitCode,
        signal: stepReceipt.signal,
        error: stepReceipt.error
      };
      writeReceipt(stdout, receipt);
      return receipt;
    }

    receipt.completedSteps += 1;
  }

  receipt.status = "passed";
  writeReceipt(stdout, receipt);
  return receipt;
}

function parseArguments(argv) {
  const options = { list: false };
  for (const argument of argv) {
    if (argument === "--list") {
      options.list = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function main(argv = process.argv.slice(2), options = {}) {
  const cli = parseArguments(argv);
  if (cli.list) {
    listCommands({ stdout: options.stdout });
    return 0;
  }

  const receipt = runPreflight(options);
  return receipt.status === "passed" ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_REPO_ROOT,
  FORBIDDEN_SCRIPTS,
  RECEIPT_PREFIX,
  RELEASE_BLOCKING_COMMANDS,
  createSpawnRunner,
  failureFromResult,
  formatDisplayCommand,
  listCommands,
  main,
  parseArguments,
  resolveNpmInvocation,
  runPreflight,
  validateCommandList,
  writeReceipt
};
