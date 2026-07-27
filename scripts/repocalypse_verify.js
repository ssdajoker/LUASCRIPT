'use strict';

const { spawnSync } = require('child_process');

const gates = [
  'status:check',
  'claims:check',
  'stubs:check',
  'archive:audit',
  'test:ir-conformance',
  'test:edge-matrix',
  'test:roundtrip-probe',
  'test:source-identity-probe',
  'test:unsupported-diagnostics',
];

for (const gate of gates) {
  console.log(`\n[repocalypse:verify] ${gate}`);
  const executable = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `npm run --silent ${gate}`]
      : ['run', '--silent', gate];
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`[repocalypse:verify] unable to start ${gate}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[repocalypse:verify] ${gate} failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

console.log('\n[repocalypse:verify] all required gates passed');
