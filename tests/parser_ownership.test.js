"use strict";

const fs = require("fs");
const path = require("path");
const { findCommand, repoRoot, runCommand } = require("./clarity_canon/runner_utils");

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label} is missing ${expected}`);
  }
}

function assertExcludes(source, forbidden, label) {
  if (source.includes(forbidden)) {
    throw new Error(`${label} still contains parser drift marker: ${forbidden}`);
  }
}

function verifyParserApiSurface() {
  const parserSource = fs.readFileSync(path.join(repoRoot, "src", "parser", "enhanced_parser.py"), "utf8");
  const transpilerSource = fs.readFileSync(path.join(repoRoot, "src", "transpiler", "enhanced_transpiler.py"), "utf8");

  for (const expected of [
    "class ParseArtifact:",
    "def parse_artifact(",
    "def collect_feature_slices(",
    "def make_parser_for_tokens(",
    "def parse_statement_tokens(",
    "def parse_expression_tokens(",
    "def parse_template_tokens(",
    "def parse_array_tokens("
  ]) {
    assertIncludes(parserSource, expected, "enhanced_parser.py");
  }

  for (const expected of [
    "artifact = parse_artifact(source, filename)",
    "return parser_parse_tokens(tokens)",
    "return parser_parse_statement_tokens(tokens, start)",
    "parser_parse_expression_tokens(significant)",
    "return parser_parse_template_tokens(tokens, start)",
    "return parser_parse_array_tokens(tokens, start)"
  ]) {
    assertIncludes(transpilerSource, expected, "enhanced_transpiler.py");
  }

  for (const forbidden of [
    "globals().update(",
    "from enhanced_parser import EnhancedParser",
    "parser = EnhancedParser()",
    "Parse a single statement (simplified)",
    "Build a small expression AST from collected token data",
    "Parse template literal with ${} expressions",
    "This is simplified - in full implementation would parse complete expressions"
  ]) {
    assertExcludes(transpilerSource, forbidden, "enhanced_transpiler.py");
  }
}

function verifyParserHelperExecution() {
  const pythonCmd = findCommand(["python3", "python"], "Python 3");
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

print("parser helper execution ok")
`;
  const result = runCommand(pythonCmd, ["-c", code], "parser helper execution", { timeout: 10000 });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "parser helper execution failed");
  }
  assertIncludes(result.stdout, "parser helper execution ok", "parser helper execution");
}

function main() {
  verifyParserApiSurface();
  verifyParserHelperExecution();
  console.log("Parser ownership regression passed");
}

main();
