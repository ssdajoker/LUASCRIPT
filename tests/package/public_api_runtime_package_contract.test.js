"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { createRequire } = require("module");

const repoRoot = path.resolve(__dirname, "..", "..");
const reportPath = path.join(
  repoRoot,
  "artifacts",
  "conformance",
  "public-api-runtime-package-report.json"
);
const tempPrefix = "luascript-public-package-contract-";

const expectedRootExports = [
  "AdvancedFeatures",
  "AgenticIDE",
  "CoreTranspiler",
  "PerformanceTools",
  "RuntimeSystem",
  "UnifiedLuaScript"
].sort();

const expectedUnifiedInstanceMethods = [
  "benchmark",
  "clearCaches",
  "createProject",
  "execute",
  "getCodeCompletion",
  "getPerformanceReport",
  "getSystemStatus",
  "initializeComponents",
  "openFile",
  "optimize",
  "profile",
  "shutdown",
  "startDebugging",
  "transformWithOOP",
  "transformWithPatterns",
  "transformWithTypes",
  "transpile",
  "transpileAndExecute",
  "transpileSource",
  "validateEvidence"
].sort();

const expectedUnifiedStaticMethods = [
  "createDevelopment",
  "createEnterprise",
  "createProduction",
  "validateEvidenceStatic"
].sort();

const forbiddenIrRootNames = [
  "FIELD_ALIAS_POLICIES",
  "IR",
  "KIND_ALIASES",
  "KIND_ALIAS_POLICIES",
  "RELEASE_IR_SURFACE_CONTRACT",
  "fixtureToSchemaArtifact",
  "ir",
  "legacyProgramToSchemaArtifact",
  "validateReleaseIrSurfaceMapping",
  "validateSchemaArtifactCompatibility"
].sort();

const expectedPackageFiles = [
  "src/",
  "test/",
  "examples/package/",
  "README.md",
  "LICENSE"
];

const expectedPackageExamples = [
  "examples/package/README.md",
  "examples/package/minimal-system.cjs",
  "examples/package/transpile-js-to-lua.cjs"
];

const expectedRuntimeDependencies = {
  acorn: "^8.15.0",
  esprima: "^4.0.1",
  luaparse: "^0.3.1",
  typescript: "5.9.3"
};

const requiredRootIgnorePatterns = [
  "artifacts/",
  "coverage/",
  ".nyc_output/",
  "reports/",
  "*.log",
  "static_warnings*.txt",
  "**/__pycache__/**",
  "**/*.pyc",
  "**/*.pyo",
  "**/*.backup",
  "**/*.bak",
  "src/**/*.test.ts",
  "src/**/tests/**",
  "src/**/*.prompt.md"
];

