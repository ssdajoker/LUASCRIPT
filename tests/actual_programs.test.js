const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "tests", "actual_programs", "manifest.json");

function findCommand(candidates, label) {
  const toolsDir = path.join(repoRoot, ".tools");
  
  function tryCommand(cmd) {
    for (const versionArg of ["--version", "-v"]) {
      const result = spawnSync(cmd, [versionArg], { encoding: "utf8" });
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
  
  throw new Error(`Missing required dependency: ${label} (${candidates.join(" or ")})`);
}

function runCommand(cmd, args, label, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONIOENCODING: "utf-8", ...options.env },
    timeout: options.timeout || 30000
  });

  const commandResult = {
    status: result.status,
    signal: result.signal,
    stdout: (result.stdout || "").replace(/\r\n/g, "\n").trim(),
    stderr: (result.stderr || "").replace(/\r\n/g, "\n").trim(),
    error: result.error
  };

  if (!options.allowFailure && result.status !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(`${label} failed with status ${result.status}: ${message}`);
  }

  return commandResult;
}

function assertRegex(actual, pattern, label) {
  const regex = new RegExp(pattern, "i");
  if (!regex.test(actual)) {
    throw new Error(`${label} did not match /${pattern}/i. Actual output: ${JSON.stringify(actual)}`);
  }
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "luascript-actual-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

delete require.cache[require.resolve(manifestPath)];
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const pythonCmd = findCommand(["python3", "python"], "Python 3");
const luaCmd = findCommand(["luajit", "lua"], "Lua interpreter");
const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");

console.log("Running LUASCRIPT actual-program tests...");

for (const program of manifest.programs) {
  const sourcePath = path.join(repoRoot, program.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing actual-program fixture: ${program.source}`);
  }

  withTempDir((tmpDir) => {
    const tempSource = path.join(tmpDir, `${program.name}.ls`);
    const compiledPath = path.join(tmpDir, `${program.name}.lua`);
    fs.copyFileSync(sourcePath, tempSource);

    console.log(`-> ${program.name}: compiling`);
    const compile = runCommand(
      pythonCmd,
      [path.join("src", "luascript_compiler.py"), "compile", tempSource, "-o", compiledPath],
      `${program.name} compile`,
      { allowFailure: Boolean(program.expectedFailure) }
    );

    if (program.expectedFailure) {
      if (compile.status === 0) {
        throw new Error(`${program.name} unexpectedly compiled successfully`);
      }
      const combined = `${compile.stdout}\n${compile.stderr}`.trim();
      for (const pattern of program.expectedFailurePatterns || []) {
        assertRegex(combined, pattern, `${program.name} expected compile diagnostic`);
      }
      return;
    }

    const compiled = fs.readFileSync(compiledPath, "utf8");
    if (!compiled.trim()) {
      throw new Error(`${program.name} compile produced empty Lua`);
    }
    if (/Unhandled node type|not yet supported/i.test(compiled)) {
      throw new Error(`${program.name} compile emitted placeholder Lua`);
    }

    console.log(`-> ${program.name}: executing`);
    const result = program.expectedRuntimeFailure
      ? runCommand(luaCmd, [compiledPath], `${program.name} lua`, {
        allowFailure: true,
        env: { LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}` }
      })
      : runCommand(
        pythonCmd,
        [path.join("src", "luascript_compiler.py"), "run", tempSource],
        `${program.name} run`
      );

    if (program.expectedRuntimeFailure) {
      if (result.status === 0) {
        throw new Error(`${program.name} unexpectedly ran successfully`);
      }
      const combined = `${result.stdout}\n${result.stderr}`.trim();
      for (const pattern of program.expectedRuntimeFailurePatterns || []) {
        assertRegex(combined, pattern, `${program.name} expected runtime diagnostic`);
      }
      return;
    }

    const expectedOutputs = program.expectedOutputIncludes || [];
    
    function normalizeOutput(output) {
      return output.replace(/(\d+)(\.0)(\s|\t|$)/g, '$1$3');
    }
    
    const normalizedOutput = normalizeOutput(result.stdout);
    const matched = expectedOutputs.some(expected => 
      normalizedOutput.includes(expected) || result.stdout.includes(expected)
    );
    if (!matched) {
      throw new Error(
        `${program.name} output missing any of ${JSON.stringify(expectedOutputs)}. Actual output: ${JSON.stringify(result.stdout)}`
      );
    }
  });
}

console.log("All LUASCRIPT actual-program tests passed.");
