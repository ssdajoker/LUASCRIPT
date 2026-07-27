#!/usr/bin/env node

/**
 * BUFFER OVERFLOW DETECTION - JavaScript Security Optimization Phase 3.3
 *
 * Detects suspicious array bounds access patterns and annotates IR nodes
 * with metadata for downstream bounds-checking emission.
 *
 * Goals:
 * - Identify constant out-of-bounds accesses
 * - Flag dynamic index accesses that require runtime checks
 * - Track arrays with known length and mutation status
 * - Provide actionable security recommendations
 */

const DEFAULT_MUTATING_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "copyWithin",
  "fill"
]);
const { safeCloneIR } = require("../ir-utils");

function analyzeBufferOverflow(ir, options = {}) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      analysis: null
    };
  }

  const settings = {
    includeSafeAccesses: options.includeSafeAccesses === true,
    trackMutations: options.trackMutations !== false,
    mutatingMethods: options.mutatingMethods || DEFAULT_MUTATING_METHODS
  };

  const arrayBindings = new Map();
  const findings = [];
  const summary = {
    totalArrayAccesses: 0,
    safeAccesses: 0,
    needsCheckAccesses: 0,
    outOfBoundsAccesses: 0,
    unknownLengthAccesses: 0,
    mutatedArrays: 0
  };

  walkAST(ir.program, (node, parent) => {
    if (node.type === "VariableDeclarator" && node.id && node.id.type === "Identifier") {
      const declarator = node;
      const init = declarator.init;
      const declaration = parent && parent.type === "VariableDeclaration" ? parent : null;
      if (init && init.type === "ArrayExpression") {
        const binding = {
          name: declarator.id.name,
          length: init.elements.length,
          declaredKind: declaration ? declaration.kind : "var",
          mutable: declaration ? declaration.kind !== "const" : true
        };
        arrayBindings.set(binding.name, binding);
      }
    }

    if (node.type === "AssignmentExpression" && node.left && node.right) {
      if (node.left.type === "Identifier" && node.right.type === "ArrayExpression") {
        const binding = {
          name: node.left.name,
          length: node.right.elements.length,
          declaredKind: "assignment",
          mutable: true
        };
        arrayBindings.set(binding.name, binding);
      }
    }

    if (settings.trackMutations && node.type === "CallExpression" && node.callee) {
      const callee = node.callee;
      if (callee.type === "MemberExpression" && callee.object && callee.property) {
        const targetName = callee.object.type === "Identifier" ? callee.object.name : null;
        const methodName = resolvePropertyName(callee.property);
        if (targetName && methodName && settings.mutatingMethods.has(methodName)) {
          const binding = arrayBindings.get(targetName);
          if (binding) {
            binding.mutable = true;
            binding.length = null;
            summary.mutatedArrays += 1;
          }
        }
      }
    }

    if (node.type === "MemberExpression" && node.computed && node.property) {
      const access = analyzeArrayAccess(node, arrayBindings);
      if (!access) return;

      summary.totalArrayAccesses += 1;
      if (access.status === "safe") {
        summary.safeAccesses += 1;
        if (settings.includeSafeAccesses) {
          findings.push(access);
        }
      } else if (access.status === "out-of-bounds") {
        summary.outOfBoundsAccesses += 1;
        findings.push(access);
      } else if (access.status === "unknown-length") {
        summary.unknownLengthAccesses += 1;
        findings.push(access);
      } else {
        summary.needsCheckAccesses += 1;
        findings.push(access);
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

function analyzeArrayAccess(node, arrayBindings) {
  if (!node || node.type !== "MemberExpression" || !node.computed) return null;

  const access = {
    status: "needs-check",
    severity: "medium",
    reason: "Dynamic index access",
    access: {
      object: describeNode(node.object),
      property: describeNode(node.property),
      objectName: node.object && node.object.type === "Identifier" ? node.object.name : null,
      indexLiteral: null,
      arrayLength: null,
      key: createAccessKey(node)
    }
  };

  const arrayInfo = resolveArrayBinding(node.object, arrayBindings);
  if (arrayInfo) {
    access.access.arrayLength = arrayInfo.length;
  }

  if (node.property.type === "Literal" && typeof node.property.value === "number") {
    access.access.indexLiteral = node.property.value;
    if (arrayInfo && typeof arrayInfo.length === "number") {
      if (node.property.value < 0 || node.property.value >= arrayInfo.length) {
        access.status = "out-of-bounds";
        access.severity = "high";
        access.reason = "Literal index exceeds known array bounds";
      } else {
        access.status = "safe";
        access.severity = "low";
        access.reason = "Literal index within known bounds";
      }
    }
  } else {
    // Dynamic index - needs runtime check
    if (arrayInfo && typeof arrayInfo.length === "number" && !arrayInfo.mutable) {
      access.status = "needs-check";
      access.severity = "medium";
      access.reason = "Dynamic index requires runtime bounds check";
    } else if (arrayInfo && arrayInfo.mutable) {
      access.status = "unknown-length";
      access.severity = "medium";
      access.reason = "Array length is mutable";
    } else {
      access.status = "unknown-length";
      access.severity = "medium";
      access.reason = "Array length unknown";
    }
  }

  if (!arrayInfo && access.status === "needs-check") {
    access.status = "unknown-length";
    access.severity = "medium";
    access.reason = "Array length unknown";
  }

  return access;
}

function resolveArrayBinding(node, arrayBindings) {
  if (!node) return null;
  if (node.type === "ArrayExpression") {
    return {
      name: "<literal>",
      length: node.elements.length,
      mutable: false
    };
  }
  if (node.type === "Identifier") {
    return arrayBindings.get(node.name) || null;
  }
  return null;
}

function resolvePropertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return null;
}

function describeNode(node) {
  if (!node) return "<unknown>";
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal") return JSON.stringify(node.value);
  return node.type;
}

function createAccessKey(node) {
  const objectName = node.object && node.object.type === "Identifier" ? node.object.name : "<expr>";
  const index = node.property && node.property.type === "Literal"
    ? `literal:${node.property.value}`
    : `dynamic:${node.property ? node.property.type : "unknown"}`;
  return `${objectName}:${index}`;
}

function buildRecommendations(summary) {
  const recommendations = [];
  if (summary.outOfBoundsAccesses > 0) {
    recommendations.push(
      `⚠ ${summary.outOfBoundsAccesses} constant out-of-bounds access(es) detected - review immediately.`
    );
  }
  if (summary.needsCheckAccesses > 0 || summary.unknownLengthAccesses > 0) {
    recommendations.push(
      `✓ Add runtime bounds checks for ${summary.needsCheckAccesses + summary.unknownLengthAccesses} dynamic access(es).`
    );
  }
  if (summary.safeAccesses === summary.totalArrayAccesses) {
    recommendations.push("✓ All array accesses appear within known bounds.");
  }
  if (summary.totalArrayAccesses === 0) {
    recommendations.push("ℹ No array index operations detected.");
  }
  return recommendations;
}

function applyBufferOverflowProtection(ir, analysis, options = {}) {
  if (!ir || !analysis || !analysis.analysis) return ir;

  const settings = {
    markSafeAccesses: options.markSafeAccesses === true
  };

  const findings = analysis.analysis.findings || [];
  const keysToMark = new Set(
    findings
      .filter(finding => settings.markSafeAccesses || finding.status !== "safe")
      .map(finding => finding.access.key)
  );

  const optimizedIR = safeCloneIR(ir);
  let markedCount = 0;

  walkAST(optimizedIR.program, (node) => {
    if (node.type === "MemberExpression" && node.computed) {
      const key = createAccessKey(node);
      if (keysToMark.has(key)) {
        node._boundsCheck = {
          status: "required",
          key
        };
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
  analyzeBufferOverflow,
  applyBufferOverflowProtection,
  analyzeArrayAccess,
  resolveArrayBinding,
  createAccessKey,
  _walkAST: walkAST
};
