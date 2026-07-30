#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const VersionBump = require('../../scripts/version-bump');
const ReleaseCLI = require('../../scripts/release-cli');
const {
  READINESS_CHECKS,
  readinessExitCode,
  resolveNpmInvocation,
} = require('../../scripts/release-cli');

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

function withTempPackage(version, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luascript-release-tooling-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify({ name: 'release-tooling-fixture', version }, null, 2)}\n`,
    'utf8'
  );

  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function withoutConsoleOutput(fn) {
  const originalLog = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = originalLog;
  }
}

test('prerelease versions compute standard safe next versions', () => {
  withTempPackage('0.1.0-beta.0', root => {
    const bumper = new VersionBump(root);
    assert.strictEqual(bumper.getNextVersion('patch'), '0.1.0');
    assert.strictEqual(bumper.getNextVersion('minor'), '0.1.0');
    assert.strictEqual(bumper.getNextVersion('major'), '1.0.0');
    assert.strictEqual(bumper.getNextVersion('0.1.0-rc.1'), '0.1.0-rc.1');
    assert.throws(
      () => bumper.getNextVersion('0.0.9'),
      /lower than current version/
    );
  });
});

test('SemVer prerelease precedence is numeric-aware', () => {
  withTempPackage('1.0.0-beta.2', root => {
    const bumper = new VersionBump(root);
    assert.strictEqual(
      bumper.compareVersions('1.0.0-beta.10', '1.0.0-beta.2'),
      1
    );
    assert.strictEqual(
      bumper.compareVersions('1.0.0-beta.2', '1.0.0-beta.10'),
      -1
    );
    assert.strictEqual(bumper.compareVersions('1.0.0', '1.0.0-rc.9'), 1);
    assert.strictEqual(bumper.compareVersions('1.0.0+build.2', '1.0.0+build.1'), 0);
  });
});

test('tag creation rejects a HEAD that does not contain the intended version', () => {
  withTempPackage('0.1.0-beta.0', root => {
    const calls = [];
    const runCommand = (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === 'rev-parse' && args[1] === '--verify') {
        throw new Error('missing tag');
      }
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') {
        return 'mismatched-head\n';
      }
      if (args[0] === 'show') {
        return JSON.stringify({ version: '0.1.0-beta.0' });
      }
      return '';
    };
    const bumper = new VersionBump(root, { runCommand });

    assert.throws(
      () => bumper.createGitTag('0.1.0', 'Release v0.1.0'),
      /HEAD contains package version 0\.1\.0-beta\.0/
    );
    assert.strictEqual(calls.some(call => call[1] === 'tag'), false);
  });
});

test('tag creation rejects uncommitted package divergence', () => {
  withTempPackage('0.1.0', root => {
    const calls = [];
    const runCommand = (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === 'rev-parse' && args[1] === '--verify') {
        throw new Error('missing tag');
      }
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') {
        return 'dirty-head\n';
      }
      if (args[0] === 'show') {
        return JSON.stringify({ version: '0.1.0' });
      }
      if (args[0] === 'status') {
        return ' M package.json\n';
      }
      return '';
    };
    const bumper = new VersionBump(root, { runCommand });

    assert.throws(
      () => bumper.createGitTag('0.1.0', 'Release v0.1.0'),
      /differs from the committed HEAD version/
    );
    assert.strictEqual(calls.some(call => call[1] === 'tag'), false);
  });
});

test('live bump workflow commits and verifies the version before tagging', () => {
  withTempPackage('0.1.0-beta.0', root => {
    const calls = [];
    const runCommand = (command, args) => {
      calls.push([command, ...args]);

      if (args[0] === 'rev-parse' && args[1] === '--verify') {
        throw new Error('missing tag');
      }
      if (args[0] === 'show') {
        return fs.readFileSync(path.join(root, 'package.json'), 'utf8');
      }
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') {
        return '0123456789abcdef\n';
      }
      if (args[0] === 'describe') {
        return 'v0.0.0\n';
      }
      if (args[0] === 'log') {
        return '';
      }
      if (args[0] === 'status') {
        return '';
      }
      return '';
    };
    const bumper = new VersionBump(root, { runCommand });

    const next = withoutConsoleOutput(() => bumper.bump('patch'));
    assert.strictEqual(next, '0.1.0');

    const commitIndex = calls.findIndex(call => call[1] === 'commit');
    const verificationIndex = calls.findIndex(call => call[1] === 'show');
    const tagIndex = calls.findIndex(call => call[1] === 'tag');
    assert.ok(commitIndex >= 0, 'expected a version commit');
    assert.ok(verificationIndex > commitIndex, 'expected verification after commit');
    assert.ok(tagIndex > verificationIndex, 'expected tag after verification');
    assert.deepStrictEqual(
      calls[tagIndex].slice(0, 6),
      ['git', 'tag', '-a', 'v0.1.0', '0123456789abcdef', '-m']
    );
  });
});

test('readiness runs only the authoritative Denali RC preflight', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
  );
  assert.strictEqual(READINESS_CHECKS.length, 1);
  for (const check of READINESS_CHECKS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(packageJson.scripts, check.script),
      `missing package script ${check.script}`
    );
  }

  const calls = [];
  const cli = new ReleaseCLI(path.join(__dirname, '..', '..'), {
    readinessChecks: [],
    runCommand(command, args) {
      calls.push([command, ...args]);
      return '';
    },
  });

  const ready = withoutConsoleOutput(() => cli.checkReadiness());
  assert.strictEqual(ready, true);
  assert.deepStrictEqual(
    calls.filter(call => call[0] === 'npm'),
    [['npm', 'run', 'denali:rc:preflight']]
  );
  assert.strictEqual(
    calls.some(call => call.some(arg => /[|;&]/.test(arg))),
    false
  );
});

test('a failed authoritative preflight makes readiness fail', () => {
  const calls = [];
  const cli = new ReleaseCLI(path.join(__dirname, '..', '..'), {
    runCommand(command, args) {
      calls.push([command, ...args]);
      if (command === 'npm') {
        throw new Error('simulated preflight failure');
      }
      return '';
    },
  });

  const ready = withoutConsoleOutput(() => cli.checkReadiness());
  assert.strictEqual(ready, false);
  assert.deepStrictEqual(
    calls.filter(call => call[0] === 'npm'),
    [['npm', 'run', 'denali:rc:preflight']]
  );
  assert.strictEqual(readinessExitCode(ready), 1);
});

test('force cannot override the authoritative preflight policy', () => {
  const cli = new ReleaseCLI(path.join(__dirname, '..', '..'), {
    runCommand() {
      throw new Error('release commands must not be reached');
    },
  });
  assert.throws(
    () => cli.validateReleaseOptions({ force: true }),
    /cannot override the authoritative denali:rc:preflight policy/
  );
});

test('successful readiness maps to a successful CLI status exit', () => {
  assert.strictEqual(readinessExitCode(true), 0);
  assert.strictEqual(readinessExitCode(false), 1);
});

test('Windows npm resolution uses Node and npm-cli.js without cmd shell syntax', () => {
  const invocation = resolveNpmInvocation(['--version']);
  if (process.platform === 'win32') {
    assert.strictEqual(invocation.command, process.execPath);
    assert.ok(fs.existsSync(invocation.args[0]), 'npm-cli.js must exist');
    assert.strictEqual(path.basename(invocation.args[0]), 'npm-cli.js');
    assert.deepStrictEqual(invocation.args.slice(1), ['--version']);
  } else {
    assert.deepStrictEqual(invocation, {
      command: 'npm',
      args: ['--version'],
    });
  }
  assert.strictEqual(
    [invocation.command, ...invocation.args].some(arg => /[|;&]/.test(arg)),
    false
  );
});

console.log(`PASS release tooling contract (${passed}/10 checks)`);
