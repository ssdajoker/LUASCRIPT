const { spawnSync } = require('child_process');

function run(label, cmd) {
  const res = spawnSync(cmd, { shell: true, stdio: 'inherit' });
  if (res.status !== 0) {
    console.warn(`${label} exited with code ${res.status}`);
  }
}

function main() {
  run('copilot:launch', 'npm run copilot:launch');
  run('gemini:launch', 'npm run gemini:launch');
}

if (require.main === module) {
  main();
}
