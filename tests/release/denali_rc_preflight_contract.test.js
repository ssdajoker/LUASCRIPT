#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  DEFAULT_REPO_ROOT,
  RECEIPT_PREFIX,
  RELEASE_BLOCKING_COMMANDS,
  createSpawnRunner,
  main,
  parseArguments,
  resolveNpmInvocation,
  runPreflight,
  validateCommandList
} = require("../../scripts/denali_rc_preflight");

const EXPECTED_SEQUENCE = [
  "language:implemented:bidirectional",
  "test:package-contract",
  "clarity:dogfood",
  "clarity:canon",
  "clarity:canon:super",
  "clarity:canon:languages",
  "clarity:languages:reports",
  "test:actual-programs",
  "test:parser-ownership",
  "test:ir-conformance",
  "test:schema-artifact-map",
  "test:ir-compatibility-bridge",
  "test:edge-matrix",
  "test:roundtrip-probe",
  "test:source-identity-probe",
  "test:unsupported-diagnostics",
  "test:compatibility-matrix",
  "status:check",
  "stubs:check",
  "archive:audit",
  "claims:check",
  "verify",
  "test",
  "test:performance",
  "ci:gates",
  "evidence:release"
];

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function captureOutput() {
  let value = "";
  return {
    stream: {
      write(chunk) {
        value += String(chunk);
      }
    },
    read() {
      return value;
    }
  };
}

function finalReceipt(output) {
  const finalLine = output
    .trimEnd()
    .split(/\r?\n/)
    .at(-1);
  assert.ok(
    finalLine.startsWith(RECEIPT_PREFIX),
    "final stdout line must be the receipt"
  );
  return JSON.parse(finalLine.slice(RECEIPT_PREFIX.length));
}

test("release-blocking commands have the exact deterministic order", () => {
  assert.strictEqual(validateCommandList(RELEASE_BLOCKING_COMMANDS), true);
  assert.deepStrictEqual(
    RELEASE_BLOCKING_COMMANDS.map(entry => entry.script),
    EXPECTED_SEQUENCE
  );
  assert.strictEqual(
    RELEASE_BLOCKING_COMMANDS.at(-1).script,
    "evidence:release"
  );
});

test("the policy contains no release mutation, publish, tag, or Git command", () => {
  const serialized = RELEASE_BLOCKING_COMMANDS.map(entry => [
    "npm",
    ...entry.npmArgs
  ]);
  const forbiddenScripts = new Set([
    "release",
    "release:major",
    "release:minor",
    "release:patch",
    "version:bump"
  ]);

  for (const entry of RELEASE_BLOCKING_COMMANDS) {
    assert.strictEqual(forbiddenScripts.has(entry.script), false);
  }
  for (const argv of serialized) {
    assert.ok(Array.isArray(argv));
    assert.strictEqual(argv[0], "npm");
    assert.strictEqual(argv.includes("publish"), false);
    assert.strictEqual(argv.includes("tag"), false);
    assert.strictEqual(argv.includes("git"), false);
  }
});

