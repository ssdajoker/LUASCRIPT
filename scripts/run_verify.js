#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(process.cwd(), 'artifacts', 'verify');
const verifyLogPath = path.join(artifactsDir, 'last-run.jsonl');
const windowsFatalExitCodes = new Map([
  [0xC0000005, 'STATUS_ACCESS_VIOLATION'],
  [0xC0000017, 'STATUS_NO_MEMORY'],
  [0xC00000FD, 'STATUS_STACK_OVERFLOW'],
  [0xC000013A, 'STATUS_CONTROL_C_EXIT'],
  [0xC0000374, 'STATUS_HEAP_CORRUPTION'],
  [0xC0000409, 'STATUS_STACK_BUFFER_OVERRUN']
]);

function resolveNpmInvocation() {
  if (process.platform !== 'win32') {
    return { command: 'npm', prefixArgs: [] };
  }

  const candidates = [
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const npmCli = candidates.find(candidate => candidate && fs.existsSync(candidate));
  if (!npmCli) {
    throw new Error(`Unable to locate npm-cli.js. Checked: ${candidates.join(', ')}`);
  }

  return { command: process.execPath, prefixArgs: [npmCli] };
}

const npmInvocation = resolveNpmInvocation();

function ensureVerifyLog() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(verifyLogPath, '', 'utf8');
}

function appendVerifyLog(record) {
  fs.appendFileSync(verifyLogPath, `${JSON.stringify({
    timestamp: new Date().toISOString(),
    pid: process.pid,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ...record
  })}\n`, 'utf8');
}

function decodeExitStatus(status) {
  if (typeof status !== 'number') {
    return null;
  }

  const unsigned = status >>> 0;
  const hex = `0x${unsigned.toString(16).toUpperCase().padStart(8, '0')}`;
  return {
    status,
    unsigned,
    hex,
    name: windowsFatalExitCodes.get(unsigned) || null
  };
}

function formatExitStatus(status) {
  const decoded = decodeExitStatus(status);
  if (!decoded) {
    return String(status);
  }

  return decoded.name
    ? `${decoded.status} (${decoded.hex} ${decoded.name})`
    : `${decoded.status} (${decoded.hex})`;
}

function runStep(label, cmd, args, extraEnv = {}) {
  console.log(`\n▶️  ${label}`);
  const startedAt = Date.now();
  appendVerifyLog({
    event: 'step:start',
    label,
    command: cmd,
    args,
    envOverrides: Object.keys(extraEnv)
  });
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  const elapsedMs = Date.now() - startedAt;
  appendVerifyLog({
    event: 'step:end',
    label,
    status: result.status,
    signal: result.signal,
    exitStatus: decodeExitStatus(result.status),
    elapsedMs,
    error: result.error ? result.error.message : null
  });
  if (result.error) {
    console.error(`\n❌ ${label} could not start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n❌ ${label} failed with exit ${formatExitStatus(result.status)}${result.signal ? ` signal ${result.signal}` : ''}`);
    if (process.platform === 'win32' && decodeExitStatus(result.status)?.name) {
      console.error(`   Windows fatal-process status detected. Verify breadcrumb log: ${verifyLogPath}`);
    }
    process.exit(1);
  }
}

function runNpmStep(label, args, extraEnv = {}) {
  runStep(label, npmInvocation.command, [...npmInvocation.prefixArgs, ...args], extraEnv);
}

ensureVerifyLog();
appendVerifyLog({
  event: 'verify:start',
  npmCommand: npmInvocation.command,
  npmPrefixArgs: npmInvocation.prefixArgs,
  nodeOptions: process.env.NODE_OPTIONS || null,
  verifyEnhanced: process.env.VERIFY_ENHANCED || null,
  enhancedIR: process.env.LUASCRIPT_USE_ENHANCED_IR || null
});

runNpmStep('Refactor quality gates', ['run', '--silent', 'refactor:all'], {
  ENFORCE_WARN_BUDGET: '1',
});

runNpmStep('Core verification suite', ['run', '--silent', 'verify:core']);

const runEnhanced = process.env.VERIFY_ENHANCED === '1' || process.env.LUASCRIPT_USE_ENHANCED_IR === '1';
if (runEnhanced) {
  runNpmStep('Enhanced verification suite', ['run', '--silent', 'verify:enhanced'], {
    LUASCRIPT_USE_ENHANCED_IR: '1',
    VERIFY_ENHANCED: '1',
  });
} else {
  console.log('\nℹ️  Enhanced verification skipped (set VERIFY_ENHANCED=1 or LUASCRIPT_USE_ENHANCED_IR=1 to enable)');
}

appendVerifyLog({ event: 'verify:pass' });
console.log('\n✅ All requested verify suites passed');
