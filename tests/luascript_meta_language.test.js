"use strict";

const fs = require("fs");
const path = require("path");

const {
  repoRoot,
  findCommand,
  runCommand,
  withTempDir,
  assertIncludes
} = require("./clarity_canon/runner_utils");

const pythonCmd = findCommand(["python3", "python"], "Python 3");
const luaCmd = findCommand(["luajit", "lua"], "Lua interpreter");
const luaRuntimePath = path.join(repoRoot, "runtime").replace(/\\/g, "/");

function compileFixture(sourceRelative, tmpDir, name) {
  const sourcePath = path.join(repoRoot, sourceRelative);
  const outputPath = path.join(tmpDir, `${name}.lua`);
  const compile = runCommand(
    pythonCmd,
    [path.join("src", "luascript_compiler.py"), "compile", sourcePath, "-o", outputPath],
    `${name} compile`,
    { timeout: 10000 }
  );
  return { compile, outputPath };
}

function runLua(outputPath, name) {
  return runCommand(luaCmd, [outputPath], `${name} lua`, {
    timeout: 5000,
    env: {
      LUA_PATH: `${luaRuntimePath}/?.lua;${process.env.LUA_PATH || ";;"}`
    }
  });
}

function parseSourceArtifact(source, tmpDir, name) {
  const sourcePath = path.join(tmpDir, `${name}.ls`);
  fs.writeFileSync(sourcePath, source, "utf8");
  return runCommand(
    pythonCmd,
    [path.join("src", "luascript_compiler.py"), "parse", sourcePath],
    `${name} parse artifact`,
    {
      timeout: 10000,
      env: {
        PYTHONIOENCODING: "utf-8"
      }
    }
  );
}

function runParserHelperApis() {
  const code = `
import sys
from pathlib import Path

root = Path.cwd()
sys.path.insert(0, str(root / "src" / "lexer"))
sys.path.insert(0, str(root / "src" / "parser"))

from enhanced_lexer import tokenize_source, TokenType
from enhanced_parser import (
    parse_array_tokens,
    parse_expression_tokens,
    parse_statement_tokens,
    parse_template_tokens,
)

def without_eof(tokens):
    return [token for token in tokens if token.type != TokenType.EOF]

node, current = parse_statement_tokens(tokenize_source("f(x) = x + 1;", "math_fn"))
assert node.__class__.__name__ == "FunctionDeclaration"
assert getattr(node, "is_mathematical", False)
assert current > 0

node, current = parse_expression_tokens(without_eof(tokenize_source("x + 2 * 3", "expr")))
assert node.__class__.__name__ == "BinaryExpression"
assert current > 0

node, current = parse_array_tokens(tokenize_source("[1, 2, ...xs]", "array"))
assert node.__class__.__name__ == "ArrayExpression"
assert len(node.elements) == 3
assert node.elements[-1].__class__.__name__ == "SpreadElement"
assert current > 0

node, current = parse_template_tokens(tokenize_source("\`Hello \${name}\`", "template"))
assert node.__class__.__name__ == "TemplateLiteral"
assert len(node.quasis) == 2
assert len(node.expressions) == 1
assert current > 0

print("parser helper APIs ok")
`;
  return runCommand(pythonCmd, ["-c", code], "parser helper APIs", {
    timeout: 10000,
    env: {
      PYTHONIOENCODING: "utf-8"
    }
  });
}

function assertPassed(result, label) {
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout || result.error || "unknown failure"}`);
  }
}

function assertFailedWith(result, expected, label) {
  if (result.status === 0) {
    throw new Error(`${label} unexpectedly passed`);
  }
  assertIncludes(`${result.stdout}\n${result.stderr}`, expected, label);
}

function testMetaResolveContinue() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_resolve_continue.ls",
      tmpDir,
      "meta_resolve_continue"
    );
    assertPassed(compile, "meta resolve compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["meta {", "target lua", "requires lua.goto", "resolve continue"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`meta resolve emitted compile-time syntax into Lua: ${leaked}`);
      }
    }
    assertIncludes(luaSource, "goto ", "meta resolve continue Lua output");

    const runtime = runLua(outputPath, "meta_resolve_continue");
    assertPassed(runtime, "meta resolve runtime");
    assertIncludes(runtime.stdout, "meta_continue\t8", "meta resolve runtime");
  });
}

function testForbidGotoNoContinue() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_forbid_goto_no_continue.ls",
      tmpDir,
      "meta_forbid_goto_no_continue"
    );
    assertPassed(compile, "forbid goto no-continue compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const unexpected of ["goto ", "::"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`forbid lua.goto emitted forbidden Lua control syntax: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_forbid_goto_no_continue");
    assertPassed(runtime, "forbid goto no-continue runtime");
    assertIncludes(runtime.stdout, "no_goto\t6", "forbid goto no-continue runtime");
  });
}

