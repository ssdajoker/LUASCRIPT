"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { findCommand, repoRoot, runCommand } = require("./clarity_canon/runner_utils");

const command = "npm run test:parser-ownership";
const reportRelativePath = "artifacts/conformance/parser-ownership-report.json";
const reportPath = path.join(repoRoot, reportRelativePath);
const startedAt = Date.now();

const staticAssertions = [
  ...[
    "class ParseArtifact:",
    "def parse_artifact(",
    "def collect_feature_slices(",
    "def make_parser_for_tokens(",
    "def parse_statement_tokens(",
    "def parse_expression_tokens(",
    "def parse_template_tokens(",
    "def parse_array_tokens("
  ].map((expected, index) => ({
    name: `parser-required-marker-${String(index + 1).padStart(2, "0")}`,
    category: "required-marker",
    source: "src/parser/enhanced_parser.py",
    expected
  })),
  ...[
    "artifact = parse_artifact(source, filename)",
    "return parser_parse_tokens(tokens)",
    "return parser_parse_statement_tokens(tokens, start)",
    "parser_parse_expression_tokens(significant)",
    "return parser_parse_template_tokens(tokens, start)",
    "return parser_parse_array_tokens(tokens, start)"
  ].map((expected, index) => ({
    name: `transpiler-parser-delegation-${String(index + 1).padStart(2, "0")}`,
    category: "required-marker",
    source: "src/transpiler/enhanced_transpiler.py",
    expected
  })),
  ...[
    "globals().update(",
    "from enhanced_parser import EnhancedParser",
    "parser = EnhancedParser()",
    "Parse a single statement (simplified)",
    "Build a small expression AST from collected token data",
    "Parse template literal with ${} expressions",
    "This is simplified - in full implementation would parse complete expressions"
  ].map((forbidden, index) => ({
    name: `transpiler-drift-marker-absent-${String(index + 1).padStart(2, "0")}`,
    category: "forbidden-marker",
    source: "src/transpiler/enhanced_transpiler.py",
    forbidden
  }))
];

const runtimeAssertions = [
  "function-declaration-type",
  "function-mathematical-flag",
  "function-current-advanced",
  "binary-expression-type",
  "binary-current-advanced",
  "array-expression-type",
  "array-element-count",
  "array-spread-element",
  "array-current-advanced",
  "template-literal-type",
  "template-quasi-count",
  "template-expression-count",
  "template-current-advanced"
].map((name) => ({
  name: `runtime-${name}`,
  category: "runtime-assertion",
  source: "src/parser/enhanced_parser.py",
  marker: `PARSER_OWNERSHIP_ASSERT:${name}`
}));

const completionAssertion = {
  name: "runtime-completion-output",
  category: "runtime-completion",
  source: "tests/parser_ownership.test.js",
  expected: "parser helper execution ok"
};

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileEvidence(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const absolutePath = path.join(repoRoot, normalizedPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return {
      path: normalizedPath,
      sha256: null,
      sizeBytes: null,
      exists: false
    };
  }
  const contents = fs.readFileSync(absolutePath);
  return {
    path: normalizedPath,
    sha256: sha256Buffer(contents),
    sizeBytes: contents.length,
    exists: true
  };
}

function sourceResult(assertion) {
  const evidence = fileEvidence(assertion.source);
  const result = {
    name: assertion.name,
    category: assertion.category,
    source: evidence.path,
    sourceSha256: evidence.sha256,
    status: "not-run"
  };
  if (assertion.expected) result.expected = assertion.expected;
  if (assertion.forbidden) result.forbidden = assertion.forbidden;
  if (assertion.marker) result.marker = assertion.marker;
  return result;
}

const assertions = [...staticAssertions, ...runtimeAssertions, completionAssertion];
const results = assertions.map(sourceResult);
const resultByName = new Map(results.map((entry) => [entry.name, entry]));
const failures = [];
let fatalFailure = null;
let runtimeEvidence = [];

function recordPassed(name) {
  resultByName.get(name).status = "passed";
}

function recordFailed(name, error) {
  const result = resultByName.get(name);
  result.status = "failed";
  result.failure = String(error.message || error).replace(/\r\n/g, "\n");
  failures.push({ name, message: result.failure });
}

function runStaticAssertion(assertion, sourceText) {
  try {
    if (assertion.category === "required-marker") {
      if (!sourceText.includes(assertion.expected)) {
        const label = assertion.source.endsWith("enhanced_parser.py")
          ? "enhanced_parser.py"
          : "enhanced_transpiler.py";
        throw new Error(`${label} is missing ${assertion.expected}`);
      }
    } else if (sourceText.includes(assertion.forbidden)) {
      throw new Error(
        `enhanced_transpiler.py still contains parser drift marker: ${assertion.forbidden}`
      );
    }
    recordPassed(assertion.name);
  } catch (error) {
    recordFailed(assertion.name, error);
    throw error;
  }
}

function verifyParserApiSurface() {
  const sourceByPath = new Map([
    [
      "src/parser/enhanced_parser.py",
      fs.readFileSync(path.join(repoRoot, "src", "parser", "enhanced_parser.py"), "utf8")
    ],
    [
      "src/transpiler/enhanced_transpiler.py",
      fs.readFileSync(path.join(repoRoot, "src", "transpiler", "enhanced_transpiler.py"), "utf8")
    ]
  ]);

  for (const assertion of staticAssertions) {
    runStaticAssertion(assertion, sourceByPath.get(assertion.source));
  }
}

