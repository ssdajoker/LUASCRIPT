#!/usr/bin/env node

/**
 * BOUNDS CHECKING EMITTER - JavaScript Security Optimization Phase 3.3
 *
 * Generates runtime bounds checks for array accesses discovered by the
 * buffer overflow detector. Outputs check metadata for downstream emitters.
 */

const {
  analyzeBufferOverflow,
  createAccessKey
} = require("./buffer-overflow-detection");
const { safeCloneIR } = require("../ir-utils");

function emitBoundsChecks(ir, options = {}) {
  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      checks: []
    };
  }

  const analysis = options.analysis || analyzeBufferOverflow(ir, options.analysisOptions || {});
  if (!analysis || !analysis.success) {
    return {
      success: false,
      error: analysis ? analysis.error : "Analysis failed",
      checks: []
    };
  }

  const includeSafe = options.includeSafeAccesses === true;
  const dedupe = options.dedupe !== false;
  const checks = [];
  const seen = new Set();

  (analysis.analysis.findings || []).forEach((finding, idx) => {
    if (!includeSafe && finding.status === "safe") return;
    const check = buildBoundsCheck(finding, idx + 1);
    if (!check) return;
    if (dedupe) {
      if (seen.has(check.key)) return;
      seen.add(check.key);
    }
    checks.push(check);
  });

  return {
    success: true,
    checks,
    summary: {
      totalChecks: checks.length,
      outOfBoundsChecks: checks.filter(c => c.severity === "high").length,
      dynamicChecks: checks.filter(c => c.severity === "medium").length
    },
    timestamp: new Date().toISOString()
  };
}

function buildBoundsCheck(finding, sequence) {
  if (!finding || !finding.access) return null;

  const access = finding.access;
  const objectName = access.objectName || "array";
  const indexExpr = access.indexLiteral !== null ? String(access.indexLiteral) : "index";
  const lengthExpr = typeof access.arrayLength === "number" ? String(access.arrayLength) : `${objectName}.length`;
  const condition = `${indexExpr} >= 0 && ${indexExpr} < ${lengthExpr}`;

  return {
    id: `bounds-check-${sequence}`,
    key: access.key,
    target: objectName,
    index: indexExpr,
    length: lengthExpr,
    condition,
    onFail: `throw new RangeError("Out-of-bounds access on ${objectName}")`,
    severity: finding.severity,
    status: finding.status
  };
}

function applyBoundsChecks(ir, emission) {
  if (!ir || !emission || !emission.checks) return ir;

  const optimizedIR = safeCloneIR(ir);
  const checksByKey = new Map();
  emission.checks.forEach(check => {
    checksByKey.set(check.key, check);
  });

  let attachedCount = 0;

  walkAST(optimizedIR.program, (node) => {
    if (node.type === "MemberExpression" && node.computed) {
      const key = createAccessKey(node);
      if (checksByKey.has(key)) {
        node._boundsCheck = checksByKey.get(key);
        attachedCount += 1;
      }
    }
  });

  return {
    optimizedIR,
    attachedCount,
    summary: emission.summary
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
  emitBoundsChecks,
  applyBoundsChecks,
  buildBoundsCheck,
  _walkAST: walkAST
};
