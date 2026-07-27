#!/usr/bin/env node

const { spawnSync } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runStep(label, script) {
  console.log(`\n🚀 ${label}`);
  const result = spawnSync(npmCmd, ['run', '--silent', script], {
    stdio: 'inherit',
    env: { ...process.env, LUASCRIPT_USE_ENHANCED_IR: '1' },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    if (result.error) {
      console.error(`\n❌ ${label} failed: ${result.error.message}`);
    } else {
      console.error(`\n❌ ${label} failed with exit code ${result.status}`);
    }
    process.exit(result.status || 1);
  }
}

runStep('Enhanced harness smoke', 'test:enhanced:harness');
runStep('Enhanced parity subset', 'test:enhanced:parity');
runStep('Enhanced determinism', 'test:enhanced:determinism');

console.log('\n✅ Enhanced verification suite passed');
