#!/usr/bin/env node

/**
 * TYPE CONFUSION PREVENTION - JavaScript Security Optimization Phase 3.3
 *
 * Detects risky implicit coercions and type-mixing patterns.
 * Emits metadata for downstream guard insertion.
 */

const COERCIVE_OPERATORS = new Set(["==", "!="]);
const NUMERIC_OPERATORS = new Set(["-", "*", "/", "%", "**"]);
const COMPARISON_OPERATORS = new Set(["<", ">", "<=", ">="]);
const { safeCloneIR } = require("../ir-utils");

function analyzeTypeConfusion(ir, options = {}) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      analysis: null
    };
  }

  const settings = {
    includeLowRisk: options.includeLowRisk === true
  };

  const findings = [];
  const summary = {
    totalBinaryExpressions: 0,
    potentialConfusions: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  };

  walkAST(ir.program, (node) => {
    if (node.type === "BinaryExpression" && node.operator) {
      summary.totalBinaryExpressions += 1;
      const finding = analyzeBinaryExpression(node);
      if (finding) {
        if (finding.severity === "high") summary.highRisk += 1;
        if (finding.severity === "medium") summary.mediumRisk += 1;
        if (finding.severity === "low") summary.lowRisk += 1;
        summary.potentialConfusions += 1;
        if (settings.includeLowRisk || finding.severity !== "low") {
          findings.push(finding);
        }
      }
    }
  });

  const recommendations = buildRecommendations(summary);

  return {
    success: true,
    analysis: {
      findings,
      summary,
      recommendations
    },
    timestamp: new Date().toISOString()
  };
}

function analyzeBinaryExpression(node) {
  const leftType = inferPrimitiveType(node.left);
  const rightType = inferPrimitiveType(node.right);
  const operator = node.operator;

  if (COERCIVE_OPERATORS.has(operator)) {
    const risk = classifyTypeRisk(leftType, rightType);
    return {
      kind: "coercive-equality",
      operator,
      severity: risk === "high" ? "high" : "medium",
      reason: "Loose equality can coerce types",
      leftType,
      rightType,
      guard: buildEqualityGuard(operator, leftType, rightType)
    };
  }

  if (operator === "+") {
    if (leftType === "string" || rightType === "string" || leftType === "unknown" || rightType === "unknown") {
      return {
        kind: "mixed-plus",
        operator,
        severity: "medium",
        reason: "Plus operator may coerce to string",
        leftType,
        rightType,
        guard: buildNumericGuard(leftType, rightType)
      };
    }
  }

  if (NUMERIC_OPERATORS.has(operator)) {
    if (!isNumericLike(leftType) || !isNumericLike(rightType)) {
      return {
        kind: "numeric-coercion",
        operator,
        severity: leftType === "unknown" || rightType === "unknown" ? "medium" : "high",
        reason: "Numeric operator with non-numeric operand",
        leftType,
        rightType,
        guard: buildNumericGuard(leftType, rightType)
      };
    }
  }

  if (COMPARISON_OPERATORS.has(operator)) {
    if (leftType !== rightType && leftType !== "unknown" && rightType !== "unknown") {
      return {
        kind: "comparison-mismatch",
        operator,
        severity: "low",
        reason: "Comparison between different primitive types",
        leftType,
        rightType,
        guard: buildComparisonGuard(leftType, rightType)
      };
    }
    if (leftType === "unknown" || rightType === "unknown") {
      return {
        kind: "comparison-unknown",
        operator,
        severity: "low",
        reason: "Comparison with unknown operand type",
        leftType,
        rightType,
        guard: buildComparisonGuard(leftType, rightType)
      };
    }
  }

  return null;
}

function inferPrimitiveType(node) {
  if (!node) return "unknown";
  switch (node.type) {
  case "Literal":
    if (node.value === null) return "null";
    if (typeof node.value === "string") return "string";
    if (typeof node.value === "number") return "number";
    if (typeof node.value === "boolean") return "boolean";
    return "unknown";
  case "Identifier":
    return "unknown";
  case "ArrayExpression":
    return "array";
  case "ObjectExpression":
    return "object";
  case "FunctionExpression":
  case "ArrowFunctionExpression":
    return "function";
  case "UnaryExpression":
    if (node.operator === "!") return "boolean";
    if (node.operator === "+") return "number";
    if (node.operator === "typeof") return "string";
    return "unknown";
  case "CallExpression":
    return inferCallReturnType(node);
  default:
    return "unknown";
  }
}

