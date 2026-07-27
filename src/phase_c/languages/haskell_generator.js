/**
 * HASKELL PHASE C GENERATOR - TIER 3 IMPLEMENTATION
 * Generates Lua and JavaScript from Haskell Phase C AST:
 * - Type classes & instances → class/record skeletons
 * - ADTs/GADTs → tagged unions
 * - Do-notation → monadic bind chains
 * - Lazy semantics → thunks + force helpers
 * - Higher-kinded types → comments / metadata
 *
 * Complexity: TIER 3 - HARD
 * Lines: 320
 *
 * Known semantic gaps (documented for Tier 2):
 * NOTE: Phase D enhancement - GAP-001: Overlapping/duplicate instance detection
 * NOTE: Phase D enhancement - GAP-002: Template Haskell quasi-quotes/splices
 * NOTE: Phase D enhancement - GAP-003: Exhaustiveness checking for GADT patterns
 * NOTE: Phase D enhancement - GAP-004: Infinite list/space leak detection
 * NOTE: Phase D enhancement - GAP-005: Monad transformer stack/lift depth analysis
 * NOTE: Phase D enhancement - GAP-006: Type family/associated type recognition
 * NOTE: Phase D enhancement - GAP-007: Multi-parameter type class validation
 * NOTE: Phase D enhancement - GAP-008: Existential quantification parsing/AST
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");

class HaskellPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(config = {}) {
    super({
      language: "Haskell",
      ...config
    });

    this.generatorMetrics = {
      typeClassesGenerated: 0,
      instancesGenerated: 0,
      dataTypesGenerated: 0,
      gadtsGenerated: 0,
      doBlocksGenerated: 0,
      lazyHelpersGenerated: 0
    };
  }

  generateLua(astResult) {
    const ast = astResult.ast || astResult;
    const lines = [];

    // Runtime helpers model Haskell-like laziness and monadic binding in Lua.
    lines.push("-- Haskell Phase C → Lua");
    lines.push("local function __thunk(fn) return { __thunk = fn } end");
    lines.push("local function __force(v)");
    lines.push("  if type(v) == \"table\" and v.__thunk then return v.__thunk() end");
    lines.push("  if type(v) == \"function\" then return v() end");
    lines.push("  return v");
    lines.push("end");
    lines.push("local function __bind(m, f) return f(__force(m)) end");
    lines.push("local function __unit(x) return x end");
    lines.push("");
    this.generatorMetrics.lazyHelpersGenerated++;

    // Typeclass skeletons become Lua tables with method stubs.
    for (const typeClass of ast.typeClasses || []) {
      lines.push(this.generateLuaTypeClass(typeClass));
      this.generatorMetrics.typeClassesGenerated++;
    }

    // Instance declarations become table instances keyed by class + type name.
    for (const instance of ast.instances || []) {
      lines.push(this.generateLuaInstance(instance));
      this.generatorMetrics.instancesGenerated++;
    }

    // ADTs/GADTs emit tagged union constructors.
    for (const dataType of ast.dataTypes || []) {
      lines.push(this.generateLuaDataType(dataType));
      this.generatorMetrics.dataTypesGenerated++;
      if (dataType.kind === "gadt_definition") this.generatorMetrics.gadtsGenerated++;
    }

    // Expressions map to Lua snippets (do-blocks, case expressions).
    for (const expr of ast.expressions || []) {
      if (expr.kind === "do_block") {
        lines.push(this.generateLuaDoBlock(expr));
        this.generatorMetrics.doBlocksGenerated++;
      } else if (expr.kind === "case_expression") {
        lines.push(this.generateLuaCase(expr));
      }
    }

    return lines.filter(Boolean).join("\n");
  }

  generateJavaScript(astResult) {
    const ast = astResult.ast || astResult;
    const lines = [];

    // Runtime helpers model Haskell-like laziness and monadic binding in JS.
    lines.push("// Haskell Phase C → JavaScript");
    lines.push("const __thunk = (fn) => ({ __thunk: fn });");
    lines.push("const __force = (v) => {");
    lines.push("  if (v && v.__thunk) return v.__thunk();");
    lines.push("  if (typeof v === \"function\") return v();");
    lines.push("  return v;");
    lines.push("};");
    lines.push("const __bind = (m, f) => f(__force(m));");
    lines.push("const __unit = (x) => x;");
    lines.push("");
    this.generatorMetrics.lazyHelpersGenerated++;

    // Typeclass skeletons become ES class shells with comment signatures.
    for (const typeClass of ast.typeClasses || []) {
      lines.push(this.generateJavaScriptTypeClass(typeClass));
      this.generatorMetrics.typeClassesGenerated++;
    }

    // Instances become plain objects (minimal semantics for Tier 3 output).
    for (const instance of ast.instances || []) {
      lines.push(this.generateJavaScriptInstance(instance));
      this.generatorMetrics.instancesGenerated++;
    }

    // ADTs/GADTs emit tagged constructors (no runtime type checking).
    for (const dataType of ast.dataTypes || []) {
      lines.push(this.generateJavaScriptDataType(dataType));
      this.generatorMetrics.dataTypesGenerated++;
      if (dataType.kind === "gadt_definition") this.generatorMetrics.gadtsGenerated++;
    }

    // Expressions map to JS snippets (do-blocks, case expressions).
    for (const expr of ast.expressions || []) {
      if (expr.kind === "do_block") {
        lines.push(this.generateJavaScriptDoBlock(expr));
        this.generatorMetrics.doBlocksGenerated++;
      } else if (expr.kind === "case_expression") {
        lines.push(this.generateJavaScriptCase(expr));
      }
    }

    return lines.filter(Boolean).join("\n");
  }

  /**
   * Emit a Lua typeclass shell with comment signatures.
   */
  generateLuaTypeClass(node) {
    const methodComments = (node.methods || []).map(m => `-- ${m.name} :: ${m.signature || "()"}`).join("\n");
    return `-- typeclass ${node.name}\n${methodComments}\nlocal ${node.name} = {}`;
  }

  /**
   * Emit a JS class shell with comment signatures.
   */
  generateJavaScriptTypeClass(node) {
    const methodComments = (node.methods || []).map(m => `  // ${m.name} :: ${m.signature || "()"}`).join("\n");
    return `// typeclass ${node.name}\nclass ${node.name} {\n${methodComments}\n}`;
  }

  /**
   * Emit a Lua instance table with stubbed methods.
   */
  generateLuaInstance(node) {
    const methods = (node.methods || []).map(m => `  ${m.name} = function(...) return nil end`).join(",\n");
    return `-- instance ${node.className} ${node.instanceType}\nlocal ${node.className}_${this.sanitizeName(node.instanceType)} = {\n${methods}\n}`;
  }

  /**
   * Emit a JS instance object with stubbed methods.
   */
  generateJavaScriptInstance(node) {
    const methods = (node.methods || []).map(m => `  ${m.name}() { return null; }`).join("\n");
    return `// instance ${node.className} ${node.instanceType}\nconst ${node.className}_${this.sanitizeName(node.instanceType)} = {\n${methods}\n};`;
  }

  /**
   * Emit Lua tagged union constructors for ADTs/GADTs.
   */
  generateLuaDataType(node) {
    const constructors = (node.constructors || []).map((ctor) => {
      if (node.kind === "gadt_definition") {
        return `  ${ctor.name} = function(value) return { tag = "${ctor.name}", value = value, type = "${ctor.typeSignature || ""}" } end`;
      }
      if (ctor.fields && ctor.fields.length > 0) {
        return `  ${ctor.name} = function(...) return { tag = "${ctor.name}", values = {...} } end`;
      }
      return `  ${ctor.name} = function() return { tag = "${ctor.name}" } end`;
    });

    const header = node.kind === "gadt_definition" ? `-- GADT ${node.name}` : `-- ADT ${node.name}`;
    return `${header}\nlocal ${node.name} = {\n${constructors.join(",\n")}\n}`;
  }

  /**
   * Emit JS tagged union constructors for ADTs/GADTs.
   */
  generateJavaScriptDataType(node) {
    const constructors = (node.constructors || []).map((ctor) => {
      if (node.kind === "gadt_definition") {
        return `  ${ctor.name}: (value) => ({ tag: "${ctor.name}", value, type: "${ctor.typeSignature || ""}" })`;
      }
      if (ctor.fields && ctor.fields.length > 0) {
        return `  ${ctor.name}: (...values) => ({ tag: "${ctor.name}", values })`;
      }
      return `  ${ctor.name}: () => ({ tag: "${ctor.name}" })`;
    });

    const header = node.kind === "gadt_definition" ? `// GADT ${node.name}` : `// ADT ${node.name}`;
    return `${header}\nconst ${node.name} = {\n${constructors.join(",\n")}\n};`;
  }

  /**
   * Emit a Lua do-block as an IIFE for sequencing.
   */
  generateLuaDoBlock(node) {
    const lines = ["-- do-block", "(function()"];
    for (const stmt of node.statements || []) {
      if (stmt.kind === "bind") {
        lines.push(`  local ${stmt.name} = __force(${stmt.expr || "nil"})`);
      } else {
        lines.push(`  __force(${stmt.expr || "nil"})`);
      }
    }
    lines.push("end)()");
    return lines.join("\n");
  }

  /**
   * Emit a JS do-block as an IIFE for sequencing.
   */
  generateJavaScriptDoBlock(node) {
    const lines = ["// do-block", "(() => {"];
    for (const stmt of node.statements || []) {
      if (stmt.kind === "bind") {
        lines.push(`  const ${stmt.name} = __force(${stmt.expr || "null"});`);
      } else {
        lines.push(`  __force(${stmt.expr || "null"});`);
      }
    }
    lines.push("})();");
    return lines.join("\n");
  }

  /**
   * Emit a Lua case expression as comments + placeholder evaluation.
   */
  generateLuaCase(node) {
    const lines = ["-- case expression", "(function()"];
    lines.push(`  local _value = ${node.scrutinee || "nil"}`);
    for (const item of node.cases || []) {
      lines.push(`  -- ${item.pattern} -> ${item.body}`);
    }
    lines.push("end)()");
    return lines.join("\n");
  }

  /**
   * Emit a JS case expression as comments + placeholder evaluation.
   */
  generateJavaScriptCase(node) {
    const lines = ["// case expression", "(() => {"];
    lines.push(`  const _value = ${node.scrutinee || "null"};`);
    for (const item of node.cases || []) {
      lines.push(`  // ${item.pattern} -> ${item.body}`);
    }
    lines.push("})();");
    return lines.join("\n");
  }

  /**
   * Sanitize names for use in Lua/JS identifiers.
   */
  sanitizeName(name) {
    if (!name) return "Instance";
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  /**
   * Return immutable snapshot of generator metrics for tests and profiling.
   */
  getMetrics() {
    return { ...this.generatorMetrics };
  }
}

module.exports = HaskellPhaseC_Generator;
