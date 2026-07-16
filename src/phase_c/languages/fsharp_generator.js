/**
 * F# PHASE C GENERATOR - TIER 3 IMPLEMENTATION
 * Generates Lua and JavaScript from F# Phase C AST:
 * - Computation expressions → Promise/coroutine desugaring
 * - Active patterns → predicate functions
 * - Discriminated unions → tagged unions
 * - Records → object/record constructors
 * - Units of measure → metadata comments
 * - Type providers → provider stubs
 * - Pattern matching + guards
 * - Tier 2 profiling hooks + nested computation rendering
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");
const { ForensicDebugTools, DEBUG_MODES } = require("../forensic_debug_tools");
const { performance } = require("perf_hooks");

class FSharpPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(config = {}) {
    super({
      language: "FSharp",
      ...config
    });

    this.forensic = config.forensicDebugTools || new ForensicDebugTools(
      config.forensicMode || DEBUG_MODES.PRODUCTION,
      config.forensicOptions || {}
    );

    this.generatorMetrics = {
      computationsGenerated: 0,
      activePatternsGenerated: 0,
      unionsGenerated: 0,
      recordsGenerated: 0,
      recordExpressionsGenerated: 0,
      typeProvidersGenerated: 0,
      matchExpressionsGenerated: 0
    };

    this.profiling = {
      generationTimeMs: 0,
      luaTimeMs: 0,
      jsTimeMs: 0,
      computationExpressionMs: 0
    };
  }

  generateLua(astResult) {
    const startTime = performance.now();
    const ast = astResult.ast || astResult;
    const lines = [];

    lines.push("-- F# Phase C → Lua");
    lines.push("local function __ce_return(x) return x end");
    lines.push("");

    for (const union of ast.unions || []) {
      lines.push(this.generateLuaUnion(union));
      this.generatorMetrics.unionsGenerated++;
    }

    for (const record of ast.records || []) {
      lines.push(this.generateLuaRecordType(record));
      this.generatorMetrics.recordsGenerated++;
    }

    for (const recordExpr of ast.recordExpressions || []) {
      lines.push(this.generateLuaRecordExpression(recordExpr));
      this.generatorMetrics.recordExpressionsGenerated++;
    }

    for (const computation of ast.computations || []) {
      lines.push(this.generateLuaComputation(computation));
      this.generatorMetrics.computationsGenerated++;
    }

    for (const pattern of ast.activePatterns || []) {
      lines.push(this.generateLuaActivePattern(pattern));
      this.generatorMetrics.activePatternsGenerated++;
    }

    for (const provider of ast.typeProviders || []) {
      lines.push(this.generateLuaTypeProvider(provider));
      this.generatorMetrics.typeProvidersGenerated++;
    }

    for (const matchExpr of ast.matchExpressions || []) {
      lines.push(this.generateLuaMatch(matchExpr));
      this.generatorMetrics.matchExpressionsGenerated++;
    }

    const output = lines.filter(Boolean).join("\n");
    this.profiling.luaTimeMs = performance.now() - startTime;
    this.profiling.generationTimeMs = this.profiling.luaTimeMs;
    return output;
  }

  generateJavaScript(astResult) {
    const startTime = performance.now();
    const ast = astResult.ast || astResult;
    const lines = [];

    lines.push("// F# Phase C → JavaScript");
    lines.push("const __ce_return = (x) => x;");
    lines.push("");

    for (const union of ast.unions || []) {
      lines.push(this.generateJSUnion(union));
      this.generatorMetrics.unionsGenerated++;
    }

    for (const record of ast.records || []) {
      lines.push(this.generateJSRecordType(record));
      this.generatorMetrics.recordsGenerated++;
    }

    for (const recordExpr of ast.recordExpressions || []) {
      lines.push(this.generateJSRecordExpression(recordExpr));
      this.generatorMetrics.recordExpressionsGenerated++;
    }

    for (const computation of ast.computations || []) {
      lines.push(this.generateJSComputation(computation));
      this.generatorMetrics.computationsGenerated++;
    }

    for (const pattern of ast.activePatterns || []) {
      lines.push(this.generateJSActivePattern(pattern));
      this.generatorMetrics.activePatternsGenerated++;
    }

    for (const provider of ast.typeProviders || []) {
      lines.push(this.generateJSTypeProvider(provider));
      this.generatorMetrics.typeProvidersGenerated++;
    }

    for (const matchExpr of ast.matchExpressions || []) {
      lines.push(this.generateJSMatch(matchExpr));
      this.generatorMetrics.matchExpressionsGenerated++;
    }

    const output = lines.filter(Boolean).join("\n");
    this.profiling.jsTimeMs = performance.now() - startTime;
    this.profiling.generationTimeMs = this.profiling.jsTimeMs;
    return output;
  }

  generateLuaUnion(node) {
    const constructors = (node.cases || []).map((ctor) => {
      if (ctor.fields && ctor.fields.length > 0) {
        return `  ${ctor.name} = function(...) return { tag = "${ctor.name}", values = {...} } end`;
      }
      return `  ${ctor.name} = function() return { tag = "${ctor.name}" } end`;
    });

    return `-- Discriminated union ${node.name}\nlocal ${node.name} = {\n${constructors.join(",\n")}\n}`;
  }

  generateJSUnion(node) {
    const constructors = (node.cases || []).map((ctor) => {
      if (ctor.fields && ctor.fields.length > 0) {
        return `  ${ctor.name}: (...values) => ({ tag: "${ctor.name}", values })`;
      }
      return `  ${ctor.name}: () => ({ tag: "${ctor.name}" })`;
    });

    return `// Discriminated union ${node.name}\nconst ${node.name} = {\n${constructors.join(",\n")}\n};`;
  }

  generateLuaRecordType(node) {
    const fieldAssignments = (node.fields || []).map(f => `  ${f.name} = ${f.name}`).join(",\n");
    return `-- Record type ${node.name}\nlocal function ${node.name}(${(node.fields || []).map(f => f.name).join(", ")})\n  return {\n${fieldAssignments}\n  }\nend`;
  }

  generateJSRecordType(node) {
    const params = (node.fields || []).map(f => f.name).join(", ");
    const assignments = (node.fields || []).map(f => `  ${f.name}: ${f.name}`).join(",\n");
    return `// Record type ${node.name}\nconst ${node.name} = (${params}) => ({\n${assignments}\n});`;
  }

  generateLuaRecordExpression(node) {
    const assignments = (node.fields || []).map(f => `  ${f.name} = ${f.value || "nil"}`).join(",\n");
    return `-- Record expression\nlocal _record = {\n${assignments}\n}`;
  }

  generateJSRecordExpression(node) {
    const assignments = (node.fields || []).map(f => `  ${f.name}: ${f.value || "null"}`).join(",\n");
    return `// Record expression\nconst _record = {\n${assignments}\n};`;
  }

  renderExpression(expr, target) {
    if (!expr) return target === "lua" ? "nil" : "null";
    if (typeof expr === "string") return expr;

    if (expr.kind === "computation_expression") {
      return this.renderComputationExpressionInline(expr, target);
    }

    if (expr.kind === "expression" && Array.isArray(expr.parts)) {
      return expr.parts
        .map(part => (typeof part === "string" ? part : this.renderComputationExpressionInline(part, target)))
        .join(" ")
        .trim();
    }

    return target === "lua" ? "nil" : "null";
  }

  renderComputationExpressionInline(node, target) {
    const bodyLines = this.buildComputationBody(node, target);
    if (target === "lua") {
      return `coroutine.create(function()\n${bodyLines}\nend)`;
    }
    return `(async () => {\n${bodyLines}\n})()`;
  }

  buildComputationBody(node, target) {
    const lines = [];
    for (const step of node.steps || []) {
      const expr = this.renderExpression(step.expr, target);
      if (step.kind === "let_bang") {
        if (target === "lua") {
          lines.push(`  local ${step.name || "_value"} = ${expr || "nil"}`);
        } else {
          lines.push(`  const ${step.name || "_value"} = await ${expr || "null"};`);
        }
      } else if (step.kind === "do_bang" || step.kind === "use_bang") {
        if (target === "lua") {
          lines.push(`  ${expr || "nil"}`);
        } else {
          lines.push(`  await ${expr || "null"};`);
        }
      } else if (step.kind === "return" || step.kind === "return_bang") {
        if (target === "lua") {
          lines.push(`  return __ce_return(${expr || "nil"})`);
        } else {
          lines.push(`  return __ce_return(${expr || "null"});`);
        }
      } else if (step.kind === "yield" || step.kind === "yield_bang") {
        if (target === "lua") {
          lines.push(`  coroutine.yield(${expr || "nil"})`);
        } else {
          lines.push(`  return ${expr || "null"};`);
        }
      }
    }
    return lines.join("\n");
  }

  generateLuaComputation(node) {
    const startTime = performance.now();
    const lines = ["-- Computation expression", "local _ce = coroutine.create(function()"];
    const loopId = `fsharp_generate_lua_ce_${this.generatorMetrics.computationsGenerated}`;
    this.forensic.monitorLoop(loopId, (node.steps || []).length + 5);
    this.forensic.startTimeout();

    for (const step of node.steps || []) {
      this.forensic.logIteration(loopId);
      if (!this.forensic.checkTimeout()) {
        throw new Error("Lua computation expression generation timeout");
      }
      const expr = this.renderExpression(step.expr, "lua");
      if (step.kind === "let_bang") {
        lines.push(`  local ${step.name || "_value"} = ${expr || "nil"}`);
      } else if (step.kind === "do_bang" || step.kind === "use_bang") {
        lines.push(`  ${expr || "nil"}`);
      } else if (step.kind === "return" || step.kind === "return_bang") {
        lines.push(`  return __ce_return(${expr || "nil"})`);
      } else if (step.kind === "yield" || step.kind === "yield_bang") {
        lines.push(`  coroutine.yield(${expr || "nil"})`);
      }
    }
    lines.push("end)");
    this.forensic.completeLoop(loopId);
    this.profiling.computationExpressionMs += performance.now() - startTime;
    return lines.join("\n");
  }

  generateJSComputation(node) {
    const startTime = performance.now();
    const lines = ["// Computation expression", "const _ce = (async () => {"];
    const loopId = `fsharp_generate_js_ce_${this.generatorMetrics.computationsGenerated}`;
    this.forensic.monitorLoop(loopId, (node.steps || []).length + 5);
    this.forensic.startTimeout();

    for (const step of node.steps || []) {
      this.forensic.logIteration(loopId);
      if (!this.forensic.checkTimeout()) {
        throw new Error("JavaScript computation expression generation timeout");
      }
      const expr = this.renderExpression(step.expr, "javascript");
      if (step.kind === "let_bang") {
        lines.push(`  const ${step.name || "_value"} = await ${expr || "null"};`);
      } else if (step.kind === "do_bang" || step.kind === "use_bang") {
        lines.push(`  await ${expr || "null"};`);
      } else if (step.kind === "return" || step.kind === "return_bang") {
        lines.push(`  return __ce_return(${expr || "null"});`);
      } else if (step.kind === "yield" || step.kind === "yield_bang") {
        lines.push(`  return ${expr || "null"};`);
      }
    }
    lines.push("})();");
    this.forensic.completeLoop(loopId);
    this.profiling.computationExpressionMs += performance.now() - startTime;
    return lines.join("\n");
  }

  generateLuaActivePattern(node) {
    const cases = (node.cases || []).map((c) => `  if value == ${c} then return "${c}" end`).join("\n");
    return `-- Active pattern\nlocal function active_pattern(value)\n${cases}\n  return nil\nend`;
  }

  generateJSActivePattern(node) {
    const cases = (node.cases || []).map((c) => `  if (value === ${c}) return "${c}";`).join("\n");
    return `// Active pattern\nconst activePattern = (value) => {\n${cases}\n  return null;\n};`;
  }

  generateLuaTypeProvider(node) {
    return `-- Type provider ${node.provider}\nlocal ${node.name} = { __provider = "${node.provider}", args = "${node.arguments || ""}" }`;
  }

  generateJSTypeProvider(node) {
    return `// type provider ${node.provider}\nconst ${node.name} = { __provider: "${node.provider}", args: "${node.arguments || ""}" };`;
  }

  generateLuaMatch(node) {
    const lines = ["-- Match expression", `local _value = ${node.scrutinee || "nil"}`];
    for (const c of node.cases || []) {
      const guard = c.guard ? ` and (${c.guard})` : "";
      lines.push(`if _value == ${c.pattern}${guard} then`);
      lines.push(`  ${c.body || "nil"}`);
      lines.push("end");
    }
    return lines.join("\n");
  }

  generateJSMatch(node) {
    const lines = ["// Match expression", `const _value = ${node.scrutinee || "null"};`];
    for (const c of node.cases || []) {
      const guard = c.guard ? ` && (${c.guard})` : "";
      lines.push(`if (_value === ${c.pattern}${guard}) {`);
      lines.push(`  ${c.body || "null"};`);
      lines.push("}");
    }
    return lines.join("\n");
  }

  getMetrics() {
    return {
      ...this.generatorMetrics,
      profiling: { ...this.profiling }
    };
  }
}

module.exports = FSharpPhaseC_Generator;
