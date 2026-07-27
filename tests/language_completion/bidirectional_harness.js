"use strict";

const fs = require("fs");
const path = require("path");

const {
  repoRoot,
  findCommand,
  runCommand,
  withTempDir,
  writeJsonReport,
  commandSummary
} = require("../clarity_canon/runner_utils");
const {
  CoreLanguageBridge
} = require("../../src/compilers");
const {
  extractLuascriptCompileTimeBlocks
} = require("../../src/compilers/luascript-to-ir");

const languageName = process.argv[2];
if (!languageName) {
  console.error("Usage: node tests/language_completion/bidirectional_harness.js <language>");
  process.exit(1);
}

const manifestPath = path.join(repoRoot, "tests", "language_completion", "manifests", `${languageName}.json`);
if (!fs.existsSync(manifestPath)) {
  console.error(`Missing language completion manifest: ${path.relative(repoRoot, manifestPath)}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const reportPath = path.join(repoRoot, "artifacts", "language_completion", `${languageName}-report.json`);
const configuredRuntimeTimeoutMs = Number.parseInt(process.env.LANGUAGE_RUNTIME_TIMEOUT_MS || "15000", 10);
const runtimeTimeoutMs = Number.isFinite(configuredRuntimeTimeoutMs) && configuredRuntimeTimeoutMs > 0
  ? configuredRuntimeTimeoutMs
  : 15000;
const bridge = new CoreLanguageBridge();

function compactOutput(value) {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map(line => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

const repairEvidenceRules = {
  lua: {
    indexing: { zero_based: ["__ls_index"] },
    length: { array_length_property: ["__ls_length"] },
    slicing: { runtime_slice: ["__ls_slice"] },
    truthiness: { js_truthy: ["__ls_truthy"] },
    string_coercion: { explicit_tostring: ["__ls_add"] },
    multiple_returns: { packed_array: ["__ls_many"] }
  },
  python: {
    indexing: { zero_based: ["__ls_index"] },
    length: { array_length_property: ["len("] },
    slicing: { runtime_slice: ["__ls_slice"] },
    truthiness: { js_truthy: ["__ls_truthy"] },
    string_coercion: { explicit_tostring: ["__ls_add"] },
    multiple_returns: { packed_array: ["return ["] }
  }
};

function assertOutput(result, expected, label) {
  let actual = compactOutput(result.stdout);
  
  function normalizeFloatOutput(str) {
    return str.replace(/(\d+)(\.0)(\s|\t|\n|$|,|\]|\}|\/)/g, '$1$3');
  }
  
  const normalizedActual = normalizeFloatOutput(actual);
  const normalizedExpected = normalizeFloatOutput(expected);
  
  if (normalizedActual !== normalizedExpected && actual !== expected) {
    fail(`${label} output mismatch. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, {
      command: commandSummary(result)
    });
  }
}

function expectedOutputForRuntime(fixture, verification, runtimeName) {
  if (fixture.expectedOutputs && fixture.expectedOutputs[runtimeName]) {
    return fixture.expectedOutputs[runtimeName];
  }
  if (verification[`${runtimeName}_stdout`]) {
    return verification[`${runtimeName}_stdout`];
  }
  return fixture.expectedOutput || verification.stdout;
}

function expectedRuntimeErrorForRuntime(fixture, verification, runtimeName) {
  if (fixture.expectedRuntimeFailures && fixture.expectedRuntimeFailures[runtimeName]) {
    return fixture.expectedRuntimeFailures[runtimeName];
  }
  if (verification[`${runtimeName}_runtime_error`]) {
    return verification[`${runtimeName}_runtime_error`];
  }
  return null;
}

const targetStdoutDirectiveNames = {
  lua: "lua_stdout",
  javascript: "js_stdout",
  python: "python_stdout",
  luascript: "ls_stdout"
};

function verifyRepairRuntimeProof(target, verification, label) {
  const stdoutKey = `${target}_stdout`;
  if (Object.prototype.hasOwnProperty.call(verification, stdoutKey) && typeof verification[stdoutKey] === "string") {
    return;
  }

  const directiveName = targetStdoutDirectiveNames[target] || stdoutKey;
  fail(`${label} repair assertion for ${target} requires verify ${directiveName} for runtime parity`);
}

function assertCommandFailedWith(result, expectedPattern, label) {
  if (result.status === 0) {
    fail(`${label} unexpectedly passed`, {
      command: commandSummary(result)
    });
  }
  const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;
  const pattern = new RegExp(expectedPattern, "i");
  if (!pattern.test(combinedOutput)) {
    fail(`${label} failed with wrong runtime diagnostic. Expected ${JSON.stringify(expectedPattern)}, got ${JSON.stringify(compactOutput(combinedOutput))}`, {
      command: commandSummary(result)
    });
  }
}

function assertCommandPassed(result, label) {
  if (result.status !== 0) {
    fail(`${label} failed: ${result.stderr || result.stdout || result.error || "unknown failure"}`, {
      command: commandSummary(result)
    });
  }
}

function resolveCommand(candidates, label) {
  return findCommand(candidates.filter(Boolean), label);
}

