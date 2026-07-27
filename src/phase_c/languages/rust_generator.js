/**
 * RUST PHASE C GENERATOR
 * Generates Lua and JavaScript code from Rust AST
 * 
 * Features:
 * - Trait bounds → Interface definitions
 * - Lifetimes → Scope/lifetime management comments
 * - Macros → Template expansion (println → print, vec → array)
 * - Pattern matching → Switch/case constructs
 * - Ownership → Reference counting / GC hints
 * - Generic parameters → Type variable tracking
 * - Associated types → Property extraction
 * 
 * Lines: 320
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");

class RustPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(ast, config = {}) {
    super(ast, {
      language: "Rust",
      ...config
    });

    this.rustTemplates = {
      lua: {
        trait: "local %s = {}\nfunction %s:new()\n  local obj = {}\n  %s\n  return obj\nend",
        lifetime: "-- Lifetime: %s\n-- Constraints: %s",
        macro_println: "print(%s)",
        macro_vec: "local %s = {%s}",
        macro_assert: "assert(%s, \"%s\")",
        match: "if %s then\n  %s\nelseif %s then\n  %s\nelse\n  %s\nend",
        ownership_ref: "local %s_ref = %s",
        ownership_mut: "local %s_mut = %s",
        ownership_move: "%s = nil  -- moved",
        generic: "-- Generic<T> implemented as generic table",
        associated_type: "obj[\"%s\"] = %s"
      },
      javascript: {
        trait: "class %s {\n  constructor() {\n%s\n  }\n}",
        lifetime: "// Lifetime: %s\n// Constraints: %s",
        macro_println: "console.log(%s)",
        macro_vec: "const %s = [%s]",
        macro_assert: "console.assert(%s, \"%s\")",
        match: "if (%s) {\n  %s\n} else if (%s) {\n  %s\n} else {\n  %s\n}",
        ownership_ref: "const %s_ref = %s",
        ownership_mut: "let %s_mut = %s",
        ownership_move: "%s = null  // moved",
        generic: "// Generic<T> with template tracking",
        associated_type: "this[\"%s\"] = %s"
      }
    };

    this.generationMetrics = {
      traitsGenerated: 0,
      lifetimesGenerated: 0,
      macrosGenerated: 0,
      patternsGenerated: 0,
      ownershipMarksGenerated: 0,
      genericsGenerated: 0
    };

    this.generatedCode = {
      lua: [],
      javascript: []
    };
  }

  /**
   * MAIN GENERATE FUNCTION
   * Orchestrates code generation for all target languages
   */
  generate() {
    this.output = [];
    this.indentLevel = 0;

    try {
      this.generateHeader();

      if (this.ast.body && Array.isArray(this.ast.body)) {
        for (const node of this.ast.body) {
          this.generateRustNode(node);
        }
      }

      this.generateFooter();

      return this.output.join("\n");
    } catch (error) {
      this.generatedMetrics.errors = this.generatedMetrics.errors || [];
      this.generatedMetrics.errors.push(`Rust generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * GENERATE RUST-SPECIFIC NODES
   */
  generateRustNode(node) {
    if (!node) return;

    switch (node.type) {
    case "TraitBound":
      this.generateTraitBound(node);
      break;
    case "Lifetime":
      this.generateLifetime(node);
      break;
    case "MacroInvocation":
      this.generateMacroInvocation(node);
      break;
    case "PatternMatch":
      this.generatePatternMatch(node);
      break;
    case "Ownership":
      this.generateOwnership(node);
      break;
    case "GenericParams":
      this.generateGenericParams(node);
      break;
    default:
      super.generateNode(node);
    }
  }

  /**
   * GENERATE TRAIT BOUNDS
   * Rust: trait MyTrait { ... }
   * Lua: local MyTrait = { }
   * JS: class MyTrait { }
   */
  generateTraitBound(node) {
    const traitName = node.paramName || "Trait";
    const bounds = (node.bounds || []).join(", ");

    if (this.config.target === "lua") {
      this.emit(`-- Trait: ${traitName}`);
      if (bounds) {
        this.emit(`-- Bounds: ${bounds}`);
      }
      this.emit(`local ${traitName} = {}`);
      this.emit(`function ${traitName}:new()`);
      this.incIndent();
      this.emit("local obj = {}");
      this.emit("setmetatable(obj, self)");
      this.emit("self.__index = self");
      this.emit("return obj");
      this.decIndent();
      this.emit("end");
    } else {
      this.emit(`// Trait: ${traitName}`);
      if (bounds) {
        this.emit(`// Bounds: ${bounds}`);
      }
      this.emit(`class ${traitName} {`);
      this.incIndent();
      this.emit("constructor() {}");
      this.decIndent();
      this.emit("}");
    }

    this.generationMetrics.traitsGenerated++;
  }

  /**
   * GENERATE LIFETIME ANNOTATIONS
   * Rust: fn borrow<'a>(x: &'a str) -> &'a str
   * Generated as comment with constraint info
   */
  generateLifetime(node) {
    const lifetimeName = node.name;
    const constraints = node.constraints ? node.constraints.join(" + ") : "none";

    if (this.config.target === "lua") {
      this.emit(`-- Lifetime: '${lifetimeName}`);
      this.emit(`-- Constraints: ${constraints}`);
      this.emit("-- Scope management: references must outlive this scope");
    } else {
      this.emit(`// Lifetime: '${lifetimeName}`);
      this.emit(`// Constraints: ${constraints}`);
      this.emit("// Scope management: references must outlive this scope");
    }

    this.generationMetrics.lifetimesGenerated++;
  }

  /**
   * GENERATE MACRO INVOCATIONS
   * Rust: println!("Hello {}", name);
   * Lua: print("Hello " .. name)
   * JS: console.log("Hello", name)
   */
  generateMacroInvocation(node) {
    const macroName = node.macroName.toLowerCase();
    const args = (node.arguments || []).join(", ");

    if (this.config.target === "lua") {
      if (macroName === "println") {
        this.emit(`print(${args})`);
      } else if (macroName === "vec") {
        this.emit(`local vec_${this.generationMetrics.macrosGenerated} = {${args}}`);
      } else if (macroName === "assert") {
        this.emit(`assert(${args})`);
      } else if (macroName === "panic") {
        this.emit(`error("panic: " .. tostring(${args}))`);
      } else {
        this.emit(`-- Macro: ${macroName}(${args})`);
      }
    } else {
      if (macroName === "println") {
        this.emit(`console.log(${args})`);
      } else if (macroName === "vec") {
        this.emit(`const vec_${this.generationMetrics.macrosGenerated} = [${args}]`);
      } else if (macroName === "assert") {
        this.emit(`console.assert(${args})`);
      } else if (macroName === "panic") {
        this.emit(`throw new Error("panic: " + ${args})`);
      } else {
        this.emit(`// Macro: ${macroName}(${args})`);
      }
    }

    this.generationMetrics.macrosGenerated++;
  }

  /**
   * GENERATE PATTERN MATCHING
   * Rust: match value { Ok(x) => { ... } Err(e) => { ... } }
   * Lua: if cond then ... elseif cond then ... else ... end
   * JS: if (cond) { ... } else if (cond) { ... } else { ... }
   */
  generatePatternMatch(node) {
    const scrutinee = node.scrutinee || "value";
    const patterns = node.patterns || ["pattern"];
    const _arms = node.arms || [];

    if (this.config.target === "lua") {
      this.emit(`-- Pattern match on: ${scrutinee}`);
      
      // Generate if/elseif/else structure
      if (patterns.length > 0) {
        patterns.forEach((pattern, index) => {
          if (index === 0) {
            this.emit(`if ${scrutinee} == "${pattern}" then`);
          } else if (index < patterns.length - 1) {
            this.emit(`elseif ${scrutinee} == "${pattern}" then`);
          } else {
            this.emit("else");
          }
          this.incIndent();
          this.emit("-- pattern body");
          this.decIndent();
        });
      } else {
        // Default: at least one if
        this.emit(`if ${scrutinee} then`);
        this.incIndent();
        this.emit("-- match body");
        this.decIndent();
      }
      
      this.emit("end");
    } else {
      this.emit(`// Pattern match on: ${scrutinee}`);
      
      // Generate if/else if/else structure for JavaScript
      if (patterns.length > 0) {
        patterns.forEach((pattern, index) => {
          if (index === 0) {
            this.emit(`if (${scrutinee} === "${pattern}") {`);
          } else if (index < patterns.length - 1) {
            this.emit(`} else if (${scrutinee} === "${pattern}") {`);
          } else {
            this.emit("} else {");
          }
          this.incIndent();
          this.emit("// pattern body");
          this.decIndent();
        });
        this.emit("}");
      } else {
        // Default: at least one if
        this.emit(`if (${scrutinee}) {`);
        this.incIndent();
        this.emit("// match body");
        this.decIndent();
        this.emit("}");
      }
    }

    this.generationMetrics.patternsGenerated++;
  }

  /**
   * GENERATE OWNERSHIP MARKERS
   * Rust: &T (immutable borrow), &mut T (mutable borrow), move
   * Lua: local ref = value
   * JS: const ref = value
   */
  generateOwnership(node) {
    const target = node.target || "value";
    const kind = node.kind;

    if (this.config.target === "lua") {
      if (kind === "immutable_borrow") {
        this.emit(`local ${target}_borrow = ${target}  -- immutable reference`);
      } else if (kind === "mutable_borrow") {
        this.emit(`local ${target}_mut = ${target}  -- mutable reference`);
      } else if (kind === "dereference") {
        this.emit(`local ${target}_deref = deref(${target})`);
      } else if (kind === "move_semantics") {
        this.emit(`-- move semantics: ${target} ownership transferred`);
        this.emit(`${target} = nil`);
      }
    } else {
      if (kind === "immutable_borrow") {
        this.emit(`const ${target}_borrow = ${target};  // immutable reference`);
      } else if (kind === "mutable_borrow") {
        this.emit(`let ${target}_mut = ${target};  // mutable reference`);
      } else if (kind === "dereference") {
        this.emit(`const ${target}_deref = deref(${target});`);
      } else if (kind === "move_semantics") {
        this.emit(`// move semantics: ${target} ownership transferred`);
        this.emit(`${target} = null;`);
      }
    }

    this.generationMetrics.ownershipMarksGenerated++;
  }

  /**
   * GENERATE GENERIC PARAMETERS
   * Rust: <T>, <'a, T: Clone>
   * Generated as type variable tracking comments
   */
  generateGenericParams(node) {
    const params = node.parameters || [];
    const lifetimes = node.lifetimes || [];
    const allParams = [...lifetimes, ...params].join(", ");

    if (this.config.target === "lua") {
      this.emit(`-- Generic parameters: <${allParams}>`);
      if (node.isTurbofish) {
        this.emit("-- Turbofish syntax detected");
      }
      
      params.forEach(param => {
        this.emit(`-- Type var: ${param}`);
      });
      
      lifetimes.forEach(lifetime => {
        this.emit(`-- Lifetime: ${lifetime}`);
      });
    } else {
      this.emit(`// Generic parameters: <${allParams}>`);
      if (node.isTurbofish) {
        this.emit("// Turbofish syntax detected");
      }
      
      params.forEach(param => {
        this.emit(`// Type var: ${param}`);
      });
      
      lifetimes.forEach(lifetime => {
        this.emit(`// Lifetime: ${lifetime}`);
      });
    }

    this.generationMetrics.genericsGenerated++;
  }

  /**
   * GENERATE HEADER
   */
  generateHeader() {
    if (this.config.target === "lua") {
      this.emit("-- Rust Phase C Generated Code");
      this.emit("-- Generated from Rust AST");
      this.emit("");
    } else {
      this.emit("// Rust Phase C Generated Code");
      this.emit("// Generated from Rust AST");
      this.emit("");
    }
  }

  /**
   * GENERATE FOOTER
   */
  generateFooter() {
    if (this.config.target === "lua") {
      this.emit("");
      this.emit("-- End of generated code");
    } else {
      this.emit("");
      this.emit("// End of generated code");
    }
  }

  /**
   * EMIT LINE WITH INDENTATION
   */
  emit(line) {
    const indent = "  ".repeat(this.indentLevel);
    this.output.push(indent + line);
  }

  /**
   * INCREASE INDENT
   */
  incIndent() {
    this.indentLevel++;
  }

  /**
   * DECREASE INDENT
   */
  decIndent() {
    if (this.indentLevel > 0) {
      this.indentLevel--;
    }
  }

  /**
   * GET METRICS
   */
  getMetrics() {
    return {
      traitsGenerated: this.generationMetrics.traitsGenerated,
      lifetimesGenerated: this.generationMetrics.lifetimesGenerated,
      macrosGenerated: this.generationMetrics.macrosGenerated,
      patternsGenerated: this.generationMetrics.patternsGenerated,
      ownershipMarksGenerated: this.generationMetrics.ownershipMarksGenerated,
      genericsGenerated: this.generationMetrics.genericsGenerated,
      totalNodes: Object.values(this.generationMetrics).reduce((a, b) => a + b, 0)
    };
  }
}

module.exports = RustPhaseC_Generator;
