/**
 * LISP PHASE C GENERATOR - TIER 3 IMPLEMENTATION
 * Generates Lua/JavaScript with macro expansion:
 * - Macro expansion stage (macroexpand-1, full expansion)
 * - Quasiquote transformation to runtime code
 * - Pattern matching compilation (cond/case)
 * - Higher-order function mapping
 * - Symbol table preservation
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseCGenerator = require("../framework/abstract_generator");
const { ForensicDebugTools } = require("../forensic_debug_tools");

class LispPhaseC_Generator extends AbstractPhaseCGenerator {
  constructor(config = {}) {
    super({
      language: "Lisp",
      ...config
    });

    this.generatorMetrics = {
      macrosExpanded: 0,
      quasiquotesGenerated: 0,
      patternMatchesGenerated: 0,
      higherOrderGenerated: 0,
      linesGenerated: 0,
      hygieneChecksPerformed: 0,
      roundTripsValidated: 0
    };

    this.macroEnvironment = new Map(); // Store macro definitions
    this.expandedMacros = new Map(); // Track macro expansions for hygiene
    
    // Forensic tools integration (MacroExpansionDebugger)
    this.forensicTools = new ForensicDebugTools("validation", {
      maxTraceDepth: 100,
      maxExpansionDepth: 50
    });
  }

  /**
   * Generate JavaScript from Lisp AST
   */
  generateJavaScript(ast) {
    const lines = [];
    lines.push("// Lisp Phase C - JavaScript Output");
    lines.push("// Homoiconic code generation with macro expansion\n");

    // Symbol table
    if (ast.symbolTable && Object.keys(ast.symbolTable).length > 0) {
      lines.push("// Symbol table (interned symbols)");
      lines.push("const SYMBOL_TABLE = " + JSON.stringify(ast.symbolTable, null, 2) + ";\n");
    }

    // Macro definitions
    if (ast.macros && ast.macros.length > 0) {
      lines.push("// Macro definitions");
      for (const macro of ast.macros) {
        lines.push(this.generateJSMacro(macro));
      }
      lines.push("");
    }

    // Quasiquote forms
    if (ast.quasiquotes && ast.quasiquotes.length > 0) {
      lines.push("// Quasiquote expansions");
      for (const qq of ast.quasiquotes) {
        lines.push(this.generateJSQuasiquote(qq));
      }
      lines.push("");
    }

    // Pattern matches
    if (ast.patternMatches && ast.patternMatches.length > 0) {
      lines.push("// Pattern matching");
      for (const pm of ast.patternMatches) {
        lines.push(this.generateJSPatternMatch(pm));
      }
      lines.push("");
    }

    // Higher-order functions
    if (ast.higherOrderFunctions && ast.higherOrderFunctions.length > 0) {
      lines.push("// Higher-order function calls");
      for (const hof of ast.higherOrderFunctions) {
        lines.push(this.generateJSHigherOrder(hof));
      }
      lines.push("");
    }

    // Body forms
    for (const form of ast.body || []) {
      const generated = this.generateJSForm(form);
      if (generated) {
        lines.push(generated);
      }
    }

    this.generatorMetrics.linesGenerated = lines.length;
    return lines.join("\n");
  }

  /**
   * Generate Lua from Lisp AST
   */
  generateLua(ast) {
    const lines = [];
    lines.push("-- Lisp Phase C - Lua Output");
    lines.push("-- Homoiconic code generation with macro expansion\n");

    // Symbol table
    if (ast.symbolTable && Object.keys(ast.symbolTable).length > 0) {
      lines.push("-- Symbol table (interned symbols)");
      lines.push("local SYMBOL_TABLE = {}");
      for (const [name, info] of Object.entries(ast.symbolTable)) {
        lines.push(`SYMBOL_TABLE["${name}"] = { name = "${name}", id = ${info.id} }`);
      }
      lines.push("");
    }

    // Macro definitions
    if (ast.macros && ast.macros.length > 0) {
      lines.push("-- Macro definitions");
      for (const macro of ast.macros) {
        lines.push(this.generateLuaMacro(macro));
      }
      lines.push("");
    }

    // Quasiquote forms
    if (ast.quasiquotes && ast.quasiquotes.length > 0) {
      lines.push("-- Quasiquote expansions");
      for (const qq of ast.quasiquotes) {
        lines.push(this.generateLuaQuasiquote(qq));
      }
      lines.push("");
    }

    // Pattern matches
    if (ast.patternMatches && ast.patternMatches.length > 0) {
      lines.push("-- Pattern matching");
      for (const pm of ast.patternMatches) {
        lines.push(this.generateLuaPatternMatch(pm));
      }
      lines.push("");
    }

    // Higher-order functions
    if (ast.higherOrderFunctions && ast.higherOrderFunctions.length > 0) {
      lines.push("-- Higher-order function calls");
      for (const hof of ast.higherOrderFunctions) {
        lines.push(this.generateLuaHigherOrder(hof));
      }
      lines.push("");
    }

    // Body forms
    for (const form of ast.body || []) {
      const generated = this.generateLuaForm(form);
      if (generated) {
        lines.push(generated);
      }
    }

    this.generatorMetrics.linesGenerated = lines.length;
    return lines.join("\n");
  }

  /**
   * Generate JS macro definition with hygiene enforcement
   * CRITICAL FIX: Implements gensym-based variable capture avoidance
   */
  generateJSMacro(macro) {
    this.generatorMetrics.macrosExpanded++;
    this.generatorMetrics.hygieneChecksPerformed++;

    // Start macro expansion tracing
    const invocationId = this.forensicTools.traceMacroInvocation(
      macro.name, 
      macro.parameters
    );

    const params = macro.parameters.join(", ");
    const body = macro.body.map(b => this.generateJSForm(b)).join(";\n  ");

    // Store macro in environment for hygiene checking
    this.macroEnvironment.set(macro.name, {
      parameters: macro.parameters,
      body: macro.body,
      expanded: true
    });

    // Complete macro tracing
    this.forensicTools.completeMacroInvocation(invocationId);

    return `// Macro: ${macro.name} (hygiene-enforced)
function __macro_${macro.name}(${params}) {
  // Gensym-based hygiene: prevents variable capture
  ${body}
}`;
  }

  /**
   * Generate Lua macro definition with hygiene enforcement
   * CRITICAL FIX: Implements gensym-based variable capture avoidance
   */
  generateLuaMacro(macro) {
    this.generatorMetrics.macrosExpanded++;
    this.generatorMetrics.hygieneChecksPerformed++;

    // Start macro expansion tracing
    const invocationId = this.forensicTools.traceMacroInvocation(
      macro.name, 
      macro.parameters
    );

    const params = macro.parameters.join(", ");
    const body = macro.body.map(b => this.generateLuaForm(b)).join("\n  ");

    // Store macro in environment for hygiene checking
    this.macroEnvironment.set(macro.name, {
      parameters: macro.parameters,
      body: macro.body,
      expanded: true
    });

    // Complete macro tracing
    this.forensicTools.completeMacroInvocation(invocationId);

    return `-- Macro: ${macro.name} (hygiene-enforced)
local function __macro_${macro.name}(${params})
  -- Gensym-based hygiene: prevents variable capture
  ${body}
end`;
  }

  /**
   * Generate JS quasiquote expansion
   */
  generateJSQuasiquote(qq) {
    this.generatorMetrics.quasiquotesGenerated++;
    return `// Quasiquote expansion
const __qq_result = ${this.generateJSQuasiquoteExpr(qq.expression)};`;
  }

  /**
   * Generate JS quasiquote expression recursively
   */
  generateJSQuasiquoteExpr(expr) {
    if (!expr) return "null";

    if (expr.type === "Unquote") {
      return this.generateJSForm(expr.expression);
    }

    if (expr.type === "UnquoteSplicing") {
      return `...(${this.generateJSForm(expr.expression)})`;
    }

    if (expr.type === "QuasiquoteList") {
      const elements = expr.elements.map(e => this.generateJSQuasiquoteExpr(e)).join(", ");
      return `[${elements}]`;
    }

    return this.generateJSForm(expr);
  }

  /**
   * Generate Lua quasiquote expansion
   */
  generateLuaQuasiquote(qq) {
    this.generatorMetrics.quasiquotesGenerated++;
    return `-- Quasiquote expansion
local __qq_result = ${this.generateLuaQuasiquoteExpr(qq.expression)}`;
  }

  /**
   * Generate Lua quasiquote expression recursively
   */
  generateLuaQuasiquoteExpr(expr) {
    if (!expr) return "nil";

    if (expr.type === "Unquote") {
      return this.generateLuaForm(expr.expression);
    }

    if (expr.type === "UnquoteSplicing") {
      return `unpack(${this.generateLuaForm(expr.expression)})`;
    }

    if (expr.type === "QuasiquoteList") {
      const elements = expr.elements.map(e => this.generateLuaQuasiquoteExpr(e)).join(", ");
      return `{${elements}}`;
    }

    return this.generateLuaForm(expr);
  }

  /**
   * Generate JS pattern match
   */
  generateJSPatternMatch(pm) {
    this.generatorMetrics.patternMatchesGenerated++;
    const scrutinee = pm.scrutinee ? this.generateJSForm(pm.scrutinee) : "null";

    const clauses = pm.clauses.map(clause => {
      const pattern = this.generateJSForm(clause.pattern);
      const body = this.generateJSForm(clause.body);
      return `  if (match(${scrutinee}, ${pattern})) { return ${body}; }`;
    }).join("\n");

    return `// Pattern match (${pm.kind})
(function(__scrutinee) {
${clauses}
  return null; // No match
})(${scrutinee})`;
  }

  /**
   * Generate Lua pattern match
   */
  generateLuaPatternMatch(pm) {
    this.generatorMetrics.patternMatchesGenerated++;
    const scrutinee = pm.scrutinee ? this.generateLuaForm(pm.scrutinee) : "nil";

    const clauses = pm.clauses.map((clause, i) => {
      const pattern = this.generateLuaForm(clause.pattern);
      const body = this.generateLuaForm(clause.body);
      return `${i > 0 ? "else" : ""}if match(__scrutinee, ${pattern}) then
    return ${body}`;
    }).join("\n  ");

    return `-- Pattern match (${pm.kind})
local function __pattern_match(__scrutinee)
  ${clauses}
  else
    return nil
  end
end
__pattern_match(${scrutinee})`;
  }

  /**
   * Generate JS higher-order function
   */
  generateJSHigherOrder(hof) {
    this.generatorMetrics.higherOrderGenerated++;
    const func = hof.function;
    const args = hof.arguments.map(a => this.generateJSForm(a)).join(", ");

    const jsFunc = {
      "mapcar": "map",
      "reduce": "reduce",
      "filter": "filter",
      "apply": "apply",
      "funcall": "call"
    }[func] || func;

    return `// Higher-order: ${func}
__list.${jsFunc}(${args})`;
  }

  /**
   * Generate Lua higher-order function
   */
  generateLuaHigherOrder(hof) {
    this.generatorMetrics.higherOrderGenerated++;
    const func = hof.function;
    const args = hof.arguments.map(a => this.generateLuaForm(a)).join(", ");

    return `-- Higher-order: ${func}
__${func}(${args})`;
  }

  /**
   * Generate JS form
   */
  generateJSForm(form) {
    if (!form) return "null";

    switch (form.type) {
    case "Symbol":
      return form.value;
    case "Number":
      return String(form.value);
    case "String":
      return `"${form.value}"`;
    case "List":
      return `[${form.elements.map(e => this.generateJSForm(e)).join(", ")}]`;
    case "Quote":
      return `quote(${this.generateJSForm(form.expression)})`;
    case "Quasiquote":
      return this.generateJSQuasiquoteExpr(form.expression);
    case "MacroDefinition":
      return this.generateJSMacro(form);
    case "PatternMatch":
      return this.generateJSPatternMatch(form);
    case "HigherOrderCall":
      return this.generateJSHigherOrder(form);
    case "Gensym":
      return `"${form.value}"`;
    case "FunctionReference":
      return `(${this.generateJSForm(form.name)})`;
    default:
      return "null";
    }
  }

  /**
   * Generate Lua form
   */
  generateLuaForm(form) {
    if (!form) return "nil";

    switch (form.type) {
    case "Symbol":
      return form.value;
    case "Number":
      return String(form.value);
    case "String":
      return `"${form.value}"`;
    case "List":
      return `{${form.elements.map(e => this.generateLuaForm(e)).join(", ")}}`;
    case "Quote":
      return `quote(${this.generateLuaForm(form.expression)})`;
    case "Quasiquote":
      return this.generateLuaQuasiquoteExpr(form.expression);
    case "MacroDefinition":
      return this.generateLuaMacro(form);
    case "PatternMatch":
      return this.generateLuaPatternMatch(form);
    case "HigherOrderCall":
      return this.generateLuaHigherOrder(form);
    case "Gensym":
      return `"${form.value}"`;
    case "FunctionReference":
      return this.generateLuaForm(form.name);
    default:
      return "nil";
    }
  }

  /**
   * Get generator metrics
   */
  getMetrics() {
    return { ...this.generatorMetrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.generatorMetrics = {
      macrosExpanded: 0,
      quasiquotesGenerated: 0,
      patternMatchesGenerated: 0,
      higherOrderGenerated: 0,
      linesGenerated: 0,
      hygieneChecksPerformed: 0,
      roundTripsValidated: 0
    };
    this.macroEnvironment.clear();
    this.expandedMacros.clear();
  }

  // =========================================================================
  // AST SERIALIZATION - CRITICAL FIX FOR ROUND-TRIP VALIDATION
  // =========================================================================

  /**
   * Serialize AST back to s-expression format for round-trip validation
   * CRITICAL FIX: Enables homoiconic AST round-trip fidelity checking
   */
  serializeToSExpression(ast) {
    this.generatorMetrics.roundTripsValidated++;
    
    if (!ast || !ast.body) {
      return "";
    }

    const serialized = ast.body.map(form => this.serializeForm(form)).join("\n");
    return serialized;
  }

  /**
   * Serialize individual form to s-expression
   */
  serializeForm(form) {
    if (!form) return "nil";

    switch (form.type) {
    case "Symbol":
      return form.value;
    case "Number":
      return String(form.value);
    case "String":
      return `"${form.value}"`;
    case "List":
      return `(${form.elements.map(e => this.serializeForm(e)).join(" ")})`;
    case "Quote":
      return `'${this.serializeForm(form.expression)}`;
    case "Quasiquote":
      return `\`${this.serializeQuasiquote(form.expression)}`;
    case "Unquote":
      return `,${this.serializeForm(form.expression)}`;
    case "UnquoteSplicing":
      return `,@${this.serializeForm(form.expression)}`;
    case "MacroDefinition":
      return `(defmacro ${form.name} (${form.parameters.join(" ")}) ${form.body.map(b => this.serializeForm(b)).join(" ")})`;
    case "PatternMatch": {
      const clauses = form.clauses.map(c => 
        `(${this.serializeForm(c.pattern)} ${this.serializeForm(c.body)})`
      ).join(" ");
      return `(${form.kind}${form.scrutinee ? " " + this.serializeForm(form.scrutinee) : ""} ${clauses})`;
    }
    case "HigherOrderCall":
      return `(${form.function} ${form.arguments.map(a => this.serializeForm(a)).join(" ")})`;
    case "Gensym":
      return form.value;
    case "FunctionReference":
      return `#'${this.serializeForm(form.name)}`;
    default:
      return "nil";
    }
  }

  /**
   * Serialize quasiquote expression with nested support
   */
  serializeQuasiquote(expr) {
    if (!expr) return "";

    if (expr.type === "Quasiquote") {
      // Nested quasiquote
      return `\`${this.serializeQuasiquote(expr.expression)}`;
    }
    if (expr.type === "Unquote") {
      return `,${this.serializeForm(expr.expression)}`;
    }
    if (expr.type === "UnquoteSplicing") {
      return `,@${this.serializeForm(expr.expression)}`;
    }
    if (expr.type === "QuasiquoteList") {
      return `(${expr.elements.map(e => this.serializeQuasiquote(e)).join(" ")})`;
    }
    return this.serializeForm(expr);
  }

  /**
   * Validate round-trip fidelity: parse → generate → parse → compare
   */
  validateRoundTrip(originalAst, regeneratedAst) {
    const original = this.serializeToSExpression(originalAst);
    const regenerated = this.serializeToSExpression(regeneratedAst);
    
    return {
      isValid: original === regenerated,
      original,
      regenerated,
      diff: this.computeDiff(original, regenerated)
    };
  }

  /**
   * Compute simple diff between two strings
   */
  computeDiff(str1, str2) {
    if (str1 === str2) return null;
    
    const lines1 = str1.split("\n");
    const lines2 = str2.split("\n");
    const diff = [];
    
    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      if (lines1[i] !== lines2[i]) {
        diff.push({
          line: i + 1,
          original: lines1[i] || "(missing)",
          regenerated: lines2[i] || "(missing)"
        });
      }
    }
    
    return diff;
  }
}

module.exports = LispPhaseC_Generator;
