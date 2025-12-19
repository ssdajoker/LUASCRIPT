const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function findCommand(candidates, label) {
  for (const cmd of candidates) {
    const result = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return cmd;
  }
  throw new Error(`Missing required dependency: ${label} (${candidates.join(' or ')})`);
}

function runCommand(cmd, args, label) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    throw new Error(`${label} failed with status ${result.status}: ${message}`);
  }

  return result.stdout.trim();
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'luascript-example-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const pythonCmd = findCommand(['python3', 'python'], 'Python 3');
const examples = [
  'examples/hello.ls',
  'examples/simple.ls',
  'examples/simple_class.ls',
  'examples/vector.ls',
  'examples/mathematical_showcase.ls'
];

console.log('Running LUASCRIPT example integration tests...');

examples.forEach((relativePath) => {
  const sourcePath = path.join(repoRoot, relativePath);
  const baseName = path.basename(relativePath, '.ls');

  withTempDir((tmpDir) => {
    const tempSource = path.join(tmpDir, `${baseName}.ls`);
    fs.copyFileSync(sourcePath, tempSource);

    console.log(`→ ${baseName}: compiling`);
    const compiledPath = path.join(tmpDir, `${baseName}.lua`);
    runCommand(pythonCmd, [path.join('src', 'luascript_compiler.py'), 'compile', tempSource, '-o', compiledPath], `${baseName} compile`);

    console.log(`→ ${baseName}: executing`);
    runCommand(pythonCmd, [path.join('src', 'luascript_compiler.py'), 'run', tempSource], `${baseName} run`);
  });
});

console.log('All example integration tests passed.');