function verifyParserHelperExecution() {
  const pythonCmd = findCommand(["python3", "python"], "Python 3");
  const probe = runCommand(pythonCmd, ["--version"], "Python 3 version probe", {
    timeout: 10000
  });
  runtimeEvidence = [
    {
      name: "python",
      command: pythonCmd,
      probe: {
        args: ["--version"],
        status: probe.status,
        signal: probe.signal,
        stdout: probe.stdout,
        stderr: probe.stderr,
        error: probe.error ? String(probe.error.message || probe.error) : null
      }
    }
  ];
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
print("PARSER_OWNERSHIP_ASSERT:function-declaration-type")
assert getattr(node, "is_mathematical", False)
print("PARSER_OWNERSHIP_ASSERT:function-mathematical-flag")
assert current > 0
print("PARSER_OWNERSHIP_ASSERT:function-current-advanced")

node, current = parse_expression_tokens(without_eof(tokenize_source("x + 2 * 3", "expr")))
assert node.__class__.__name__ == "BinaryExpression"
print("PARSER_OWNERSHIP_ASSERT:binary-expression-type")
assert current > 0
print("PARSER_OWNERSHIP_ASSERT:binary-current-advanced")

node, current = parse_array_tokens(tokenize_source("[1, 2, ...xs]", "array"))
assert node.__class__.__name__ == "ArrayExpression"
print("PARSER_OWNERSHIP_ASSERT:array-expression-type")
assert len(node.elements) == 3
print("PARSER_OWNERSHIP_ASSERT:array-element-count")
assert node.elements[-1].__class__.__name__ == "SpreadElement"
print("PARSER_OWNERSHIP_ASSERT:array-spread-element")
assert current > 0
print("PARSER_OWNERSHIP_ASSERT:array-current-advanced")

node, current = parse_template_tokens(tokenize_source("\`Hello \${name}\`", "template"))
assert node.__class__.__name__ == "TemplateLiteral"
print("PARSER_OWNERSHIP_ASSERT:template-literal-type")
assert len(node.quasis) == 2
print("PARSER_OWNERSHIP_ASSERT:template-quasi-count")
assert len(node.expressions) == 1
print("PARSER_OWNERSHIP_ASSERT:template-expression-count")
assert current > 0
print("PARSER_OWNERSHIP_ASSERT:template-current-advanced")

print("parser helper execution ok")
`;
  const execution = runCommand(pythonCmd, ["-c", code], "parser helper execution", {
    timeout: 10000
  });

  let firstMissingRuntimeAssertion = null;
  for (const assertion of runtimeAssertions) {
    if (execution.stdout.includes(assertion.marker)) {
      recordPassed(assertion.name);
    } else if (!firstMissingRuntimeAssertion) {
      firstMissingRuntimeAssertion = assertion;
    }
  }

  if (execution.status !== 0) {
    const failedAssertion = firstMissingRuntimeAssertion || runtimeAssertions[0];
    const error = new Error(
      execution.stderr || execution.stdout || "parser helper execution failed"
    );
    recordFailed(failedAssertion.name, error);
    throw error;
  }

  if (firstMissingRuntimeAssertion) {
    const error = new Error(
      `parser helper execution is missing assertion marker ${firstMissingRuntimeAssertion.marker}`
    );
    recordFailed(firstMissingRuntimeAssertion.name, error);
    throw error;
  }

  try {
    if (!execution.stdout.includes(completionAssertion.expected)) {
      throw new Error(
        `parser helper execution is missing ${completionAssertion.expected}`
      );
    }
    recordPassed(completionAssertion.name);
  } catch (error) {
    recordFailed(completionAssertion.name, error);
    throw error;
  }
}

function makeReport() {
  const failed = results.filter((entry) => entry.status === "failed").length;
  const notRun = results.filter((entry) => entry.status === "not-run").length;
  return {
    schemaVersion: 1,
    kind: "luascript:parser-ownership",
    command,
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    status: failed === 0 && notRun === 0 && !fatalFailure ? "passed" : "failed",
    boundary: {
      evidenceScope: "repository parser ownership and delegated helper behavior",
      packageCompatibilityClaimed: false
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      os: {
        type: os.type(),
        release: os.release()
      },
      cwd: repoRoot,
      runtimeTimeoutMs: 10000
    },
    inputs: {
      harness: fileEvidence("tests/parser_ownership.test.js"),
      runnerUtilities: fileEvidence("tests/clarity_canon/runner_utils.js"),
      implementationEvidence: [
        "src/lexer/enhanced_lexer.py",
        "src/parser/enhanced_parser.py",
        "src/transpiler/enhanced_transpiler.py"
      ].map(fileEvidence)
    },
    runtimeEvidence,
    results,
    summary: {
      total: results.length,
      passed: results.filter((entry) => entry.status === "passed").length,
      failed: failed + (fatalFailure && failed === 0 ? 1 : 0),
      notRun,
      staticAssertions: staticAssertions.length,
      runtimeAssertions: runtimeAssertions.length,
      completionAssertions: 1
    },
    failures: failures.length > 0
      ? failures
      : fatalFailure
        ? [{ name: "harness", message: String(fatalFailure.message || fatalFailure) }]
        : []
  };
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

try {
  verifyParserApiSurface();
  verifyParserHelperExecution();
  console.log("Parser ownership regression passed");
} catch (error) {
  fatalFailure = error;
} finally {
  writeReport(makeReport());
}

if (fatalFailure) {
  throw fatalFailure;
}