const requiredSourceIgnorePatterns = [
  "__pycache__/",
  "**/__pycache__/",
  "*.pyc",
  "**/*.pyc",
  "*.pyo",
  "**/*.pyo",
  "*.backup",
  "**/*.backup",
  "*.bak",
  "**/*.bak",
  "*.test.ts",
  "**/*.test.ts",
  "tests/",
  "**/tests/",
  "*.prompt.md",
  "**/*.prompt.md"
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function hashBuffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashFile(filePath) {
  return hashBuffer(fs.readFileSync(filePath));
}

function relativeRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function fileEvidence(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return {
    path: relativePath.replace(/\\/g, "/"),
    sha256: hashFile(absolutePath)
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedOwnMethodNames(owner, excluded = []) {
  const excludedNames = new Set(excluded);
  return Object.getOwnPropertyNames(owner)
    .filter(name => !excludedNames.has(name) && typeof owner[name] === "function")
    .sort();
}

function ignorePatterns(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}

function npmCliPath() {
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function quoteCmdArgument(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function runNpm(args, options = {}) {
  const spawnOptions = {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      NO_COLOR: "1",
      npm_config_color: "false"
    },
    maxBuffer: 32 * 1024 * 1024,
    timeout: options.timeoutMs || 120000,
    windowsHide: true
  };
  const cliPath = npmCliPath();
  let result;
  let command;

  if (cliPath) {
    command = [process.execPath, cliPath, ...args];
    result = spawnSync(process.execPath, [cliPath, ...args], spawnOptions);
  } else if (process.platform === "win32") {
    const comspec = process.env.ComSpec || process.env.COMSPEC || "cmd.exe";
    const npmCommand = path.join(path.dirname(process.execPath), "npm.cmd");
    const commandLine = [npmCommand, ...args].map(quoteCmdArgument).join(" ");
    command = [comspec, "/d", "/s", "/c", commandLine];
    result = spawnSync(comspec, ["/d", "/s", "/c", commandLine], spawnOptions);
  } else {
    command = ["npm", ...args];
    result = spawnSync("npm", args, spawnOptions);
  }

  return {
    command,
    status: result.status,
    signal: result.signal,
    error: result.error ? result.error.message : null,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function parsePackOutput(stdout) {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    }
    throw new Error("npm pack did not return parseable JSON");
  }
}

function normalizedPackedPath(filePath) {
  return String(filePath)
    .replace(/\\/g, "/")
    .replace(/^package\//, "")
    .replace(/^\.\//, "");
}

function forbiddenPackedFileReasons(filePath) {
  const normalized = normalizedPackedPath(filePath);
  const reasons = [];

  if (/(^|\/)__pycache__(\/|$)/i.test(normalized)) reasons.push("__pycache__");
  if (/\.(?:pyc|pyo)$/i.test(normalized)) reasons.push("compiled-python-cache");
  if (/\.(?:backup|bak)$/i.test(normalized)) reasons.push("backup-file");
  if (/^src\/.*\.test\.ts$/i.test(normalized)) reasons.push("source-local-test-ts");
  if (/^src\/(?:.*\/)?tests(?:\/|$)/i.test(normalized)) reasons.push("source-local-tests-directory");
  if (/^src\/.*\.prompt\.md$/i.test(normalized)) reasons.push("source-local-prompt");
  if (/^(?:artifacts|docs)(?:\/|$)/i.test(normalized)) reasons.push("repo-evidence-or-docs");
  if (/(^|\/)(?:archive|archives)(\/|$)/i.test(normalized)) reasons.push("archive-material");

  return reasons;
}

function safeRemoveExactTempRoot(tempRoot) {
  const tempBase = path.resolve(os.tmpdir());
  const resolvedRoot = path.resolve(tempRoot);
  const relative = path.relative(tempBase, resolvedRoot);
  const isDirectNamedChild =
    relative.length > 0 &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative) &&
    path.dirname(relative) === "." &&
    path.basename(resolvedRoot).startsWith(tempPrefix);

  if (!isDirectNamedChild) {
    throw new Error(`Refusing to remove unexpected temporary path: ${resolvedRoot}`);
  }

  fs.rmSync(resolvedRoot, { recursive: true, force: true });
  if (fs.existsSync(resolvedRoot)) {
    throw new Error(`Temporary path still exists after cleanup: ${resolvedRoot}`);
  }
}

async function componentControlEvidence(UnifiedLuaScript, packageVersion) {
  const details = {
    enableAllFalse: null,
    explicitComponents: []
  };
  let passed = true;

  let disabledSystem;
  try {
    disabledSystem = new UnifiedLuaScript({ enableAll: false });
    await disabledSystem.initializationPromise;
    const disabledFlags = [
      "enableTranspiler",
      "enableRuntime",
      "enableAdvanced",
      "enablePerformance",
      "enableIDE"
    ].reduce((flags, name) => {
      flags[name] = disabledSystem.options[name];
      return flags;
    }, {});
    details.enableAllFalse = {
      components: Array.from(disabledSystem.components.keys()).sort(),
      componentsLoaded: disabledSystem.stats.componentsLoaded,
      initialized: disabledSystem.stats.initialized,
      version: disabledSystem.stats.version,
      flags: disabledFlags
    };
    passed = passed &&
      details.enableAllFalse.components.length === 0 &&
      details.enableAllFalse.componentsLoaded === 0 &&
      details.enableAllFalse.initialized === true &&
      details.enableAllFalse.version === packageVersion &&
      Object.values(disabledFlags).every(value => value === false);
  } catch (error) {
    passed = false;
    details.enableAllFalse = { error: error.message };
  } finally {
    if (disabledSystem) disabledSystem.shutdown();
  }

  const componentCases = [
    {
      name: "transpiler",
      option: "enableTranspiler"
    },
    {
      name: "runtime",
      option: "enableRuntime",
      nestedOption: "runtime",
      nestedValue: { enableGPU: false, workerCount: 0 }
    },
    {
      name: "advanced",
      option: "enableAdvanced"
    },
    {
      name: "performance",
      option: "enablePerformance",
      nestedOption: "performance",
      nestedValue: { enableGPU: false, enableMonitoring: false }
    },
    {
      name: "ide",
      option: "enableIDE",
      nestedOption: "ide",
      nestedValue: {
        enableAI: false,
        enableDebugging: false,
        enableOptimization: false,
        enableCollaboration: false
      }
    }
  ];

  for (const componentCase of componentCases) {
    const options = {
      enableAll: true,
      enableTranspiler: false,
      enableRuntime: false,
      enableAdvanced: false,
      enablePerformance: false,
      enableIDE: false,
      [componentCase.option]: true
    };
    if (componentCase.nestedOption) {
      options[componentCase.nestedOption] = componentCase.nestedValue;
    }

    let system;
    try {
      system = new UnifiedLuaScript(options);
      await system.initializationPromise;
      const actualComponents = Array.from(system.components.keys()).sort();
      const detail = {
        name: componentCase.name,
        components: actualComponents,
        componentsLoaded: system.stats.componentsLoaded,
        initialized: system.stats.initialized,
        version: system.stats.version
      };
      detail.passed =
        sameJson(actualComponents, [componentCase.name]) &&
        detail.componentsLoaded === 1 &&
        detail.initialized === true &&
        detail.version === packageVersion;
      details.explicitComponents.push(detail);
      passed = passed && detail.passed;
    } catch (error) {
      passed = false;
      details.explicitComponents.push({
        name: componentCase.name,
        passed: false,
        error: error.message
      });
    } finally {
      if (system) system.shutdown();
    }
  }

  return { passed, details };
}

async function main() {
  const startedAt = Date.now();
  const checks = [];
  const packageJson = readJson("package.json");
  const packageLock = readJson("package-lock.json");
  const packageLockRoot = packageLock.packages && packageLock.packages[""];
  const rootIgnoreText = readText(".npmignore");
  const sourceIgnoreText = readText("src/.npmignore");
  const rootSourceText = readText("src/unified_luascript.js");
  const contractText = readText("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md");
  const rootModule = require(repoRoot);
  const UnifiedLuaScript = rootModule.UnifiedLuaScript;

  let tempRoot = null;
  let tarballEvidence = null;
  let installedConsumerEvidence = null;
  let installedPackageExampleEvidence = null;
  let nodeFloorEvidence = null;
  let cleanupEvidence = null;

  function check(name, passed, detail) {
    checks.push({
      name,
      passed: Boolean(passed),
      detail
    });
  }

  const rootExports = Object.keys(rootModule).sort();
  check(
    "package-metadata-identity-and-status",
    packageJson.name === "luascript" &&
      packageJson.version === "0.1.0-beta.0" &&
      packageJson.main === "src/unified_luascript.js" &&
      packageJson.luascript &&
      packageJson.luascript.version === packageJson.version &&
      packageJson.luascript.releaseTrack === "pre-production beta",
    {
      name: packageJson.name,
      version: packageJson.version,
      main: packageJson.main,
      embeddedVersion: packageJson.luascript && packageJson.luascript.version,
      releaseTrack: packageJson.luascript && packageJson.luascript.releaseTrack
    }
  );
  check(
    "package-version-status-contract-alignment",
    contractText.includes("`luascript` at `0.1.0-beta.0`") &&
      contractText.includes("pre-production beta") &&
      contractText.includes("`src/unified_luascript.js`"),
    {
      packageIdentityPresent: contractText.includes("`luascript` at `0.1.0-beta.0`"),
      releaseTrackPresent: contractText.includes("pre-production beta"),
      mainPresent: contractText.includes("`src/unified_luascript.js`")
    }
  );
  check(
    "package-engine-and-repository-metadata",
    packageJson.engines &&
      packageJson.engines.node === ">=14.17.0" &&
      packageJson.repository &&
      packageJson.repository.type === "git" &&
      packageJson.repository.url === "https://github.com/ssdajoker/LUASCRIPT.git" &&
      packageJson.bugs &&
      packageJson.bugs.url === "https://github.com/ssdajoker/LUASCRIPT/issues" &&
      packageJson.homepage === "https://github.com/ssdajoker/LUASCRIPT#readme",
    {
      engines: packageJson.engines,
      repository: packageJson.repository,
      bugs: packageJson.bugs,
      homepage: packageJson.homepage
    }
  );
  check(
    "public-contract-node-floor-alignment",
    contractText.includes(">=14.17.0"),
    {
      declaredEngine: packageJson.engines && packageJson.engines.node,
      contractMentionsDeclaredFloor: contractText.includes(">=14.17.0")
    }
  );
  check(
    "runtime-dependency-boundary",
    sameJson(packageJson.dependencies, expectedRuntimeDependencies) &&
      !Object.prototype.hasOwnProperty.call(packageJson.devDependencies || {}, "typescript") &&
      packageJson.devDependencies &&
      packageJson.devDependencies.yaml === "^2.8.2" &&
      packageJson.devDependencies["@types/esprima"] === "^4.0.6",
    {
      expectedRuntimeDependencies,
      actualRuntimeDependencies: packageJson.dependencies,
      typescriptDevDependency: packageJson.devDependencies && packageJson.devDependencies.typescript,
      yamlDevDependency: packageJson.devDependencies && packageJson.devDependencies.yaml,
      esprimaTypesDevDependency: packageJson.devDependencies && packageJson.devDependencies["@types/esprima"]
    }
  );
  check(
    "package-lock-runtime-boundary-alignment",
    packageLockRoot &&
      sameJson(packageLockRoot.dependencies, expectedRuntimeDependencies) &&
      packageLockRoot.engines &&
      packageLockRoot.engines.node === ">=14.17.0" &&
      !Object.prototype.hasOwnProperty.call(packageLockRoot.devDependencies || {}, "typescript") &&
      packageLockRoot.devDependencies &&
      packageLockRoot.devDependencies.yaml === "^2.8.2" &&
      packageLockRoot.devDependencies["@types/esprima"] === "^4.0.6" &&
      packageLock.packages["node_modules/typescript"] &&
      packageLock.packages["node_modules/typescript"].version === "5.9.3" &&
      packageLock.packages["node_modules/typescript"].engines &&
      packageLock.packages["node_modules/typescript"].engines.node === ">=14.17" &&
      packageLock.packages["node_modules/typescript"].dev !== true &&
      packageLock.packages["node_modules/yaml"] &&
      packageLock.packages["node_modules/yaml"].dev === true &&
      packageLock.packages["node_modules/@types/esprima"] &&
      packageLock.packages["node_modules/@types/esprima"].dev === true,
    {
      lockRuntimeDependencies: packageLockRoot && packageLockRoot.dependencies,
      lockEngine: packageLockRoot && packageLockRoot.engines,
      lockTypescript: packageLock.packages["node_modules/typescript"],
      lockYamlDev: packageLock.packages["node_modules/yaml"] &&
        packageLock.packages["node_modules/yaml"].dev,
      lockEsprimaTypesDev: packageLock.packages["node_modules/@types/esprima"] &&
        packageLock.packages["node_modules/@types/esprima"].dev
    }
  );
  check(
    "package-files-boundary-unchanged",
    sameJson(packageJson.files, expectedPackageFiles),
    {
      expected: expectedPackageFiles,
      actual: packageJson.files
    }
  );
  check(
    "package-has-no-bin-or-exports-map",
    !Object.prototype.hasOwnProperty.call(packageJson, "bin") &&
      !Object.prototype.hasOwnProperty.call(packageJson, "exports"),
    {
      hasBin: Object.prototype.hasOwnProperty.call(packageJson, "bin"),
      hasExports: Object.prototype.hasOwnProperty.call(packageJson, "exports")
    }
  );
  check(
    "root-export-surface-exact",
    sameJson(rootExports, expectedRootExports) &&
      rootExports.every(name => typeof rootModule[name] === "function"),
    {
      expected: expectedRootExports,
      actual: rootExports,
      types: Object.fromEntries(rootExports.map(name => [name, typeof rootModule[name]]))
    }
  );
  const presentIrRootNames = forbiddenIrRootNames.filter(name =>
    Object.prototype.hasOwnProperty.call(rootModule, name)
  );
  check(
    "ir-internals-absent-from-root",
    presentIrRootNames.length === 0,
    {
      forbidden: forbiddenIrRootNames,
      present: presentIrRootNames
    }
  );

  const unifiedInstanceMethods = sortedOwnMethodNames(
    UnifiedLuaScript.prototype,
    ["constructor"]
  );
  const unifiedStaticMethods = sortedOwnMethodNames(
    UnifiedLuaScript,
    ["length", "name", "prototype"]
  );
  check(
    "unified-instance-method-surface-exact",
    sameJson(unifiedInstanceMethods, expectedUnifiedInstanceMethods),
    {
      expected: expectedUnifiedInstanceMethods,
      actual: unifiedInstanceMethods
    }
  );
  check(
    "unified-static-method-surface-exact",
    sameJson(unifiedStaticMethods, expectedUnifiedStaticMethods),
    {
      expected: expectedUnifiedStaticMethods,
      actual: unifiedStaticMethods
    }
  );

  const componentControls = await componentControlEvidence(
    UnifiedLuaScript,
    packageJson.version
  );
  check(
    "unified-enable-all-false-and-explicit-component-controls",
    componentControls.passed,
    componentControls.details
  );

  const rootIgnorePatterns = ignorePatterns(rootIgnoreText);
  const sourceIgnorePatterns = ignorePatterns(sourceIgnoreText);
  check(
    "root-npmignore-hygiene-rules",
    requiredRootIgnorePatterns.every(pattern => rootIgnorePatterns.includes(pattern)),
    {
      required: requiredRootIgnorePatterns,
      actual: rootIgnorePatterns,
      missing: requiredRootIgnorePatterns.filter(pattern => !rootIgnorePatterns.includes(pattern))
    }
  );
  check(
    "source-npmignore-hygiene-rules",
    requiredSourceIgnorePatterns.every(pattern => sourceIgnorePatterns.includes(pattern)),
    {
      required: requiredSourceIgnorePatterns,
      actual: sourceIgnorePatterns,
      missing: requiredSourceIgnorePatterns.filter(pattern => !sourceIgnorePatterns.includes(pattern))
    }
  );

  const rootRuntimeReferences = [
    {
      pattern: "../runtime",
      present: /require\s*\(\s*["']\.\.\/runtime(?:\/|["'])/.test(rootSourceText)
    },
    {
      pattern: "runtime/runtime.lua",
      present: /runtime\/runtime\.lua/.test(rootSourceText)
    },
    {
      pattern: "runtime/core/enhanced_runtime.lua",
      present: /runtime\/core\/enhanced_runtime\.lua/.test(rootSourceText)
    }
  ];
  check(
    "public-root-source-does-not-reference-root-runtime",
    rootRuntimeReferences.every(reference => !reference.present),
    rootRuntimeReferences
  );

  try {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), tempPrefix));
    const packDirectory = path.join(tempRoot, "pack");
    const consumerDirectory = path.join(tempRoot, "consumer");
    fs.mkdirSync(packDirectory, { recursive: true });
    fs.mkdirSync(consumerDirectory, { recursive: true });

    const packResult = runNpm(
      ["pack", repoRoot, "--ignore-scripts", "--json"],
      { cwd: packDirectory, timeoutMs: 120000 }
    );
    check(
      "npm-pack-ignore-scripts-json",
      packResult.status === 0 && !packResult.error,
      {
        command: packResult.command,
        status: packResult.status,
        signal: packResult.signal,
        error: packResult.error,
        stdout: packResult.stdout,
        stderr: packResult.stderr
      }
    );

    let packRecord = null;
    try {
      const parsedPackOutput = parsePackOutput(packResult.stdout);
      packRecord = Array.isArray(parsedPackOutput) ? parsedPackOutput[0] : null;
      check(
        "npm-pack-json-record",
        Boolean(packRecord && packRecord.filename && Array.isArray(packRecord.files)),
        packRecord
      );
    } catch (error) {
      check("npm-pack-json-record", false, { error: error.message });
    }

    if (packRecord && packRecord.filename && Array.isArray(packRecord.files)) {
      const candidateTarballPath = path.resolve(packDirectory, packRecord.filename);
      const tarballInsidePackDirectory =
        path.dirname(candidateTarballPath) === path.resolve(packDirectory);
      check(
        "tarball-path-confined-to-temp-pack-directory",
        tarballInsidePackDirectory && fs.existsSync(candidateTarballPath),
        {
          filename: packRecord.filename,
          confined: tarballInsidePackDirectory,
          exists: fs.existsSync(candidateTarballPath)
        }
      );

      if (tarballInsidePackDirectory && fs.existsSync(candidateTarballPath)) {
        const packedFiles = packRecord.files
          .map(file => normalizedPackedPath(file.path))
          .sort();
        const requiredPackedFiles = [
          "package.json",
          "README.md",
          "LICENSE",
          "src/unified_luascript.js",
          ...expectedPackageExamples
        ];
        const missingRequiredFiles = requiredPackedFiles
          .filter(filePath => !packedFiles.includes(filePath));
        const hasSourceFiles = packedFiles.some(filePath => filePath.startsWith("src/"));
        const forbiddenMatches = packedFiles.flatMap(filePath =>
          forbiddenPackedFileReasons(filePath).map(reason => ({ path: filePath, reason }))
        );
        const unexpectedTopLevelFiles = packedFiles.filter(filePath =>
          !["LICENSE", "README.md", "package.json"].includes(filePath) &&
          !filePath.startsWith("src/") &&
          !filePath.startsWith("test/") &&
          !filePath.startsWith("examples/package/")
        );
        const packedPackageExamples = packedFiles.filter(filePath =>
          filePath.startsWith("examples/")
        );
        const rootRuntimeFiles = packedFiles.filter(filePath =>
          filePath === "runtime" || filePath.startsWith("runtime/")
        );
        const packageLockFiles = packedFiles.filter(filePath =>
          filePath === "package-lock.json" || filePath === "npm-shrinkwrap.json"
        );

        check(
          "tarball-required-package-files",
          missingRequiredFiles.length === 0 && hasSourceFiles,
          {
            required: requiredPackedFiles,
            missing: missingRequiredFiles,
            hasSourceFiles
          }
        );
        check(
          "tarball-hygiene-exclusions",
          forbiddenMatches.length === 0 && unexpectedTopLevelFiles.length === 0,
          {
            forbiddenMatches,
            unexpectedTopLevelFiles
          }
        );
        check(
          "tarball-public-example-surface-exact",
          sameJson(packedPackageExamples, expectedPackageExamples),
          {
            expected: expectedPackageExamples,
            actual: packedPackageExamples
          }
        );
        check(
          "tarball-root-runtime-intentionally-absent",
          rootRuntimeFiles.length === 0,
          {
            rootRuntimeFiles,
            sourceRuntimePresent: packedFiles.some(filePath =>
              filePath.startsWith("src/runtime/")
            )
          }
        );
        check(
          "tarball-lockfiles-not-published",
          packageLockFiles.length === 0,
          {
            packageLockFiles
          }
        );

        const tarballStat = fs.statSync(candidateTarballPath);
        tarballEvidence = {
          name: packRecord.name,
          version: packRecord.version,
          filename: packRecord.filename,
          sha256: hashFile(candidateTarballPath),
          sizeBytes: tarballStat.size,
          npmReportedSizeBytes: packRecord.size,
          npmReportedUnpackedSizeBytes: packRecord.unpackedSize,
          fileCount: packedFiles.length,
          npmReportedEntryCount: packRecord.entryCount,
          fileListSha256: hashBuffer(`${packedFiles.join("\n")}\n`),
          files: packedFiles
        };
        check(
          "tarball-size-and-file-count-consistent",
          tarballEvidence.sizeBytes === packRecord.size &&
            tarballEvidence.fileCount === packRecord.entryCount,
          tarballEvidence
        );

        fs.writeFileSync(
          path.join(consumerDirectory, "package.json"),
          `${JSON.stringify({
            name: "luascript-package-contract-consumer",
            version: "1.0.0",
            private: true
          }, null, 2)}\n`,
          "utf8"
        );
        const installResult = runNpm(
          [
            "install",
            candidateTarballPath,
            "--ignore-scripts",
            "--omit=dev",
            "--no-audit",
            "--no-fund",
            "--package-lock=false"
          ],
          { cwd: consumerDirectory, timeoutMs: 180000 }
        );
        check(
          "clean-consumer-npm-install-ignore-scripts",
          installResult.status === 0 && !installResult.error,
          {
            command: installResult.command,
            status: installResult.status,
            signal: installResult.signal,
            error: installResult.error,
            stdout: installResult.stdout,
            stderr: installResult.stderr
          }
        );

        if (installResult.status === 0 && !installResult.error) {
          try {
            const consumerRequire = createRequire(
              path.join(consumerDirectory, "consumer-entry.cjs")
            );
            const installedModule = consumerRequire("luascript");
            const installedPackagePath = consumerRequire.resolve("luascript/package.json");
            const installedPackageRoot = path.dirname(installedPackagePath);
            const installedPackageJson = JSON.parse(
              fs.readFileSync(installedPackagePath, "utf8")
            );
            const installedRootExports = Object.keys(installedModule).sort();
            const installedIrRootNames = forbiddenIrRootNames.filter(name =>
              Object.prototype.hasOwnProperty.call(installedModule, name)
            );
            const transpiler = new installedModule.CoreTranspiler({
              optimize: false,
              sourceMap: false
            });
            const smokeResult = transpiler.transpile(
              "const answer = 6 * 7;",
              "package-consumer-smoke.js"
            );
            const smokeLua = typeof smokeResult === "string"
              ? smokeResult
              : smokeResult && smokeResult.code;
            const smokePassed =
              typeof smokeLua === "string" &&
              /local\s+answer\s*=\s*\(?6\s*\*\s*7\)?/.test(smokeLua);
            const installedRuntimePath = path.join(installedPackageRoot, "runtime");
            const installedRootSourcePath = path.join(
              installedPackageRoot,
              "src",
              "unified_luascript.js"
            );
            const installedRootSource = fs.readFileSync(installedRootSourcePath, "utf8");
            const installedRootRuntimeReferences = [
              /require\s*\(\s*["']\.\.\/runtime(?:\/|["'])/.test(installedRootSource),
              /runtime\/runtime\.lua/.test(installedRootSource),
              /runtime\/core\/enhanced_runtime\.lua/.test(installedRootSource)
            ];
            const installedTypeScriptPath = consumerRequire.resolve(
              "typescript/package.json"
            );
            const installedTypeScript = JSON.parse(
              fs.readFileSync(installedTypeScriptPath, "utf8")
            );

            installedConsumerEvidence = {
              package: {
                name: installedPackageJson.name,
                version: installedPackageJson.version,
                main: installedPackageJson.main
              },
              rootExports: installedRootExports,
              irRootNamesPresent: installedIrRootNames,
              smoke: {
                source: "const answer = 6 * 7;",
                lua: smokeLua,
                passed: smokePassed
              },
              typescript: {
                version: installedTypeScript.version,
                engines: installedTypeScript.engines
              },
              rootRuntimePresent: fs.existsSync(installedRuntimePath),
              publicRootReferencesRootRuntime: installedRootRuntimeReferences.some(Boolean)
            };
            check(
              "installed-consumer-root-import-and-smoke",
              installedPackageJson.name === "luascript" &&
                installedPackageJson.version === packageJson.version &&
                sameJson(installedRootExports, expectedRootExports) &&
                installedIrRootNames.length === 0 &&
                smokePassed,
              installedConsumerEvidence
            );
            check(
              "installed-consumer-typescript-runtime-dependency",
              installedTypeScript.version === "5.9.3" &&
                installedTypeScript.engines &&
                installedTypeScript.engines.node === ">=14.17",
              installedConsumerEvidence.typescript
            );
            check(
              "installed-consumer-root-runtime-boundary",
              !installedConsumerEvidence.rootRuntimePresent &&
                !installedConsumerEvidence.publicRootReferencesRootRuntime,
              {
                rootRuntimePresent: installedConsumerEvidence.rootRuntimePresent,
                publicRootReferencesRootRuntime:
                  installedConsumerEvidence.publicRootReferencesRootRuntime
              }
            );

            const exampleRuns = expectedPackageExamples
              .filter(examplePath => examplePath.endsWith(".cjs"))
              .map(examplePath => {
                const absoluteExamplePath = path.join(
                  installedPackageRoot,
                  ...examplePath.split("/")
                );
                const result = spawnSync(process.execPath, [absoluteExamplePath], {
                  cwd: consumerDirectory,
                  encoding: "utf8",
                  env: {
                    ...process.env,
                    NO_COLOR: "1"
                  },
                  maxBuffer: 4 * 1024 * 1024,
                  timeout: 30000,
                  windowsHide: true
                });
                return {
                  path: examplePath,
                  exists: fs.existsSync(absoluteExamplePath),
                  sha256: fs.existsSync(absoluteExamplePath)
                    ? hashFile(absoluteExamplePath)
                    : null,
                  status: result.status,
                  signal: result.signal,
                  error: result.error ? result.error.message : null,
                  stdout: result.stdout || "",
                  stderr: result.stderr || ""
                };
              });
            installedPackageExampleEvidence = {
              examples: exampleRuns
            };
            check(
              "installed-package-public-examples-execute",
              exampleRuns.length === 2 &&
                exampleRuns.every(example =>
                  example.exists &&
                  example.status === 0 &&
                  !example.error &&
                  example.stdout.includes("LUASCRIPT_PACKAGE_EXAMPLE=")
                ),
              installedPackageExampleEvidence
            );

            const nodeFloorScriptPath = path.join(
              consumerDirectory,
              "node-floor-consumer-smoke.cjs"
            );
            const nodeFloorScript = [
              "\"use strict\";",
              "var luascript = require(\"luascript\");",
              `var expected = ${JSON.stringify(expectedRootExports)};`,
              "var actual = Object.keys(luascript).sort();",
              "if (JSON.stringify(actual) !== JSON.stringify(expected)) {",
              "  throw new Error(\"Node-floor root export mismatch: \" + JSON.stringify(actual));",
              "}",
              "var transpiler = new luascript.CoreTranspiler({ optimize: false, sourceMap: false });",
              "var result = transpiler.transpile(\"const answer = 6 * 7;\", \"node-floor-smoke.js\");",
              "var lua = typeof result === \"string\" ? result : result && result.code;",
              "if (typeof lua !== \"string\" || !/local\\s+answer\\s*=\\s*\\(?6\\s*\\*\\s*7\\)?/.test(lua)) {",
              "  throw new Error(\"Node-floor transpile smoke failed: \" + String(lua));",
              "}",
              "process.stdout.write(\"LUASCRIPT_NODE_FLOOR_RESULT=\" + JSON.stringify({",
              "  nodeVersion: process.version,",
              "  rootExports: actual,",
              "  lua: lua",
              "}) + \"\\n\");",
              ""
            ].join("\n");
            fs.writeFileSync(nodeFloorScriptPath, nodeFloorScript, "utf8");
            const nodeFloorResult = runNpm(
              [
                "exec",
                "--yes",
                "--package=node@14.17.1",
                "--",
                "node",
                nodeFloorScriptPath
              ],
              { cwd: consumerDirectory, timeoutMs: 180000 }
            );
            const marker = "LUASCRIPT_NODE_FLOOR_RESULT=";
            const resultLine = nodeFloorResult.stdout
              .split(/\r?\n/)
              .find(line => line.startsWith(marker));
            let floorPayload = null;
            if (resultLine) {
              try {
                floorPayload = JSON.parse(resultLine.slice(marker.length));
              } catch (_error) {
                floorPayload = null;
              }
            }
            nodeFloorEvidence = {
              declaredFloor: packageJson.engines && packageJson.engines.node,
              requestedExecutableProbe: "node@14.17.1",
              rationale: "node@14.17.0 is unavailable; 14.17.1 is the first available compatible patch for the declared >=14.17.0 floor",
              command: nodeFloorResult.command,
              status: nodeFloorResult.status,
              signal: nodeFloorResult.signal,
              error: nodeFloorResult.error,
              stdout: nodeFloorResult.stdout,
              stderr: nodeFloorResult.stderr,
              scriptSha256: hashBuffer(Buffer.from(nodeFloorScript, "utf8")),
              observed: floorPayload
            };
            check(
              "node-14-17-1-installed-consumer-floor-smoke",
              nodeFloorResult.status === 0 &&
                !nodeFloorResult.error &&
                floorPayload &&
                floorPayload.nodeVersion === "v14.17.1" &&
                sameJson(floorPayload.rootExports, expectedRootExports) &&
                typeof floorPayload.lua === "string" &&
                /local\s+answer\s*=\s*\(?6\s*\*\s*7\)?/.test(floorPayload.lua),
              nodeFloorEvidence
            );
          } catch (error) {
            check(
              "installed-consumer-inspection",
              false,
              { error: error.stack || error.message }
            );
          }
        }
      }
    }
  } catch (error) {
    check(
      "package-contract-temp-workflow",
      false,
      { error: error.stack || error.message }
    );
  } finally {
    if (tempRoot) {
      try {
        safeRemoveExactTempRoot(tempRoot);
        cleanupEvidence = {
          prefix: tempPrefix,
          removed: true
        };
        check("exact-temporary-root-cleaned", true, cleanupEvidence);
      } catch (error) {
        cleanupEvidence = {
          prefix: tempPrefix,
          removed: false,
          error: error.message
        };
        check("exact-temporary-root-cleaned", false, cleanupEvidence);
      }
    } else {
      cleanupEvidence = {
        prefix: tempPrefix,
        removed: false,
        error: "temporary root was not created"
      };
      check("exact-temporary-root-cleaned", false, cleanupEvidence);
    }
  }

  const npmVersionResult = runNpm(["--version"], {
    cwd: repoRoot,
    timeoutMs: 30000
  });
  const inputEvidence = {
    packageJson: fileEvidence("package.json"),
    packageLock: fileEvidence("package-lock.json"),
    rootNpmIgnore: fileEvidence(".npmignore"),
    sourceNpmIgnore: fileEvidence("src/.npmignore"),
    rootModule: fileEvidence("src/unified_luascript.js"),
    harness: fileEvidence("tests/package/public_api_runtime_package_contract.test.js"),
    contract: fileEvidence("docs/LUASCRIPT_PUBLIC_API_RUNTIME_CONTRACT.md"),
    packageExampleReadme: fileEvidence("examples/package/README.md"),
    packageExampleMinimalSystem: fileEvidence("examples/package/minimal-system.cjs"),
    packageExampleTranspile: fileEvidence("examples/package/transpile-js-to-lua.cjs")
  };
  const failures = checks.filter(checkResult => !checkResult.passed);
  const report = {
    schemaVersion: 1,
    kind: "luascript:public-api-runtime-package-contract",
    command: "npm run test:package-contract",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    environment: {
      node: process.version,
      npm: {
        available: npmVersionResult.status === 0 && !npmVersionResult.error,
        version: npmVersionResult.stdout.trim() || null,
        stderr: npmVersionResult.stderr
      },
      platform: process.platform,
      arch: process.arch,
      os: {
        type: os.type(),
        release: os.release()
      },
      cwd: process.cwd(),
      nodeFloorExecutableProbe: "v14.17.1"
    },
    inputs: inputEvidence,
    expected: {
      package: {
        name: "luascript",
        version: "0.1.0-beta.0",
        releaseTrack: "pre-production beta",
        main: "src/unified_luascript.js",
        engines: { node: ">=14.17.0" },
        files: expectedPackageFiles,
        runtimeDependencies: expectedRuntimeDependencies,
        repository: {
          type: "git",
          url: "https://github.com/ssdajoker/LUASCRIPT.git"
        },
        bugs: {
          url: "https://github.com/ssdajoker/LUASCRIPT/issues"
        },
        homepage: "https://github.com/ssdajoker/LUASCRIPT#readme"
      },
      rootExports: expectedRootExports,
      unifiedInstanceMethods: expectedUnifiedInstanceMethods,
      unifiedStaticMethods: expectedUnifiedStaticMethods,
      forbiddenIrRootNames,
      packageExamples: expectedPackageExamples,
      nodeFloorExecutableProbe: {
        package: "node@14.17.1",
        expectedVersion: "v14.17.1"
      }
    },
    tarball: tarballEvidence,
    installedConsumer: installedConsumerEvidence,
    installedPackageExamples: installedPackageExampleEvidence,
    nodeFloor: nodeFloorEvidence,
    cleanup: cleanupEvidence,
    checks,
    summary: {
      total: checks.length,
      passed: checks.length - failures.length,
      failed: failures.length
    },
    failures
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `Public API/runtime/package contract: ${report.summary.passed}/${report.summary.total} checks passed`
  );
  console.log(`Report: ${relativeRepoPath(reportPath)}`);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL ${failure.name}: ${JSON.stringify(failure.detail)}`);
    }
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