function testEmbeddedVerifyStdout() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_verify_stdout.ls",
      tmpDir,
      "meta_verify_stdout"
    );
    assertPassed(compile, "embedded verify stdout compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    if (luaSource.includes("verify {") || luaSource.includes("stdout \"")) {
      throw new Error("embedded verify block leaked into Lua output");
    }

    const runtime = runLua(outputPath, "meta_verify_stdout");
    assertPassed(runtime, "embedded verify stdout runtime");
    assertIncludes(runtime.stdout, "verify_block\t9", "embedded verify stdout runtime");
  });
}

function testEmbeddedVerifyLuaEmission() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_verify_lua_emission.ls",
      tmpDir,
      "meta_verify_lua_emission"
    );
    assertPassed(compile, "embedded verify lua emission compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const expected of ["_LS.index(", "_LS.length("]) {
      assertIncludes(luaSource, expected, "embedded verify lua emission output");
    }
    for (const unexpected of ["verify {", "lua_contains"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`embedded verify assertion leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_verify_lua_emission");
    assertPassed(runtime, "embedded verify lua emission runtime");
    assertIncludes(runtime.stdout, "verify_emit\ty\t2", "embedded verify lua emission runtime");
  });
}

function testEmbeddedVerifyTargetEmission() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_verify_target_emission.ls",
      tmpDir,
      "meta_verify_target_emission"
    );
    assertPassed(compile, "embedded verify target emission compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    assertIncludes(luaSource, "print(", "embedded verify target emission Lua output");
    for (const unexpected of ["verify {", "lua_contains", "js_contains", "ls_contains"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`embedded verify assertion leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_verify_target_emission");
    assertPassed(runtime, "embedded verify target emission runtime");
    assertIncludes(runtime.stdout, "verify_targets\t7", "embedded verify target emission runtime");
  });
}

function testEmbeddedVerifyTargetRuntime() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_verify_target_runtime.ls",
      tmpDir,
      "meta_verify_target_runtime"
    );
    assertPassed(compile, "embedded verify target runtime compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const unexpected of ["verify {", "lua_stdout", "js_stdout", "ls_stdout"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`embedded verify runtime assertion leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_verify_target_runtime");
    assertPassed(runtime, "embedded verify target runtime");
    assertIncludes(runtime.stdout, "verify_runtime\t10", "embedded verify target runtime");
  });
}

function testEmbeddedVerifyTargetRuntimeFailure() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_verify_target_runtime_failure.ls",
      tmpDir,
      "meta_verify_target_runtime_failure"
    );
    assertPassed(compile, "embedded verify target runtime failure compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const unexpected of ["verify {", "lua_runtime_error", "js_runtime_error", "ls_runtime_error"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`embedded verify runtime-failure assertion leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_verify_target_runtime_failure");
    if (runtime.status === 0) {
      throw new Error("embedded verify target runtime failure unexpectedly passed");
    }
    assertIncludes(`${runtime.stdout}\n${runtime.stderr}`, "missingFunction", "embedded verify target runtime failure");
  });
}

function testEmbeddedVerifyPolicyAssertions() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_policy_assertions.ls",
      tmpDir,
      "meta_policy_assertions"
    );
    assertPassed(compile, "embedded verify policy assertions compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const unexpected of ["verify {", "lua_policy", "lua_not_policy"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`embedded verify policy assertion leaked into Lua output: ${unexpected}`);
      }
    }
    for (const expected of ["_LS.index(", "_LS.length(", "_LS.truthy(", "_LS.slice(", "_LS.add("]) {
      assertIncludes(luaSource, expected, "embedded verify policy assertions Lua output");
    }

    const runtime = runLua(outputPath, "meta_policy_assertions");
    assertPassed(runtime, "embedded verify policy assertions runtime");
    assertIncludes(runtime.stdout, "policy_assertions\tok\tbc:10\t3", "embedded verify policy assertions runtime");
  });
}