test("claims validates a live candidate without writing the final bundle", () => {
  const source = fs.readFileSync(
    path.join(DEFAULT_REPO_ROOT, "scripts", "claims_check.js"),
    "utf8"
  );

  assert.match(source, /const bundle = buildReleaseEvidenceBundle\(\{/);
  assert.match(source, /command: expectedEvidenceCommand/);
  assert.doesNotMatch(source, /\bwriteReleaseEvidenceBundle\b/);
});

test("--list prints the policy without invoking a runner", () => {
  const output = captureOutput();
  let runnerCalls = 0;
  const exitCode = main(["--list"], {
    stdout: output.stream,
    runner() {
      runnerCalls += 1;
      return { status: 0 };
    }
  });

  assert.strictEqual(exitCode, 0);
  assert.strictEqual(runnerCalls, 0);
  const lines = output.read().trim().split(/\r?\n/);
  assert.strictEqual(lines.length, EXPECTED_SEQUENCE.length);
  assert.strictEqual(
    lines[0],
    "01. npm run language:implemented:bidirectional"
  );
  assert.strictEqual(lines.at(-1), "26. npm run evidence:release");
});

test("successful preflight runs every step from repo root without a shell", () => {
  const output = captureOutput();
  const calls = [];
  const receipt = runPreflight({
    stdout: output.stream,
    runner(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0, signal: null };
    }
  });

  assert.strictEqual(receipt.status, "passed");
  assert.strictEqual(receipt.completedSteps, EXPECTED_SEQUENCE.length);
  assert.strictEqual(receipt.failedStep, null);
  assert.strictEqual(calls.length, EXPECTED_SEQUENCE.length);
  assert.deepStrictEqual(
    calls.map(call =>
      call.args[0] === "test" ? "test" : call.args[1]
    ),
    EXPECTED_SEQUENCE
  );
  for (const call of calls) {
    assert.strictEqual(call.command, "npm");
    assert.ok(Array.isArray(call.args));
    assert.strictEqual(call.options.cwd, DEFAULT_REPO_ROOT);
    assert.strictEqual(call.options.shell, false);
    assert.strictEqual(call.options.stdio, "inherit");
  }
  assert.deepStrictEqual(finalReceipt(output.read()), receipt);
});

test("a nonzero result stops immediately and returns a failure receipt", () => {
  const output = captureOutput();
  const calls = [];
  const receipt = runPreflight({
    stdout: output.stream,
    runner(command, args, options) {
      calls.push({ command, args, options });
      return { status: calls.length === 4 ? 9 : 0, signal: null };
    }
  });

  assert.strictEqual(calls.length, 4);
  assert.strictEqual(receipt.status, "failed");
  assert.strictEqual(receipt.completedSteps, 3);
  assert.deepStrictEqual(receipt.failedStep, {
    index: 4,
    id: "clarity-canon",
    script: "clarity:canon",
    exitCode: 9,
    signal: null,
    error: "process exited with status 9"
  });
  assert.deepStrictEqual(finalReceipt(output.read()), receipt);
});

test("runner exceptions fail closed and do not start later commands", () => {
  const output = captureOutput();
  let calls = 0;
  const receipt = runPreflight({
    stdout: output.stream,
    runner() {
      calls += 1;
      if (calls === 2) {
        throw new Error("fixture runner exploded");
      }
      return { status: 0 };
    }
  });

  assert.strictEqual(calls, 2);
  assert.strictEqual(receipt.status, "failed");
  assert.strictEqual(receipt.failedStep.script, "test:package-contract");
  assert.match(receipt.failedStep.error, /fixture runner exploded/);
});

test("spawn runner forces shell false and keeps arguments structured", () => {
  const calls = [];
  const runner = createSpawnRunner({
    resolveNpm(args) {
      return { command: "resolved-npm", args: ["npm-cli.js", ...args] };
    },
    spawn(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0 };
    }
  });

  runner("npm", ["run", "claims:check"], {
    cwd: DEFAULT_REPO_ROOT,
    shell: true
  });

  assert.deepStrictEqual(calls, [
    {
      command: "resolved-npm",
      args: ["npm-cli.js", "run", "claims:check"],
      options: { cwd: DEFAULT_REPO_ROOT, shell: false }
    }
  ]);
});

test("npm resolution is shell-free on the current platform", () => {
  const invocation = resolveNpmInvocation(["run", "verify"]);
  assert.ok(Array.isArray(invocation.args));
  assert.strictEqual(
    [invocation.command, ...invocation.args].some(argument =>
      /[|;&]/.test(argument)
    ),
    false
  );
  if (process.platform === "win32") {
    assert.strictEqual(invocation.command, process.execPath);
    assert.strictEqual(path.basename(invocation.args[0]), "npm-cli.js");
    assert.ok(fs.existsSync(invocation.args[0]));
  } else {
    assert.deepStrictEqual(invocation, {
      command: "npm",
      args: ["run", "verify"]
    });
  }
});

test("unknown command-line arguments are rejected", () => {
  assert.deepStrictEqual(parseArguments([]), { list: false });
  assert.deepStrictEqual(parseArguments(["--list"]), { list: true });
  assert.throws(() => parseArguments(["--publish"]), /Unknown argument/);
});

console.log(`PASS Denali RC preflight contract (${passed}/10 checks)`);
