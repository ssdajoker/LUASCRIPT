const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const mirrorRoot = path.join(repoRoot, 'mirror');
const modulesDir = path.join(mirrorRoot, 'modules');

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
  const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: env
  });

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    throw new Error(`${label} failed with status ${result.status}: ${message}`);
  }

  return result.stdout.trim();
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'luascript-mirror-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function listMirrorModules() {
  if (!fs.existsSync(modulesDir)) {
    throw new Error(`Mirror modules directory not found: ${modulesDir}`);
  }

  return fs
    .readdirSync(modulesDir)
    .filter((file) => file.endsWith('.ls'))
    .map((file) => path.join(modulesDir, file));
}

const pythonCmd = findCommand(['python3', 'python'], 'Python 3');
const mirrorModules = listMirrorModules();
const shouldRun = process.env.MIRROR_RUN === '1';

console.log('Running Project Mirror (Option B) harness...');
console.log(`Modules: ${mirrorModules.length}`);
console.log(`Execution: ${shouldRun ? 'compile + run' : 'compile only'}`);

mirrorModules.forEach((sourcePath) => {
  const baseName = path.basename(sourcePath, '.ls');

  withTempDir((tmpDir) => {
    const tempSource = path.join(tmpDir, `${baseName}.ls`);
    fs.copyFileSync(sourcePath, tempSource);

    console.log(`→ ${baseName}: compiling`);
    const compiledPath = path.join(tmpDir, `${baseName}.lua`);
    runCommand(
      pythonCmd,
      [path.join('src', 'luascript_compiler.py'), 'compile', tempSource, '-o', compiledPath],
      `${baseName} compile`
    );

    if (shouldRun) {
      console.log(`→ ${baseName}: executing`);
      runCommand(
        pythonCmd,
        [path.join('src', 'luascript_compiler.py'), 'run', tempSource],
        `${baseName} run`
      );
    }
  });
});

console.log('Project Mirror harness complete.');