function testCrossTargetPolicyAssertions() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_cross_target_policy_assertions.ls",
      tmpDir,
      "meta_cross_target_policy_assertions"
    );
    assertPassed(compile, "cross-target policy assertions compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const unexpected of ["verify {", "target javascript", "target python", "js_policy", "python_policy"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`cross-target policy assertion leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_cross_target_policy_assertions");
    assertPassed(runtime, "cross-target policy assertions runtime");
    assertIncludes(runtime.stdout, "cross_policy\tok\t9", "cross-target policy assertions runtime");
  });
}

function testPythonTruthinessAdapter() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_python_truthiness_adapter.ls",
      tmpDir,
      "meta_python_truthiness_adapter"
    );
    assertPassed(compile, "python truthiness adapter compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const expected of ["_LS.truthy(", "_LS.logical_and(", "_LS.logical_or("]) {
      assertIncludes(luaSource, expected, "python truthiness adapter Lua output");
    }
    for (const unexpected of ["python_stdout", "python_contains", "python_policy", "target python"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`python truthiness verification leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_python_truthiness_adapter");
    assertPassed(runtime, "python truthiness adapter runtime");
    assertIncludes(
      runtime.stdout,
      "python_truthy\tlist_truthy\tobject_truthy\tzero_false\tempty_false\tneg_false\tternary_truthy\t1\t1\t2",
      "python truthiness adapter runtime"
    );
  });
}

function testPythonIndexLengthSliceAdapter() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_python_index_length_slice_adapter.ls",
      tmpDir,
      "meta_python_index_length_slice_adapter"
    );
    assertPassed(compile, "python index/length/slice adapter compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const expected of ["_LS.index(", "_LS.set_index(", "_LS.length(", "_LS.slice("]) {
      assertIncludes(luaSource, expected, "python index/length/slice adapter Lua output");
    }
    for (const unexpected of ["python_stdout", "python_contains", "python_policy", "target python"]) {
      if (luaSource.includes(unexpected)) {
        throw new Error(`python index/length/slice verification leaked into Lua output: ${unexpected}`);
      }
    }

    const runtime = runLua(outputPath, "meta_python_index_length_slice_adapter");
    assertPassed(runtime, "python index/length/slice adapter runtime");
    assertIncludes(
      runtime.stdout,
      "python_index_length_slice\tb\t4\tbc\t8\t9\t8\t2\t10",
      "python index/length/slice adapter runtime"
    );
  });
}

function testStringCoercionAdapter() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_string_coercion_adapter.ls",
      tmpDir,
      "meta_string_coercion_adapter"
    );
    assertPassed(compile, "string coercion adapter compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    assertIncludes(luaSource, "_LS.add(", "string coercion adapter Lua output");

    const runtime = runLua(outputPath, "meta_string_coercion_adapter");
    assertPassed(runtime, "string coercion adapter runtime");
    assertIncludes(
      runtime.stdout,
      "meta_string\tcount: 3\tflag=false\tempty=null\tnumeric=5",
      "string coercion adapter runtime"
    );
  });
}

function testCapabilityNegotiation() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_capability_negotiation.ls",
      tmpDir,
      "meta_capability_negotiation"
    );
    assertPassed(compile, "capability negotiation compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["requires lua.goto", "forbid js.prototype"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`capability policy emitted compile-time syntax into Lua: ${leaked}`);
      }
    }

    const runtime = runLua(outputPath, "meta_capability_negotiation");
    assertPassed(runtime, "capability negotiation runtime");
    assertIncludes(runtime.stdout, "meta_caps\t6", "capability negotiation runtime");
  });
}

function testSemanticAdapters() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_semantic_adapters.ls",
      tmpDir,
      "meta_semantic_adapters"
    );
    assertPassed(compile, "semantic adapters compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const expected of ["_LS.index(", "_LS.set_index(", "_LS.length(", "_LS.slice(", "_LS.truthy(", "_LS.logical_and(", "_LS.logical_or("]) {
      assertIncludes(luaSource, expected, "semantic adapters Lua output");
    }

    const runtime = runLua(outputPath, "meta_semantic_adapters");
    assertPassed(runtime, "semantic adapters runtime");
    assertIncludes(
      runtime.stdout,
      "meta_adapters\tb\t4\tbc\t8\t9\tzero_false\tempty_false\t0\tfallback\t1",
      "semantic adapters runtime"
    );
  });
}

function testRepairBlock() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_repair_block.ls",
      tmpDir,
      "meta_repair_block"
    );
    assertPassed(compile, "repair block compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["repair {", "lower indexing", "lower truthiness"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`repair block emitted compile-time syntax into Lua: ${leaked}`);
      }
    }
    for (const expected of ["_LS.index(", "_LS.set_index(", "_LS.length(", "_LS.slice(", "_LS.truthy(", "_LS.logical_and(", "_LS.logical_or(", "_LS.add("]) {
      assertIncludes(luaSource, expected, "repair block Lua output");
    }

    const runtime = runLua(outputPath, "meta_repair_block");
    assertPassed(runtime, "repair block runtime");
    assertIncludes(
      runtime.stdout,
      "repair_blocks\tx\t4\tyz\t9\t7\tok\tfallback\t0\t1",
      "repair block runtime"
    );
  });
}

function testMultipleReturns() {
  const cases = [
    [
      "meta_multiple_returns_adapter",
      "_LS.many(",
      "multi_adapter\tAda\t3\t7\tdone"
    ],
    [
      "meta_multiple_returns_repair",
      "_LS.many(",
      "multi_repair\tleft\tright\t2"
    ]
  ];

  for (const [name, expectedLua, expectedOutput] of cases) {
    withTempDir("luascript-meta-", (tmpDir) => {
      const { compile, outputPath } = compileFixture(
        `tests/language_completion/fixtures/luascript/${name}.ls`,
        tmpDir,
        name
      );
      assertPassed(compile, `${name} compile`);

      const luaSource = fs.readFileSync(outputPath, "utf8");
      assertIncludes(luaSource, expectedLua, `${name} Lua output`);

      const runtime = runLua(outputPath, name);
      assertPassed(runtime, `${name} runtime`);
      assertIncludes(runtime.stdout, expectedOutput, `${name} runtime`);
    });
  }
}

function testFeatureContracts() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const source = "tests/language_completion/fixtures/luascript/meta_feature_contract.ls";
    const parse = parseSourceArtifact(fs.readFileSync(path.join(repoRoot, source), "utf8"), tmpDir, "meta_feature_contract");
    assertPassed(parse, "feature contract parse");
    for (const expected of [
      "features: for-of",
      "verify-blocks",
      "verify policies: feature, no_feature, stdout"
    ]) {
      assertIncludes(parse.stdout, expected, "feature contract parse artifact");
    }

    const { compile, outputPath } = compileFixture(source, tmpDir, "meta_feature_contract");
    assertPassed(compile, "feature contract compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["verify {", "feature \"", "no_feature \""]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`feature contract emitted compile-time syntax into Lua: ${leaked}`);
      }
    }

    const runtime = runLua(outputPath, "meta_feature_contract");
    assertPassed(runtime, "feature contract runtime");
    assertIncludes(runtime.stdout, "meta_features\t6", "feature contract runtime");
  });

  const failureCases = [
    ["meta_feature_contract_missing", "Missing verified feature slice: classes"],
    ["meta_feature_contract_forbidden", "Forbidden verified feature slice present: for-of"]
  ];
  for (const [name, expected] of failureCases) {
    withTempDir("luascript-meta-", (tmpDir) => {
      const { compile } = compileFixture(
        `tests/language_completion/fixtures/luascript/${name}.ls`,
        tmpDir,
        name
      );
      assertFailedWith(compile, expected, name);
    });
  }
}

function testNoMetaBaseline() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile, outputPath } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_noop_baseline.ls",
      tmpDir,
      "meta_noop_baseline"
    );
    assertPassed(compile, "no-meta baseline compile");
    const runtime = runLua(outputPath, "meta_noop_baseline");
    assertPassed(runtime, "no-meta baseline runtime");
    assertIncludes(runtime.stdout, "meta_noop\t5", "no-meta baseline runtime");
  });
}

function testParserArtifactOwnsSyntaxSlices() {
  withTempDir("luascript-parser-artifact-", (tmpDir) => {
    const source = `
meta {
  target lua {
    requires lua.goto;
    resolve continue using label_goto;
  }
}

repair {
  target lua {
    lower indexing using zero_based;
  }
}

verify {
  stdout "parser artifact";
}

let total = ∑[i = 1..3](i);
let slope = ∂_{x=2}(x ^ 2);
let edge = lim_{x→0}(x);
let piped = [1, 2, 3] |> sum;
let series = [1..3];
let result = let a = 1 in a + 1;
`;

    const parse = parseSourceArtifact(source, tmpDir, "parser_artifact_slices");
    assertPassed(parse, "parser artifact slices");
    for (const expected of [
      "features: derivative-binders",
      "let-in",
      "limit-binders",
      "math-binders",
      "meta-blocks",
      "pipelines",
      "ranges",
      "repair-blocks",
      "verify-blocks",
      "meta targets: javascript, lua, luascript, python",
      "verify policies: stdout"
    ]) {
      assertIncludes(parse.stdout, expected, "parser artifact slices");
    }
  });
}

function testParserHelperApisOwnFormerTranspilerSlices() {
  const result = runParserHelperApis();
  assertPassed(result, "parser helper APIs");
  assertIncludes(result.stdout, "parser helper APIs ok", "parser helper APIs");
}

function testConfiguredAsyncDiagnostic() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const { compile } = compileFixture(
      "tests/language_completion/fixtures/luascript/meta_diagnose_async.ls",
      tmpDir,
      "meta_diagnose_async"
    );
    assertFailedWith(compile, "async is not supported in LuaScript V0", "configured async diagnostic");
  });
}

function testMetaProfilePortableV1() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const sourcePath = "tests/language_completion/fixtures/luascript/meta_profile_portable_v1.ls";
    const { compile, outputPath } = compileFixture(sourcePath, tmpDir, "meta_profile_portable_v1");
    assertPassed(compile, "meta profile portable_v1 compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["meta profile", "meta {", "target luascript", "verify {"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`meta profile emitted compile-time syntax into Lua: ${leaked}`);
      }
    }

    const runtime = runLua(outputPath, "meta_profile_portable_v1");
    assertPassed(runtime, "meta profile portable_v1 runtime");
    assertIncludes(runtime.stdout, "meta_profile\t7", "meta profile portable_v1 runtime");

    const parse = parseSourceArtifact(fs.readFileSync(path.join(repoRoot, sourcePath), "utf8"), tmpDir, "meta_profile_portable_v1");
    assertPassed(parse, "meta profile portable_v1 parse artifact");
    for (const expected of [
      "features: meta-blocks, meta-profiles, verify-blocks",
      "meta targets: javascript, lua, luascript, python"
    ]) {
      assertIncludes(parse.stdout, expected, "meta profile portable_v1 parse artifact");
    }
  });
}

function testMetaProfileOverrideAsyncMessage() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const sourcePath = "tests/language_completion/fixtures/luascript/meta_profile_override_async_message.ls";
    const { compile, outputPath } = compileFixture(sourcePath, tmpDir, "meta_profile_override_async_message");
    assertPassed(compile, "meta profile override async compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["meta profile", "meta {", "verify {"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`meta profile override emitted compile-time syntax into Lua: ${leaked}`);
      }
    }

    const runtime = runLua(outputPath, "meta_profile_override_async_message");
    assertPassed(runtime, "meta profile override async runtime");
    assertIncludes(runtime.stdout, "meta_profile_override\t5", "meta profile override async runtime");

    const parse = parseSourceArtifact(fs.readFileSync(path.join(repoRoot, sourcePath), "utf8"), tmpDir, "meta_profile_override_async_message");
    assertPassed(parse, "meta profile override async parse artifact");
    assertIncludes(parse.stdout, "meta targets: javascript, lua, luascript, python", "meta profile override async parse artifact");
    assertIncludes(parse.stdout, "verify policies: feature, lua_policy, luascript_policy, python_policy, stdout", "meta profile override async parse artifact");
  });
}

function testMetaProfileCompositionAssertions() {
  withTempDir("luascript-meta-", (tmpDir) => {
    const sourcePath = "tests/language_completion/fixtures/luascript/meta_profile_composition_pressure.ls";
    const { compile, outputPath } = compileFixture(sourcePath, tmpDir, "meta_profile_composition_pressure");
    assertPassed(compile, "meta profile composition compile");

    const luaSource = fs.readFileSync(outputPath, "utf8");
    for (const leaked of ["meta profile", "profile \"", "implicit_profile", "no_implicit_profile", "verify {"]) {
      if (luaSource.includes(leaked)) {
        throw new Error(`meta profile composition emitted compile-time syntax into Lua: ${leaked}`);
      }
    }

    const runtime = runLua(outputPath, "meta_profile_composition_pressure");
    assertPassed(runtime, "meta profile composition runtime");
    assertIncludes(runtime.stdout, "profile_composition\tb\t4\tbc\t8\t9\tok", "meta profile composition runtime");

    const parse = parseSourceArtifact(fs.readFileSync(path.join(repoRoot, sourcePath), "utf8"), tmpDir, "meta_profile_composition_pressure");
    assertPassed(parse, "meta profile composition parse artifact");
    assertIncludes(parse.stdout, "features: meta-blocks, meta-profiles, verify-blocks", "meta profile composition parse artifact");
    assertIncludes(parse.stdout, "verify policies: feature, implicit_profile, javascript_policy, javascript_stdout, lua_policy, lua_stdout, luascript_policy, luascript_stdout, no_implicit_profile, no_profile, profile, python_policy, python_stdout, stdout", "meta profile composition parse artifact");
  });
}

function testMetaValidationDiagnostics() {
  const cases = [
    ["meta_profile_unknown", "Unsupported meta profile: impossible_v9"],
    ["meta_profile_assertion_missing", "Missing LUASCRIPT profile assertion: portable_semantics_v1"],
    ["meta_profile_forbidden_present", "Forbidden LUASCRIPT profile assertion present: portable_v1"],
    ["meta_implicit_profile_forbidden_present", "Forbidden LUASCRIPT implicit profile assertion present: portable_semantics_v1"],
    ["meta_profile_override_conflict_goto", "Conflicting capability policy: lua.goto is both required and forbidden"],
    ["meta_unknown_target", "Unsupported meta target: wasm"],
    ["meta_unknown_resolver", "Unsupported meta resolver: coroutine"],
    ["meta_unknown_strategy", "Unsupported meta strategy for continue: magic_jump"],
    ["meta_resolve_continue_missing_requires", "resolve continue using label_goto requires lua.goto"],
    ["meta_capability_no_compatible_continue", "No policy-compatible lowering for continue on lua target"],
    ["meta_forbid_goto_continue", "No policy-compatible lowering for continue on lua target"],
    ["meta_forbid_prototype", "Forbidden capability used by meta policy: js.prototype"],
    ["meta_js_forbid_prototype", "Forbidden capability used by meta policy: js.prototype"],
    ["meta_unsupported_adapter", "Unsupported meta adapter strategy for multiple_returns: first_value"],
    ["meta_unknown_repair_feature", "Unsupported repair feature: coroutines"],
    ["meta_unknown_repair_strategy", "Unsupported repair strategy for indexing: one_based"],
    ["meta_named_diagnostic_async", "async is not supported in LuaScript V0"],
    ["meta_named_diagnostic_unknown", "Unknown LUASCRIPT diagnostic: missing_diag"],
    ["meta_verify_diagnostic", "async is not supported in LuaScript V0"]
  ];

  for (const [name, expected] of cases) {
    withTempDir("luascript-meta-", (tmpDir) => {
      const { compile } = compileFixture(
        `tests/language_completion/fixtures/luascript/${name}.ls`,
        tmpDir,
        name
      );
      assertFailedWith(compile, expected, name);
    });
  }
}

function main() {
  testParserArtifactOwnsSyntaxSlices();
  testParserHelperApisOwnFormerTranspilerSlices();
  testNoMetaBaseline();
  testMetaResolveContinue();
  testForbidGotoNoContinue();
  testEmbeddedVerifyStdout();
  testEmbeddedVerifyLuaEmission();
  testEmbeddedVerifyTargetEmission();
  testEmbeddedVerifyTargetRuntime();
  testEmbeddedVerifyTargetRuntimeFailure();
  testEmbeddedVerifyPolicyAssertions();
  testCrossTargetPolicyAssertions();
  testPythonTruthinessAdapter();
  testPythonIndexLengthSliceAdapter();
  testStringCoercionAdapter();
  testCapabilityNegotiation();
  testSemanticAdapters();
  testRepairBlock();
  testMultipleReturns();
  testFeatureContracts();
  testConfiguredAsyncDiagnostic();
  testMetaProfilePortableV1();
  testMetaProfileOverrideAsyncMessage();
  testMetaProfileCompositionAssertions();
  testMetaValidationDiagnostics();
  console.log("LUASCRIPT meta-language V0.16 tests passed");
}

main();
