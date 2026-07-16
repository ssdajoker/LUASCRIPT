const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function findCommand(candidates, label) {
  const toolsDir = path.join(repoRoot, ".tools");
  
  function tryCommand(cmd) {
    for (const versionArg of ["--version", "-v"]) {
      const result = spawnSync(cmd, [versionArg], { encoding: 'utf8' });
      if (result.status === 0) return cmd;
    }
    return null;
  }
  
  for (const cmd of candidates) {
    const found = tryCommand(cmd);
    if (found) return found;
  }
  
  if (fs.existsSync(toolsDir)) {
    const toolSubdirs = fs.readdirSync(toolsDir);
    for (const subdir of toolSubdirs) {
      const toolPath = path.join(toolsDir, subdir);
      if (fs.statSync(toolPath).isDirectory()) {
        for (const cmd of candidates) {
          const cmdInTool = path.join(toolPath, cmd + (process.platform === "win32" ? ".exe" : ""));
          if (fs.existsSync(cmdInTool)) {
            const found = tryCommand(cmdInTool);
            if (found) return cmdInTool;
          }
          const binDir = path.join(toolPath, "bin");
          if (fs.existsSync(binDir)) {
            const cmdInBin = path.join(binDir, cmd + (process.platform === "win32" ? ".exe" : ""));
            if (fs.existsSync(cmdInBin)) {
              const found = tryCommand(cmdInBin);
              if (found) return cmdInBin;
            }
          }
        }
      }
    }
  }
  
  throw new Error(`Missing required dependency: ${label} (${candidates.join(' or ')})`);
}

function runCommand(cmd, args, label) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
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
  'examples/supported_math_showcase.ls',
  'examples/mathematical_notation_core.ls',
  'examples/mathematical_notation_rehab_v1.ls',
  'examples/mathematical_notation_rehab_v2.ls',
  'examples/mathematical_notation_rehab_v3.ls',
  'examples/mathematical_notation_rehab_v4.ls',
  'examples/mathematical_notation_rehab_v5.ls',
  'examples/mathematical_notation_rehab_v6.ls',
  'examples/mathematical_notation_rehab_v7.ls',
  'examples/mathematical_notation_rehab_v8.ls',
  'examples/mathematical_notation_rehab_v9.ls',
  'examples/mathematical_notation_rehab_v10.ls',
  'examples/mathematical_notation_rehab_v11.ls',
  'examples/mathematical_notation_rehab_v12.ls',
  'examples/mathematical_notation_rehab_v13.ls',
  'examples/mathematical_notation_rehab_v14.ls',
  'examples/mathematical_notation_rehab_v15.ls',
  'examples/mathematical_notation_rehab_v16.ls',
  'examples/mathematical_notation_rehab_v17.ls',
  'examples/mathematical_notation_rehab_v18.ls'
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
