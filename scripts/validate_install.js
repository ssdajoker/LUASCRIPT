const { spawnSync } = require('child_process');

function checkCommand(candidates, label) {
  for (const cmd of candidates) {
    const result = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) {
      const versionLine = (result.stdout || result.stderr || '').split('\n')[0].trim();
      console.log(`✓ ${label}: ${versionLine || cmd}`);
      return cmd;
    }
  }
  throw new Error(`Missing required dependency: ${label} (${candidates.join(' or ')})`);
}

function assertNodeVersion(minMajor) {
  const [major] = process.versions.node.split('.').map((v) => parseInt(v, 10));
  if (major < minMajor) {
    throw new Error(`Node.js ${minMajor}+ required, found ${process.versions.node}`);
  }
  console.log(`✓ Node.js: ${process.versions.node}`);
}

try {
  assertNodeVersion(14);
  const python = checkCommand(['python3', 'python'], 'Python');
  checkCommand(['luajit', 'lua', 'lua5.4', 'lua5.3'], 'Lua interpreter');
  checkCommand(['npm'], 'npm');

  // Basic LuaScript smoke: ensure compiler script is runnable
  const smoke = spawnSync(python, ['src/luascript_compiler.py', '--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (smoke.status !== 0) {
    throw new Error(`Compiler version check failed: ${(smoke.stderr || smoke.stdout || '').trim()}`);
  }
  console.log(`✓ LUASCRIPT compiler CLI: ${(smoke.stdout || '').trim() || 'ok'}`);

  console.log('✅ Installation validation passed');
} catch (error) {
  console.error(`❌ Installation validation failed: ${error.message}`);
  process.exit(1);
}
