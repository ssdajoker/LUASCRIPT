#!/usr/bin/env node

const { spawnSync } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runStep(label, cmd, args, extraEnv = {}) {
  console.log(`\n▶️  ${label}`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`\n❌ ${label} failed`);
    process.exit(result.status || 1);
  }
}

runStep('Core verification suite', npmCmd, ['run', '--silent', 'verify:core']);

const runEnhanced = process.env.VERIFY_ENHANCED === '1' || process.env.LUASCRIPT_USE_ENHANCED_IR === '1';
if (runEnhanced) {
  runStep('Enhanced verification suite', npmCmd, ['run', '--silent', 'verify:enhanced'], {
    LUASCRIPT_USE_ENHANCED_IR: '1',
    VERIFY_ENHANCED: '1',
  });
} else {
  console.log('\nℹ️  Enhanced verification skipped (set VERIFY_ENHANCED=1 or LUASCRIPT_USE_ENHANCED_IR=1 to enable)');
}

console.log('\n✅ All requested verify suites passed');