function inferCallReturnType(node) {
  if (!node || !node.callee) return "unknown";
  if (node.callee.type === "Identifier") {
    if (node.callee.name === "Number") return "number";
    if (node.callee.name === "String") return "string";
    if (node.callee.name === "Boolean") return "boolean";
  }
  return "unknown";
}

function classifyTypeRisk(leftType, rightType) {
  if (leftType === "unknown" || rightType === "unknown") return "medium";
  if (leftType !== rightType) return "high";
  return "low";
}

function isNumericLike(type) {
  return type === "number" || type === "boolean" || type === "unknown";
}

function buildEqualityGuard(operator, leftType, rightType) {
  return {
    kind: "strict-equality",
    suggestion: operator === "==" || operator === "!="
      ? "Prefer strict equality (===/!==) or explicit coercion"
      : "Use strict equality",
    expectedTypes: [leftType, rightType]
  };
}

function buildNumericGuard(leftType, rightType) {
  return {
    kind: "numeric-guard",
    suggestion: "Ensure both operands are numbers before arithmetic",
    expectedTypes: [leftType, rightType]
  };
}

function buildComparisonGuard(leftType, rightType) {
  return {
    kind: "comparison-guard",
    suggestion: "Normalize operand types before comparison",
    expectedTypes: [leftType, rightType]
  };
}

function buildRecommendations(summary) {
  const recommendations = [];
  if (summary.highRisk > 0) {
    recommendations.push(`⚠ ${summary.highRisk} high-risk coercion(s) detected - tighten equality checks.`);
  }
  if (summary.mediumRisk > 0) {
    recommendations.push(`✓ Add runtime type guards for ${summary.mediumRisk} medium-risk operation(s).`);
  }
  if (summary.potentialConfusions === 0) {
    recommendations.push("✓ No type confusion risks detected in binary operations.");
  }
  return recommendations;
}

function applyTypeGuards(ir, analysis) {
  if (!ir || !analysis || !analysis.analysis) return ir;

  const optimizedIR = safeCloneIR(ir);
  const findings = analysis.analysis.findings || [];
  const guardsByOperator = new Map();

  findings.forEach((finding) => {
    const key = `${finding.kind}:${finding.operator}`;
    guardsByOperator.set(key, finding.guard || null);
  });

  let markedCount = 0;

  walkAST(optimizedIR.program, (node) => {
    if (node.type === "BinaryExpression" && node.operator) {
      const key = `${resolveGuardKind(node.operator)}:${node.operator}`;
      if (guardsByOperator.has(key)) {
        node._typeGuard = guardsByOperator.get(key);
        markedCount += 1;
      }
    }
  });

  return {
    optimizedIR,
    markedCount,
    summary: analysis.analysis.summary
  };
}

function resolveGuardKind(operator) {
  if (COERCIVE_OPERATORS.has(operator)) return "coercive-equality";
  if (operator === "+") return "mixed-plus";
  if (NUMERIC_OPERATORS.has(operator)) return "numeric-coercion";
  if (COMPARISON_OPERATORS.has(operator)) return "comparison-mismatch";
  return "unknown";
}

function walkAST(node, callback, parent = null, seen = new WeakSet()) {
  if (!node) return;
  if (typeof node === "object") {
    if (seen.has(node)) return;
    seen.add(node);
  }

  callback(node, parent);

  if (typeof node === "object") {
    for (const key of Object.keys(node)) {
      if (key === "parent" || key.startsWith("_")) continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => walkAST(item, callback, node, seen));
      } else if (typeof child === "object" && child !== null) {
        walkAST(child, callback, node, seen);
      }
    }
  }
}

module.exports = {
  analyzeTypeConfusion,
  applyTypeGuards,
  inferPrimitiveType,
  analyzeBinaryExpression,
  _walkAST: walkAST
};