function bundledDotnetClangExecutable(executableName) {
  const dotnetPackRoot = path.join(
    "C:",
    "Program Files",
    "dotnet",
    "packs",
    "Microsoft.NET.Runtime.Emscripten.3.1.56.Sdk.win-x64"
  );
  if (!fs.existsSync(dotnetPackRoot)) return null;
  const versions = fs.readdirSync(dotnetPackRoot).sort().reverse();
  for (const version of versions) {
    const candidate = path.join(dotnetPackRoot, version, "tools", "bin", executableName);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const runtimeCommands = {};
function runtime(name) {
  if (!runtimeCommands[name]) {
    const runtimes = {
      node: () => resolveCommand(["node"], "Node.js"),
      python: () => resolveCommand(["python3", "python"], "Python 3"),
      lua: () => resolveCommand(["luajit", "lua"], "Lua interpreter"),
      c: () => resolveCommand([process.env.CC, "clang", "gcc", "cc", bundledDotnetClangExecutable("clang.exe")], "C compiler"),
      cpp: () => resolveCommand([process.env.CXX, "clang++", "g++", "c++", bundledDotnetClangExecutable("clang++.exe")], "C++ compiler"),
      csharp: () => resolveCommand(["dotnet"], ".NET SDK"),
      java: () => resolveCommand(["java"], "Java runtime"),
      javac: () => resolveCommand(["javac"], "Java compiler"),
      go: () => resolveCommand(["go"], "Go toolchain"),
      kotlin: () => resolveCommand(["kotlinc", "kotlinc.cmd"], "Kotlin compiler"),
      ruby: () => resolveCommand(["ruby"], "Ruby runtime"),
      php: () => resolveCommand(["php"], "PHP runtime"),
      rust: () => resolveCommand(["rustc"], "Rust compiler"),
      dart: () => resolveCommand(["dart"], "Dart runtime"),
      elm: () => resolveCommand(["elm"], "Elm runtime"),
      gleam: () => resolveCommand(["gleam"], "Gleam runtime")
    };
    if (!runtimes[name]) {
      throw new Error(`Unknown runtime: ${name}`);
    }
    runtimeCommands[name] = runtimes[name]();
  }
  return runtimeCommands[name];
}

function compileToIR(source, language) {
  return bridge.compileToIR(source, language);
}

function emitTarget(root, target, sourceLanguage) {
  return bridge.emitFromIR(root, target, sourceLanguage);
}

function runLuaSource(luaSource, label) {
  return withTempDir("luascript-language-lua-", (tmpDir) => {
    const luaPath = path.join(tmpDir, `${label}.lua`);
    const luaWithPolyfill = `-- math.pow polyfill for Lua 5.4 compatibility
if not math.pow then math.pow = function(x, y) return x ^ y end end

${luaSource}`;
    fs.writeFileSync(luaPath, luaWithPolyfill, "utf8");
    return runCommand(runtime("lua"), [luaPath], `${label} lua`, {
      timeout: runtimeTimeoutMs,
      env: {
        LUA_PATH: `${path.join(repoRoot, "runtime").replace(/\\/g, "/")}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
  });
}

function runJavaScriptSource(jsSource, label) {
  return withTempDir("luascript-language-js-", (tmpDir) => {
    const jsPath = path.join(tmpDir, `${label}.js`);
    fs.writeFileSync(jsPath, jsSource, "utf8");
    return runCommand(runtime("node"), [jsPath], `${label} javascript`, { timeout: runtimeTimeoutMs });
  });
}

function runTypeScriptSource(tsSource, label) {
  const jsSource = bridge.transpileSource(tsSource, {
    sourceLanguage: "typescript",
    targetLanguage: "javascript",
    filename: `${label}.ts`
  }).code;
  return runJavaScriptSource(jsSource, `${label}-typescript-transpiled`);
}

function runPythonSource(pythonSource, label) {
  return withTempDir("luascript-language-python-", (tmpDir) => {
    const pythonPath = path.join(tmpDir, `${label}.py`);
    fs.writeFileSync(pythonPath, pythonSource, "utf8");
    return runCommand(runtime("python"), [pythonPath], `${label} python`, {
      timeout: runtimeTimeoutMs,
      env: {
        PYTHONIOENCODING: "utf-8"
      }
    });
  });
}

function runRubySource(rubySource, label) {
  return withTempDir("luascript-language-ruby-", (tmpDir) => {
    const rubyPath = path.join(tmpDir, `${label}.rb`);
    fs.writeFileSync(rubyPath, `${rubySource}\nmain if defined?(main)\n`, "utf8");
    return runCommand(runtime("ruby"), [rubyPath], `${label} ruby`, {
      timeout: runtimeTimeoutMs
    });
  });
}

function runPhpSource(phpSource, label) {
  return withTempDir("luascript-language-php-", (tmpDir) => {
    const phpPath = path.join(tmpDir, `${label}.php`);
    const entrypoint = "if (function_exists('main')) { main(); }";
    const runnableSource = phpSource.includes("?>")
      ? `${phpSource}\n<?php ${entrypoint} ?>\n`
      : `${phpSource}\n${entrypoint}\n`;
    fs.writeFileSync(phpPath, runnableSource, "utf8");
    return runCommand(runtime("php"), [phpPath], `${label} php`, {
      timeout: runtimeTimeoutMs
    });
  });
}

function runDartSource(dartSource, label) {
  return withTempDir("luascript-language-dart-", (tmpDir) => {
    const dartPath = path.join(tmpDir, `${label}.dart`);
    fs.writeFileSync(dartPath, dartSource, "utf8");
    return runCommand(runtime("dart"), [dartPath], `${label} dart`, {
      timeout: runtimeTimeoutMs
    });
  });
}

function runGoSource(goSource, label) {
  return withTempDir("luascript-language-go-", (tmpDir) => {
    const goPath = path.join(tmpDir, `${label}.go`);
    fs.writeFileSync(goPath, goSource, "utf8");
    return runCommand(runtime("go"), ["run", goPath], `${label} go`, {
      timeout: Math.max(runtimeTimeoutMs, 60000)
    });
  });
}

function runCSharpSource(csharpSource, label) {
  return withTempDir("luascript-language-csharp-", (tmpDir) => {
    const projectPath = path.join(tmpDir, `${label}.csproj`);
    const sourcePath = path.join(tmpDir, "Program.cs");
    fs.writeFileSync(projectPath, [
      "<Project Sdk=\"Microsoft.NET.Sdk\">",
      "  <PropertyGroup>",
      "    <OutputType>Exe</OutputType>",
      "    <TargetFramework>net9.0</TargetFramework>",
      "    <ImplicitUsings>disable</ImplicitUsings>",
      "    <Nullable>disable</Nullable>",
      "    <NoWarn>CS0219;CS8321</NoWarn>",
      "  </PropertyGroup>",
      "</Project>",
      ""
    ].join("\n"), "utf8");
    fs.writeFileSync(sourcePath, csharpSource, "utf8");
    return runCommand(runtime("csharp"), ["run", "--project", projectPath, "--nologo", "--verbosity", "quiet"], `${label} csharp`, {
      timeout: Math.max(runtimeTimeoutMs, 60000),
      env: {
        DOTNET_CLI_TELEMETRY_OPTOUT: "1",
        DOTNET_NOLOGO: "1",
        DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1"
      }
    });
  });
}

function javaPublicClassName(source, label) {
  const match = source.match(/\bpublic\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/);
  if (!match) {
    throw new Error(`${label} java source does not declare a public class`);
  }
  return match[1];
}

function runJavaSource(javaSource, label) {
  return withTempDir("luascript-language-java-", (tmpDir) => {
    const className = javaPublicClassName(javaSource, label);
    const sourcePath = path.join(tmpDir, `${className}.java`);
    fs.writeFileSync(sourcePath, javaSource, "utf8");

    const compile = runCommand(runtime("javac"), ["-d", tmpDir, sourcePath], `${label} java compile`, {
      timeout: Math.max(runtimeTimeoutMs, 60000)
    });
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }
    const result = runCommand(runtime("java"), ["-cp", tmpDir, className], `${label} java runtime`, {
      timeout: runtimeTimeoutMs
    });
    return { compile, runtime: result };
  });
}

function runCompiledNativeSource(source, label, language) {
  return withTempDir(`luascript-language-${language}-`, (tmpDir) => {
    const extension = language === "cpp" ? "cpp" : "c";
    const sourcePath = path.join(tmpDir, `${label}.${extension}`);
    const exePath = path.join(tmpDir, `${label}.exe`);
    fs.writeFileSync(sourcePath, source, "utf8");

    const args = language === "cpp"
      ? [sourcePath, "-std=c++17", "-Wno-everything", "-o", exePath]
      : [sourcePath, "-std=c11", "-Wno-everything", "-o", exePath];
    const compile = runCommand(runtime(language), args, `${label} ${language} compile`, {
      timeout: Math.max(runtimeTimeoutMs, 60000)
    });
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }
    const result = runCommand(exePath, [], `${label} ${language} runtime`, {
      timeout: runtimeTimeoutMs
    });
    return { compile, runtime: result };
  });
}

function runRustSource(source, label) {
  return withTempDir("luascript-language-rust-", (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.rs`);
    const exePath = path.join(tmpDir, `${label}.exe`);
    fs.writeFileSync(sourcePath, source, "utf8");

    const compile = runCommand(runtime("rust"), [sourcePath, "-o", exePath], `${label} rust compile`, {
      timeout: Math.max(runtimeTimeoutMs, 60000)
    });
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }
    const result = runCommand(exePath, [], `${label} rust runtime`, {
      timeout: runtimeTimeoutMs
    });
    return { compile, runtime: result };
  });
}

function runKotlinSource(source, label) {
  return withTempDir("luascript-language-kotlin-", (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.kt`);
    const jarPath = path.join(tmpDir, `${label}.jar`);
    fs.writeFileSync(sourcePath, normalizeKotlinNativeSource(source), "utf8");

    const compile = runCommand(runtime("kotlin"), [sourcePath, "-include-runtime", "-d", jarPath], `${label} kotlin compile`, {
      timeout: Math.max(runtimeTimeoutMs, 60000)
    });
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }
    const result = runCommand(runtime("java"), ["-jar", jarPath], `${label} kotlin runtime`, {
      timeout: runtimeTimeoutMs
    });
    return { compile, runtime: result };
  });
}

function normalizeKotlinNativeSource(source) {
  return source.replace(/^(\s*)println\(([^()\n]+)\)$/gm, (match, indent, argsText) => {
    const args = argsText.split(",").map(arg => arg.trim()).filter(Boolean);
    if (args.length <= 1) {
      return match;
    }
    return `${indent}println(listOf(${args.join(", ")}).joinToString(" "))`;
  });
}

function gleamProjectName(label) {
  return `gleam_${label.replace(/[^A-Za-z0-9_]/g, "_").toLowerCase()}`;
}

function normalizeGleamNativeSource(source) {
  return source
    .replace(/!\(([^()]+?)\s*==\s*([^()]+?)\)/g, "$1 != $2")
    .replace(/if\s+([^{}\n]+?)\s*\{\s*([^{}\n]+?)\s*\}\s*else\s*\{\s*([^{}\n]+?)\s*\}/g, "case $1 { True -> $2 False -> $3 }");
}

function runGleamSource(source, label) {
  return withTempDir("luascript-language-gleam-", (tmpDir) => {
    const projectName = gleamProjectName(label);
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "gleam.toml"), [
      `name = "${projectName}"`,
      "version = \"1.0.0\"",
      "",
      "[dependencies]",
      "gleam_stdlib = \">= 0.44.0 and < 2.0.0\"",
      ""
    ].join("\n"), "utf8");

    const prelude = [
      "import gleam/io",
      "import gleam/list",
      "import gleam/string",
      "",
      "fn print(value) {",
      "  let rendered = string.inspect(value)",
      "  case string.starts_with(rendered, \"\\\"\") && string.ends_with(rendered, \"\\\"\") {",
      "    True -> io.println(rendered |> string.drop_start(1) |> string.drop_end(1))",
      "    False -> io.println(rendered)",
      "  }",
      "}",
      "",
      "fn list_sum(values) {",
      "  list.fold(values, 0, fn(total, item) { total + item })",
      "}",
      "",
      "fn list_length(values) {",
      "  list.length(values)",
      "}",
      "",
      "fn string_length(value) {",
      "  string.length(value)",
      "}",
      "",
      "fn list_at(values, index) {",
      "  case values |> list.drop(index) |> list.first {",
      "    Ok(value) -> value",
      "    Error(_) -> 0",
      "  }",
      "}",
      ""
    ].join("\n");

    fs.writeFileSync(path.join(srcDir, `${projectName}.gleam`), `${prelude}\n${normalizeGleamNativeSource(source)}`, "utf8");
    return runCommand(runtime("gleam"), ["run"], `${label} gleam`, {
      timeout: Math.max(runtimeTimeoutMs, 60000),
      cwd: tmpDir
    });
  });
}

function normalizeElmExpression(expression) {
  return expression
    .replace(/\bsum\s+(\[[^\]\n]+\])/g, "List.sum $1")
    .replace(/\bat\s+(\d+)\s+(\[[^\]\n]+\])/g, "listAt $1 $2")
    .replace(/\blength\s+("[^"]*")/g, "String.length $1")
    .replace(/\blength\s+(\[[^\]\n]+\])/g, "List.length $1")
    .replace(/\blength\s+([a-z][A-Za-z0-9_]*)/g, "List.length $1");
}

function normalizeElmDefinitions(definitionSource) {
  return definitionSource
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      const letMatch = line.match(/^(.+?)\s*=\s*let\s+([a-z][A-Za-z0-9_]*)\s*=\s*([^;]+);\s*([a-z][A-Za-z0-9_]*)\s*=\s*([^;]+?)\s+in\s+(.+)$/);
      if (!letMatch) {
        return normalizeElmExpression(line);
      }

      const [, signature, firstName, firstValue, secondName, secondValue, body] = letMatch;
      return [
        `${signature.trim()} =`,
        "    let",
        `        ${firstName} = ${normalizeElmExpression(firstValue.trim())}`,
        `        ${secondName} = ${normalizeElmExpression(secondValue.trim())}`,
        "    in",
        `    ${normalizeElmExpression(body.trim())}`
      ].join("\n");
    })
    .join("\n");
}

function elmOutputExpression(expression) {
  const normalized = normalizeElmExpression(expression.trim());
  if (/^".*"$/.test(normalized) || normalized.includes("++")) {
    return normalized;
  }
  return `String.fromInt (${normalized})`;
}

function normalizeElmNativeSource(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const mainLine = lines.find(line => /^main\s*=/.test(line.trim()));
  if (!mainLine) {
    fail("Elm native fixture is missing main print sequence");
  }

  const definitionSource = lines
    .filter(line => !/^main\s*=/.test(line.trim()))
    .join("\n");
  const printExpressions = mainLine
    .replace(/^main\s*=\s*/, "")
    .split(/\s*;\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^print\s+(.+)$/);
      if (!match) {
        fail(`Elm native fixture contains unsupported main statement: ${part}`);
      }
      return elmOutputExpression(match[1]);
    });

  if (printExpressions.length === 0) {
    fail("Elm native fixture has no print expressions");
  }

  const outputList = printExpressions.join(", ");
  const definitions = normalizeElmDefinitions(definitionSource);
  return [
    "port module Main exposing (main)",
    "",
    "import List",
    "import Maybe",
    "import Platform",
    "import String",
    "",
    "port out : String -> Cmd msg",
    "",
    "type alias Model = ()",
    "",
    "type Msg",
    "    = NoOp",
    "",
    "listAt : Int -> List Int -> Int",
    "listAt index listItems =",
    "    Maybe.withDefault 0 (List.head (List.drop index listItems))",
    "",
    definitions,
    "",
    "main : Program () Model Msg",
    "main =",
    "    Platform.worker",
    `        { init = \\_ -> ( (), out (String.join "\\n" [ ${outputList} ]) )`,
    "        , update = \\_ model -> ( model, Cmd.none )",
    "        , subscriptions = \\_ -> Sub.none",
    "        }",
    ""
  ].join("\n");
}

function runElmSource(source, label) {
  return withTempDir("luascript-language-elm-", (tmpDir) => {
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "elm.json"), JSON.stringify({
      type: "application",
      "source-directories": ["src"],
      "elm-version": "0.19.1",
      dependencies: {
        direct: {
          "elm/core": "1.0.5",
          "elm/json": "1.1.3"
        },
        indirect: {}
      },
      "test-dependencies": {
        direct: {},
        indirect: {}
      }
    }, null, 2), "utf8");
    fs.writeFileSync(path.join(srcDir, "Main.elm"), normalizeElmNativeSource(source), "utf8");
    fs.writeFileSync(path.join(tmpDir, "run.js"), [
      "const app = require(\"./main.js\").Elm.Main.init({ flags: null });",
      "app.ports.out.subscribe((text) => console.log(text));",
      ""
    ].join("\n"), "utf8");

    const compile = runCommand(runtime("elm"), ["make", path.join("src", "Main.elm"), "--output=main.js"], `${label} elm compile`, {
      timeout: Math.max(runtimeTimeoutMs, 60000),
      cwd: tmpDir
    });
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }
    const result = runCommand(runtime("node"), ["run.js"], `${label} elm runtime`, {
      timeout: runtimeTimeoutMs,
      cwd: tmpDir
    });
    return { compile, runtime: result };
  });
}

function runLuascriptSource(lsSource, label) {
  return withTempDir("luascript-language-ls-", (tmpDir) => {
    const sourcePath = path.join(tmpDir, `${label}.ls`);
    const luaPath = path.join(tmpDir, `${label}.lua`);
    fs.writeFileSync(sourcePath, lsSource, "utf8");

    const compile = runCommand(
      runtime("python"),
      [path.join("src", "luascript_compiler.py"), "compile", sourcePath, "-o", luaPath],
      `${label} luascript compile`,
      {
        timeout: 10000,
        env: {
          PYTHONIOENCODING: "utf-8"
        }
      }
    );
    if (compile.status !== 0) {
      return { compile, runtime: null };
    }

    const luaCode = fs.readFileSync(luaPath, "utf8");
    const luaWithPolyfill = `-- math.pow polyfill for Lua 5.4 compatibility
if not math.pow then math.pow = function(x, y) return x ^ y end end

${luaCode}`;
    fs.writeFileSync(luaPath, luaWithPolyfill, "utf8");

    const result = runCommand(runtime("lua"), [luaPath], `${label} luascript runtime`, {
      timeout: runtimeTimeoutMs,
      env: {
        LUA_PATH: `${path.join(repoRoot, "runtime").replace(/\\/g, "/")}/?.lua;${process.env.LUA_PATH || ";;"}`
      }
    });
    return { compile, runtime: result };
  });
}

function runNativeSource(source, label, language) {
  if (language === "javascript") {
    return runJavaScriptSource(source, `${label}-native`);
  }
  if (language === "luascript") {
    const result = runLuascriptSource(source, `${label}-native`);
    assertCommandPassed(result.compile, `${label} native LUASCRIPT compile`);
    return result.runtime;
  }
  if (language === "lua") {
    return runLuaSource(source, `${label}-native`);
  }
  if (language === "csharp") {
    return runCSharpSource(source, `${label}-native`);
  }
  if (language === "c" || language === "cpp") {
    return runCompiledNativeSource(source, `${label}-native`, language);
  }
  if (language === "python") {
    return runPythonSource(source, `${label}-native`);
  }
  if (language === "typescript") {
    return runTypeScriptSource(source, `${label}-native`);
  }
  if (language === "ruby") {
    return runRubySource(source, `${label}-native`);
  }
  if (language === "php") {
    return runPhpSource(source, `${label}-native`);
  }
  if (language === "dart") {
    return runDartSource(source, `${label}-native`);
  }
  if (language === "go") {
    return runGoSource(source, `${label}-native`);
  }
  if (language === "java") {
    return runJavaSource(source, `${label}-native`);
  }
  if (language === "rust") {
    return runRustSource(source, `${label}-native`);
  }
  if (language === "kotlin") {
    return runKotlinSource(source, `${label}-native`);
  }
  if (language === "elm") {
    return runElmSource(source, `${label}-native`);
  }
  if (language === "gleam") {
    return runGleamSource(source, `${label}-native`);
  }

  throw new Error(`${language} native runtime is not wired into the shared harness yet`);
}

function runTargetSource(source, label, target) {
  if (target === "lua") {
    return { runtime: runLuaSource(source, label) };
  }
  if (target === "javascript") {
    return { runtime: runJavaScriptSource(source, label) };
  }
  if (target === "luascript") {
    return runLuascriptSource(source, label);
  }
  if (target === "csharp") {
    return { runtime: runCSharpSource(source, label) };
  }
  if (target === "c" || target === "cpp") {
    return runCompiledNativeSource(source, label, target);
  }
  if (target === "python") {
    return { runtime: runPythonSource(source, label) };
  }
  throw new Error(`Unknown target runtime: ${target}`);
}

function fixtureSourceLanguage(fixture) {
  return fixture.sourceLanguage || manifest.language;
}

function fixtureTargets(fixture) {
  return fixture.targets || manifest.targets || [];
}

function isLuascriptWordAt(source, index, word) {
  if (source.slice(index, index + word.length) !== word) return false;
  const before = index === 0 ? "" : source[index - 1];
  const after = source[index + word.length] || "";
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

function skipLuascriptWhitespace(source, index) {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) cursor++;
  return cursor;
}

function findLuascriptBlockClose(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openIndex; index < source.length; index++) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }

  fail("Unterminated emitted LUASCRIPT verify block");
}

function stripTopLevelLuascriptVerifyBlocks(source) {
  let result = "";
  let segmentStart = 0;
  let index = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  while (index < source.length) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      index++;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      index++;
      continue;
    }

    if (depth === 0 && isLuascriptWordAt(source, index, "verify")) {
      const openIndex = skipLuascriptWhitespace(source, index + "verify".length);
      if (source[openIndex] === "{") {
        const closeIndex = findLuascriptBlockClose(source, openIndex);
        result += source.slice(segmentStart, index);
        index = closeIndex + 1;
        segmentStart = index;
        continue;
      }
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth = Math.max(0, depth - 1);
    }

    index++;
  }

  return result + source.slice(segmentStart);
}

function emittedForTargetVerification(emitted, target) {
  if (target !== "luascript") {
    return emitted;
  }
  return stripTopLevelLuascriptVerifyBlocks(emitted);
}

function verifyEmbeddedTargetEmission(emitted, target, verification, label) {
  const inspected = emittedForTargetVerification(emitted, target);
  const contains = verification[`${target}_contains`] || [];
  const notContains = verification[`${target}_not_contains`] || [];

  for (const expected of contains) {
    if (!inspected.includes(expected)) {
      fail(`${label} emitted ${target} output missing verify ${target}_contains text: ${expected}`);
    }
  }

  for (const unexpected of notContains) {
    if (inspected.includes(unexpected)) {
      fail(`${label} emitted ${target} output contained forbidden verify ${target}_not_contains text: ${unexpected}`);
    }
  }
}

function parseRepairAssertion(assertion) {
  const match = assertion.match(/^([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)$/);
  if (!match) {
    fail(`Malformed LUASCRIPT repair assertion: ${assertion}`);
  }
  return { feature: match[1], strategy: match[2] };
}

function repairPolicyMatches(policy, target, feature, strategy) {
  const targetPolicy = policy && policy.targets ? policy.targets[target] : null;
  if (!targetPolicy) {
    return false;
  }
  return (
    (targetPolicy.repairs && targetPolicy.repairs[feature] === strategy) ||
    (targetPolicy.adapters && targetPolicy.adapters[feature] === strategy)
  );
}

function verifyRepairEvidence(policy, emitted, target, verification, label) {
  const assertions = verification[`${target}_repair`] || [];
  if (assertions.length === 0) {
    return;
  }

  verifyRepairRuntimeProof(target, verification, label);

  for (const assertion of assertions) {
    const { feature, strategy } = parseRepairAssertion(assertion);
    if (!repairPolicyMatches(policy, target, feature, strategy)) {
      fail(`${label} missing LUASCRIPT repair policy for ${target}: ${feature}=${strategy}`);
    }

    const evidence = (
      repairEvidenceRules[target] &&
      repairEvidenceRules[target][feature] &&
      repairEvidenceRules[target][feature][strategy]
    ) || [];

    for (const marker of evidence) {
      if (!emitted.includes(marker)) {
        fail(`${label} emitted ${target} output missing repair evidence for ${feature}=${strategy}: ${marker}`);
      }
    }
  }
}

function parsePolicyAssertion(assertion) {
  const separatorIndex = assertion.indexOf("=");
  const pathExpression = separatorIndex === -1
    ? assertion.trim()
    : assertion.slice(0, separatorIndex).trim();
  const expectedValue = separatorIndex === -1
    ? null
    : assertion.slice(separatorIndex + 1).trim();

  if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(pathExpression)) {
    fail(`Malformed LUASCRIPT policy assertion: ${assertion}`);
  }

  return { pathExpression, expectedValue };
}

function getPolicyValue(policy, target, pathExpression) {
  let current = policy && policy.targets && policy.targets[target];
  if (!current) return undefined;

  for (const part of pathExpression.split(".")) {
    if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function policyAssertionMatches(actual, expectedValue) {
  if (actual === undefined) return false;
  if (expectedValue === null) return true;
  if (Array.isArray(actual)) return actual.includes(expectedValue);
  return String(actual) === expectedValue;
}

function verifyPolicyAssertion(policy, target, assertion, shouldExist) {
  const { pathExpression, expectedValue } = parsePolicyAssertion(assertion);
  const actual = getPolicyValue(policy, target, pathExpression);
  const matches = policyAssertionMatches(actual, expectedValue);
  const rendered = expectedValue === null ? pathExpression : `${pathExpression}=${expectedValue}`;

  if (shouldExist && !matches) {
    fail(`Missing LUASCRIPT policy assertion for ${target}: ${rendered}`);
  }
  if (!shouldExist && matches) {
    fail(`Forbidden LUASCRIPT policy assertion present for ${target}: ${rendered}`);
  }
}

function verifyEmbeddedPolicyAssertions(root, sourceLanguage) {
  if (sourceLanguage !== "luascript") return;

  const verification = root.metadata && root.metadata.luascriptVerify ? root.metadata.luascriptVerify : {};
  const policy = root.metadata && root.metadata.luascriptMeta ? root.metadata.luascriptMeta : {};

  const targetPolicyAssertions = [
    ["lua", "lua_policy", true],
    ["lua", "lua_not_policy", false],
    ["javascript", "javascript_policy", true],
    ["javascript", "javascript_not_policy", false],
    ["python", "python_policy", true],
    ["python", "python_not_policy", false],
    ["luascript", "luascript_policy", true],
    ["luascript", "luascript_not_policy", false]
  ];

  for (const [target, key, shouldExist] of targetPolicyAssertions) {
    for (const assertion of verification[key] || []) {
      verifyPolicyAssertion(policy, target, assertion, shouldExist);
    }
  }
}

function verifyExpectedFailure(fixture, source) {
  const sourceLanguage = fixtureSourceLanguage(fixture);
  let expectedDiagnosticPattern = fixture.expectedDiagnosticPattern;
  let embeddedVerification = {};
  let embeddedPolicy = {};
  if (!expectedDiagnosticPattern && sourceLanguage === "luascript") {
    try {
      const extracted = extractLuascriptCompileTimeBlocks(source);
      expectedDiagnosticPattern = extracted.verification.diagnostic;
      embeddedVerification = extracted.verification || {};
      embeddedPolicy = extracted.policy || {};
    } catch {
      expectedDiagnosticPattern = null;
    }
  }
  if (!expectedDiagnosticPattern) {
    fail(`${fixture.name} expected failure is missing expectedDiagnosticPattern or verify diagnostic`);
  }

  let root;
  try {
    root = compileToIR(source, sourceLanguage);
    verifyEmbeddedPolicyAssertions(root, sourceLanguage);
    embeddedVerification = root.metadata && root.metadata.luascriptVerify ? root.metadata.luascriptVerify : embeddedVerification;
    embeddedPolicy = root.metadata && root.metadata.luascriptMeta ? root.metadata.luascriptMeta : embeddedPolicy;
  } catch (error) {
    const pattern = new RegExp(expectedDiagnosticPattern, "i");
    if (!pattern.test(error.message)) {
      fail(`${fixture.name} failed with wrong diagnostic: ${error.message}`);
    }
    return;
  }

  for (const target of fixtureTargets(fixture)) {
    try {
      const emitted = emitTarget(root, target, sourceLanguage);
      verifyEmbeddedTargetEmission(emitted, target, embeddedVerification, fixture.name);
      verifyRepairEvidence(embeddedPolicy, emitted, target, embeddedVerification, fixture.name);
    } catch (error) {
      const pattern = new RegExp(expectedDiagnosticPattern, "i");
      if (!pattern.test(error.message)) {
        fail(`${fixture.name} failed with wrong ${target} diagnostic: ${error.message}`);
      }
      return;
    }
  }

  fail(`${fixture.name} unexpectedly compiled and emitted successfully`);
}

function verifyRunnableFixture(fixture, source) {
  const sourceLanguage = fixtureSourceLanguage(fixture);
  const root = compileToIR(source, sourceLanguage);
  verifyEmbeddedPolicyAssertions(root, sourceLanguage);
  const embeddedVerification = root.metadata && root.metadata.luascriptVerify ? root.metadata.luascriptVerify : {};

  if (fixture.skipNative !== true) {
    const nativeRuntimeError = expectedRuntimeErrorForRuntime(fixture, embeddedVerification, sourceLanguage);
    const nativeExpectedOutput = expectedOutputForRuntime(fixture, embeddedVerification, sourceLanguage);
    if (!nativeExpectedOutput && !nativeRuntimeError) {
      fail(`${fixture.name} runnable fixture is missing expectedOutput, verify stdout, or verify ${sourceLanguage}_stdout`);
    }
    const nativeResult = runNativeSource(source, fixture.name, sourceLanguage);
    const nativeRuntimeResult = nativeResult && nativeResult.compile ? nativeResult.runtime : nativeResult;
    if (nativeResult && nativeResult.compile) {
      assertCommandPassed(nativeResult.compile, `${fixture.name} native ${sourceLanguage} compile`);
    }
    if (nativeRuntimeError) {
      assertCommandFailedWith(nativeRuntimeResult, nativeRuntimeError, `${fixture.name} native ${sourceLanguage} runtime`);
    } else {
      assertCommandPassed(nativeRuntimeResult, `${fixture.name} native ${sourceLanguage}`);
      assertOutput(nativeRuntimeResult, nativeExpectedOutput, `${fixture.name} native ${sourceLanguage}`);
    }
  }

  for (const target of fixtureTargets(fixture)) {
    const targetRuntimeError = expectedRuntimeErrorForRuntime(fixture, embeddedVerification, target);
    const targetExpectedOutput = expectedOutputForRuntime(fixture, embeddedVerification, target);
    if (!targetExpectedOutput && !targetRuntimeError) {
      fail(`${fixture.name} runnable fixture is missing expectedOutput, verify stdout, or verify ${target}_stdout`);
    }
    const emitted = emitTarget(root, target, sourceLanguage);
    if (!emitted.trim()) {
      fail(`${fixture.name} emitted empty ${target} output`);
    }
    verifyEmbeddedTargetEmission(emitted, target, embeddedVerification, fixture.name);
    verifyRepairEvidence(root.metadata && root.metadata.luascriptMeta ? root.metadata.luascriptMeta : {}, emitted, target, embeddedVerification, fixture.name);

    const result = runTargetSource(emitted, `${fixture.name}-${target}`, target);
    if (result.compile) {
      assertCommandPassed(result.compile, `${fixture.name} ${target} compile`);
    }
    if (targetRuntimeError) {
      assertCommandFailedWith(result.runtime, targetRuntimeError, `${fixture.name} ${target} runtime`);
    } else {
      assertCommandPassed(result.runtime, `${fixture.name} ${target} runtime`);
      assertOutput(result.runtime, targetExpectedOutput, `${fixture.name} ${target}`);
    }
  }
}

function checkUnqualifiedManifest() {
  let runtimeFailure = null;
  if (manifest.runtime) {
    try {
      runtime(manifest.runtime);
    } catch (error) {
      runtimeFailure = error.message;
    }
  }

  if (manifest.status !== "qualified") {
    const policyFailure = manifest.failureReason || `${manifest.language} is not requalified for bi-directional execution yet`;
    throw new Error(runtimeFailure ? `${policyFailure} Setup check also failed: ${runtimeFailure}` : policyFailure);
  }

  if (runtimeFailure) {
    throw new Error(runtimeFailure);
  }
}

function runFixture(fixture) {
  const startedAt = Date.now();
  const record = {
    name: fixture.name,
    source: fixture.source,
    sourceLanguage: fixtureSourceLanguage(fixture),
    targets: fixtureTargets(fixture),
    status: "failed",
    elapsedMs: 0,
    failureReason: null
  };

  try {
    const sourcePath = path.join(repoRoot, fixture.source);
    const source = fs.readFileSync(sourcePath, "utf8");
    if (fixture.expectedFailure) {
      verifyExpectedFailure(fixture, source);
    } else {
      verifyRunnableFixture(fixture, source);
    }
    record.status = "passed";
  } catch (error) {
    record.failureReason = error.message;
  } finally {
    record.elapsedMs = Date.now() - startedAt;
  }

  return record;
}

function main() {
  const startedAt = Date.now();
  const results = [];
  let setupFailure = null;

  try {
    checkUnqualifiedManifest();
  } catch (error) {
    setupFailure = error.message;
  }

  if (setupFailure) {
    const report = {
      schemaVersion: 1,
      kind: "language:bidirectional",
      language: manifest.language,
      supportSlice: manifest.supportSlice || null,
      generatedAt: new Date().toISOString(),
      summary: { total: 0, passed: 0, failed: 1, elapsedMs: Date.now() - startedAt },
      setupFailure,
      results
    };
    writeJsonReport(reportPath, report);
    console.error(`FAIL ${manifest.language}: ${setupFailure}`);
    process.exit(1);
  }

  console.log(`Running ${manifest.language} bi-directional completion harness...`);
  console.log(`Support slice: ${manifest.supportSlice}`);

  for (const fixture of manifest.fixtures || []) {
    const result = runFixture(fixture);
    results.push(result);
    if (result.status === "passed") {
      console.log(`PASS ${fixture.name}`);
    } else {
      console.error(`FAIL ${fixture.name}: ${result.failureReason}`);
    }
  }

  const failures = results.filter(result => result.status !== "passed");
  const report = {
    schemaVersion: 1,
    kind: "language:bidirectional",
    language: manifest.language,
    supportSlice: manifest.supportSlice,
    generatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.length - failures.length,
      failed: failures.length,
      elapsedMs: Date.now() - startedAt
    },
    results
  };
  writeJsonReport(reportPath, report);

  console.log(`${manifest.language} bi-directional results: ${report.summary.passed}/${report.summary.total} passed`);
  console.log(`Report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
