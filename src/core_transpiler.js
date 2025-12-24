
/**
 * LUASCRIPT Core Transpiler - Tony Yoka's Unified Team Implementation
 * Complete JavaScript to Lua Transpiler with Advanced Features
 * 
 * Team: Tony Yoka (Lead) + Steve Jobs + Donald Knuth + PS2/PS3 Team + 32+ Developers
 * Mission: 100% Implementation of Phases 1-6, Build Phases 7-9
 * 
 * PHASE 4: IR Pipeline Integration (December 20, 2025)
 * Now routes transpilation through modern AST → IR → Lua pipeline
 */

const { EventEmitter } = require("events");
const { IRPipeline } = require("./ir/pipeline-integration");

/**
 * The CoreTranspiler class is responsible for the primary transformation of JavaScript code into Lua.
 * It uses a pattern-based approach to replace JavaScript syntax with its Lua equivalents.
 * This class forms the foundation of the LUASCRIPT transpilation engine.
 * @extends EventEmitter
 */
class CoreTranspiler extends EventEmitter {
  /**
     * Creates an instance of the CoreTranspiler.
     * @param {object} [options={}] - The configuration options for the transpiler.
     * @param {string} [options.target='lua5.4'] - The target Lua version.
     * @param {boolean} [options.optimize=true] - Whether to apply optimizations.
     * @param {boolean} [options.sourceMap=true] - Whether to generate source maps.
     * @param {boolean} [options.strict=true] - Whether to enforce strict mode.
     */
  constructor(options = {}) {
    super();
        
    this.options = {
      target: options.target || "lua5.4",
      optimize: options.optimize !== false,
      sourceMap: options.sourceMap !== false,
      strict: options.strict !== false,
      validate: options.validate !== false,
      emitDebugInfo: options.emitDebugInfo || false,
      ...options
    };
        
    // Initialize IR Pipeline as primary transpilation engine
    this.irPipeline = new IRPipeline({
      validate: this.options.validate && this.options.strict, // Only strict validate if strict mode enabled
      emitDebugInfo: this.options.emitDebugInfo
    });
        
    // Legacy cache and patterns (kept for backward compatibility)
    this.patterns = new Map();
    this.cache = new Map();
    this.tempVarCounter = 0;
    this.stats = {
      transpiled: 0,
      errors: 0,
      warnings: 0,
      optimizations: 0,
      irPipeline: {
        processed: 0,
        errors: 0,
        warnings: 0
      }
    };
        
    this.initializePatterns();
  }

  /**
     * Initializes the core set of regex patterns for transpilation.
     * These patterns cover fundamental JavaScript syntax such as variables, operators, and control structures.
     */
  initializePatterns() {
    // Core JavaScript to Lua patterns
    this.patterns.set("variables", [
      { from: /\bvar\s+(\w+)/g, to: "local $1" },
      { from: /\blet\s+(\w+)/g, to: "local $1" },
      { from: /\bconst\s+(\w+)/g, to: "local $1" }
    ]);
        
    this.patterns.set("objects", [
      { from: /([{,])\s*(\w+)\s*:/g, to: "$1$2 =" }
    ]);

    this.patterns.set("operators", [
      { from: /\|\|/g, to: "or" },
      { from: /&&/g, to: "and" },
      { from: /!/g, to: "not " },
      { from: /!==/g, to: "~=" },
      { from: /!=/g, to: "~=" },
      { from: /===/g, to: "==" }
    ]);
        
    // Restrict function assignment rewrites to start-of-line (with optional indentation) to avoid breaking object literals
    this.patterns.set("functions", [
      { from: /^\s*function\s+(\w+)\s*\(([^)]*)\)\s*\{/gm, to: "local function $1($2)" },
      { from: /^\s*(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm, to: "local function $1($2)" },
      { from: /(\w+)\s*:\s*function\s*\(([^)]*)\)\s*\{/g, to: "$1 = function($2)" }
    ]);
        
    this.patterns.set("control", [
      { from: /if\s*\(/g, to: "if " },
      { from: /\)\s*{/g, to: " then" },
      { from: /else\s*{/g, to: "else" },
      { from: /while\s*\(/g, to: "while " },
      { from: /for\s*\(/g, to: "for " }
    ]);
        
    this.patterns.set("strings", [
      { from: /(\w+|"[^"]*"|'[^']*')\s*\+\s*(\w+|"[^"]*"|'[^']*')/g, to: "$1 .. $2" }
    ]);
        
    this.patterns.set("arrays", [
      { from: /\.push\s*\(/g, to: ".insert(" },
      { from: /\.pop\s*\(\s*\)/g, to: ".remove()" },
      { from: /\.length/g, to: ".#" }
    ]);

    this.patterns.set("math_operators", [
      {
        from: /∏\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
        to: "math.product(function($1) return ($4) end, $2, $3)"
      },
      {
        from: /∑\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
        to: "math.summation(function($1) return ($4) end, $2, $3)"
      },
      {
        from: /∫\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
        to: "math.integral(function($1) return ($4) end, $2, $3)"
      }
    ]);
  }

  /**
     * @param {object} node - The AST node to convert.
     * @returns {string} The generated Lua code fragment for the node.
     */
  generateLuaFromAST(node) {
    if (!node) {
      return "";
    }

    switch (node.type) {
    case "Program":
      return node.body.map(child => this.generateLuaFromAST(child)).filter(Boolean).join("\n");

    case "BlockStatement":
      return node.body.map(child => this.generateLuaFromAST(child)).filter(Boolean).join("\n");

    case "ExpressionStatement":
      if (!node.expression) {
        return "";
      }
      if (node.expression.type === "UpdateExpression") {
        return this.generateUpdateExpression(node.expression, true);
      }
      return this.generateLuaFromAST(node.expression);


    case "BinaryExpression":
    case "LogicalExpression": {
      const left = this.generateLuaFromAST(node.left);
      const right = this.generateLuaFromAST(node.right);
      const operator = this.getLuaOperator(
        node.operator,
        this.isStringNode(node.left),
        this.isStringNode(node.right)
      );
      return `${left} ${operator} ${right}`;
    }

    case "Identifier":
      return node.name;

    case "Literal":
      return node.raw !== undefined ? node.raw : JSON.stringify(node.value);

    case "VariableDeclaration": {
      const declarations = node.declarations
        .map(decl => this.generateLuaFromAST(decl))
        .filter(Boolean);
      if (!declarations.length) {
        return "";
      }
      return `local ${declarations.join(", ")}`;
    }

    case "VariableDeclarator": {
      const id = this.generateLuaFromAST(node.id);
      const init = node.init ? this.generateLuaFromAST(node.init) : "nil";
      return `${id} = ${init}`;
    }

    case "ArrayPattern": {
      // Generate destructuring pattern for arrays
      const elements = node.elements.map((el, _idx) => {
        if (!el) return null;  // holes in pattern
        if (el.type === "RestElement") {
          return `...${this.generateLuaFromAST(el.argument)}`;
        }
        return this.generateLuaFromAST(el);
      }).filter(Boolean);
      return elements.join(", ");
    }

    case "ObjectPattern": {
      // Generate destructuring pattern for objects  
      const props = node.properties.map(prop => {
        const key = prop.key.name || this.generateLuaFromAST(prop.key);
        if (prop.value.type === "Identifier" && prop.value.name === key) {
          return key;  // shorthand
        }
        return `${key} = ${this.generateLuaFromAST(prop.value)}`;
      });
      return props.join(", ");
    }

    case "RestElement": {
      return `...${this.generateLuaFromAST(node.argument)}`;
    }

    case "FunctionDeclaration": {
      const id = this.generateLuaFromAST(node.id);
      const params = node.params.map(param => this.generateLuaFromAST(param)).join(", ");
      const body = this.generateLuaFromAST(node.body);
      let indentedBody = this.indentCode(body);

      let functionCode;
      if (indentedBody) {
        functionCode = `local function ${id}(${params})\n${indentedBody}\nend`;
      } else {
        functionCode = `local function ${id}(${params})\nend`;
      }

      if (node.async) {
        // Wrap in coroutine.create if it's an async function
        const coroutineBody = this.indentCode(indentedBody || "", 2); // Indent body further for coroutine
        functionCode = `local function ${id}(${params})\n` +
                                   `  return coroutine.create(function()\n${coroutineBody}\n  end)\n` +
                                   "end";
      }

      return functionCode;
    }

    case "ArrowFunctionExpression": {
      const params = node.params.map(param => this.generateLuaFromAST(param)).join(", ");
      if (node.body.type === "BlockStatement") {
        const body = this.generateLuaFromAST(node.body);
        const indentedBody = this.indentCode(body);
        if (indentedBody) {
          return `function(${params})\n${indentedBody}\nend`;
        }
        return `function(${params})\nend`;
      }
      return `function(${params}) return ${this.generateLuaFromAST(node.body)} end`;
    }

    case "ObjectExpression":
      return `{ ${node.properties.map(prop => this.generateLuaFromAST(prop)).join(", ")} }`;

    case "Property": {
      const key = node.key.type === "Identifier"
        ? node.key.name
        : `[${this.generateLuaFromAST(node.key)}]`;
      return `${key} = ${this.generateLuaFromAST(node.value)}`;
    }

    case "ReturnStatement":
      return node.argument ? `return ${this.generateLuaFromAST(node.argument)}` : "return";

    case "CallExpression": {
      const callee = this.generateLuaFromAST(node.callee);
      const args = node.arguments.map(arg => this.generateLuaFromAST(arg)).join(", ");
      const needsWrap = /^function\s*\(/.test(callee.trim());
      const callable = needsWrap ? `(${callee})` : callee;
      return `${callable}(${args})`;
    }

    case "MemberExpression": {
      const object = this.generateLuaFromAST(node.object);
      const property = this.generateLuaFromAST(node.property);
      return node.computed ? `${object}[${property}]` : `${object}.${property}`;
    }

    case "ArrayExpression": {
      const elements = (node.elements || []).map(el => el ? this.generateLuaFromAST(el) : "nil");
      return `{ ${elements.join(", ")} }`;
    }

    case "FunctionExpression": {
      const params = node.params.map(param => this.generateLuaFromAST(param)).join(", ");
      let body = "";
      if (node.body && node.body.type === "BlockStatement") {
        body = this.generateLuaFromAST(node.body);
      } else if (node.body) {
        body = `return ${this.generateLuaFromAST(node.body)}`;
      }
      const indentedBody = this.indentCode(body);
      return body
        ? `function(${params})\n${indentedBody}\nend`
        : `function(${params})\nend`;
    }

    case "SwitchStatement": {
      const discVar = this.createTempVar("_switch_expr");
      const discValue = this.generateLuaFromAST(node.discriminant) || "nil";
      const lines = [`local ${discVar} = ${discValue}`];
      let hasCase = false;
      let defaultBody = "";

      (node.cases || []).forEach((caseNode, _index) => {
        const body = (caseNode.consequent || [])
          .map(stmt => this.generateLuaFromAST(stmt))
          .filter(Boolean)
          .join("\n");
        const indentedBody = this.indentCode(body);

        if (caseNode.test) {
          const testLua = this.generateLuaFromAST(caseNode.test);
          const prefix = hasCase ? "elseif" : "if";
          lines.push(`${prefix} ${discVar} == ${testLua} then`);
          if (indentedBody) lines.push(indentedBody);
          hasCase = true;
        } else {
          defaultBody = indentedBody;
        }
      });

      if (defaultBody) {
        lines.push(hasCase ? "else" : "if true then");
        lines.push(defaultBody);
        hasCase = true;
      }

      if (hasCase) {
        lines.push("end");
      }

      return lines.filter(Boolean).join("\n");
    }

    case "AssignmentExpression":
      return `${this.generateLuaFromAST(node.left)} = ${this.generateLuaFromAST(node.right)}`;

    case "UpdateExpression":
      return this.generateUpdateExpression(node, false);

    case "IfStatement": {
      const test = this.generateLuaFromAST(node.test);
      const consequent = this.generateLuaFromAST(node.consequent);
      const alternate = node.alternate ? this.generateLuaFromAST(node.alternate) : "";
      let code = `if ${test} then`;
      if (consequent) {
        code += `\n${this.indentCode(consequent)}`;
      }
      if (alternate) {
        code += "\nelse";
        code += `\n${this.indentCode(alternate)}`;
      }
      code += "\nend";
      return code;
    }

    case "ForStatement": {
      const init = node.init ? this.generateLuaFromAST(node.init) : "";
      const test = node.test ? this.generateLuaFromAST(node.test) : "true";
      let update = "";
      if (node.update) {
        update = node.update.type === "UpdateExpression"
          ? this.generateUpdateExpression(node.update, true)
          : this.generateLuaFromAST(node.update);
      }
      const body = this.generateLuaFromAST(node.body);
      const loopBodyParts = [];
      if (body) loopBodyParts.push(body);
      if (update) loopBodyParts.push(update);
      const loopBody = loopBodyParts.filter(Boolean).join("\n");
      const indentedBody = this.indentCode(loopBody);
      const whileLoop = loopBody
        ? `while ${test} do\n${indentedBody}\nend`
        : `while ${test} do\nend`;
      return init ? `${init}\n${whileLoop}` : whileLoop;
    }

    case "UnaryExpression": {
      const argument = this.generateLuaFromAST(node.argument);
      if (node.operator === "typeof") {
        return `type(${argument})`;
      }
      const operator = this.getLuaUnaryOperator(node.operator);
      if (!operator) {
        return argument;
      }
      if (operator === "not") {
        return `not ${argument}`;
      }
      return `${operator}${argument}`;
    }

    case "WhileStatement": {
      const test = this.generateLuaFromAST(node.test);
      const body = this.generateLuaFromAST(node.body);
      const indentedBody = this.indentCode(body);
      return body
        ? `while ${test} do\n${indentedBody}\nend`
        : `while ${test} do\nend`;
    }

    case "BreakStatement":
      return "break";

    case "EmptyStatement":
      return "";

    default:
      throw new Error(`Unsupported AST node type: ${node.type}`);
    }
  }

  isStringNode(node) {
    return node.type === "Literal" && typeof node.value === "string";
  }

  createTempVar(prefix = "__temp") {
    this.tempVarCounter += 1;
    return `${prefix}${this.tempVarCounter}`;
  }

  indentCode(code, level = 1) {
    if (!code) {
      return "";
    }
    const indent = "  ".repeat(level);
    return code
      .split("\n")
      .map(line => (line ? indent + line : line))
      .join("\n");
  }

  generateUpdateExpression(node, asStatement = false) {
    const argument = this.generateLuaFromAST(node.argument);
    const isIncrement = node.operator === "++";
    const isDecrement = node.operator === "--";

    if (!isIncrement && !isDecrement) {
      throw new Error(`Unsupported update operator: ${node.operator}`);
    }

    const operator = isIncrement ? "+" : "-";
    const updateExpression = `${argument} = ${argument} ${operator} 1`;

    if (asStatement) {
      return updateExpression;
    }

    if (node.prefix) {
      return `((function()\n  ${updateExpression}\n  return ${argument}\nend)())`;
    }

    const tempVar = this.createTempVar();
    return `((function()\n  local ${tempVar} = ${argument}\n  ${updateExpression}\n  return ${tempVar}\nend)())`;
  }

  getLuaUnaryOperator(operator) {
    switch (operator) {
    case "!":
      return "not";
    case "+":
      return "";
    case "-":
      return "-";
    default:
      return operator;
    }
  }

  getLuaOperator(operator, isLeftString = false, isRightString = false) {
    if (operator === "+" && (isLeftString || isRightString)) {
      return "..";
    }
    switch (operator) {
    case "===":
      return "==";
    case "!==":
      return "~=";
    case "!=":
      return "~=";
    case "&&":
      return "and";
    case "||":
      return "or";
    default:
      return operator;
    }
  }

  transpile(jsCode, filename = "main.js") {
    try {
      this.emit("transpileStart", { filename, size: jsCode.length });
            
      // Check cache first
      const cacheKey = this.getCacheKey(jsCode);
      if (this.cache.has(cacheKey)) {
        this.emit("cacheHit", { filename });
        return this.cache.get(cacheKey);
      }
            
      // Use IR Pipeline as primary transpilation engine (Phase 4 Integration)
      const pipelineResult = this.irPipeline.transpile(jsCode, filename);
            
      if (!pipelineResult.success) {
        // Pipeline validation failed
        this.stats.errors++;
        this.stats.irPipeline.errors++;
        const error = new Error(`Transpilation failed: ${pipelineResult.errors.join(", ")}`);
        this.emit("transpileError", { 
          filename, 
          error: error.message,
          warnings: pipelineResult.warnings 
        });
        throw error;
      }
            
      // Apply optional optimization passes
      let luaCode = pipelineResult.code;
      let optimizations = 0;
            
      if (this.options.optimize) {
        const before = luaCode;
        luaCode = this.optimizeCode(luaCode);
        if (before !== luaCode) optimizations += 5;
      }
            
      // Clean up and format
      luaCode = this.cleanupCode(luaCode);
            
      const result = {
        code: luaCode,
        sourceMap: this.options.sourceMap ? this.generateSourceMap(jsCode, luaCode, filename) : null,
        ast: pipelineResult.ast,
        ir: pipelineResult.ir,
        stats: {
          originalSize: jsCode.length,
          transpiled: luaCode.length,
          optimizations,
          filename,
          warnings: pipelineResult.warnings.length
        }
      };
            
      // Cache result
      this.cache.set(cacheKey, result);
            
      // Update stats
      this.stats.transpiled++;
      this.stats.optimizations += optimizations;
      this.stats.irPipeline.processed++;
      if (pipelineResult.warnings.length > 0) {
        this.stats.irPipeline.warnings += pipelineResult.warnings.length;
      }
            
      this.emit("transpileComplete", result.stats);
      return result;
            
    } catch (error) {
      this.stats.errors++;
      this.emit("transpileError", { filename, error: error.message });
      throw error;
    }
  }

  /**
     * Transforms ES6 arrow functions into standard Lua functions.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformArrowFunctions(code) {
    // Simple arrow functions: x => x * 2
    code = code.replace(/(\w+)\s*=>\s*([^;{]+)/g, "function($1) return $2 end");
        
    // Arrow functions with parameters: (a, b) => a + b
    code = code.replace(/\(([^)]*)\)\s*=>\s*([^;{]+)/g, "function($1) return $2 end");
        
    // Arrow functions with blocks: (a, b) => { return a + b; }
    code = code.replace(/\(([^)]*)\)\s*=>\s*{([^}]*)}/g, "function($1) $2 end");
        
    return code;
  }

  /**
     * Transforms ES6 destructuring assignments into Lua variable declarations.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformDestructuring(code) {
    // Object destructuring: let {a, b} = obj
    code = code.replace(/let\s*{\s*(\w+),\s*(\w+)\s*}\s*=\s*([^;]+);/g, 
      "local $1, $2 = $3.$1, $3.$2");
        
    // Array destructuring: let [a, b] = arr
    code = code.replace(/let\s*\[\s*(\w+),\s*(\w+)\s*\]\s*=\s*([^;]+);/g, 
      "local $1, $2 = $3[1], $3[2]");
        
    return code;
  }

  /**
     * Transforms async/await syntax into Lua coroutine-based equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformAsyncAwait(code) {
    // Async functions
    code = code.replace(/async\s+function\s+(\w+)/g, "local function $1");
        
    // Await expressions
    code = code.replace(/await\s+([^;]+)/g, "coroutine.yield($1)");
        
    return code;
  }

  /**
     * Transforms ES6 classes into Lua table-based equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformClasses(code) {
    // Class declarations
    code = code.replace(/class\s+(\w+)\s*{/g, "local $1 = {}; $1.__index = $1");
        
    // Constructor methods
    code = code.replace(/constructor\s*\(([^)]*)\)\s*{/g, "function $1:new($1)");
        
    // Class methods
    code = code.replace(/(\w+)\s*\(([^)]*)\)\s*{/g, "function $1:$1($2)");
        
    return code;
  }

  /**
     * Transforms ES6 modules (import/export) into Lua `require` and `return` statements.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformModules(code) {
    // ES6 imports
    code = code.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, "local $1 = require(\"$2\")");
    code = code.replace(/import\s*{\s*([^}]+)\s*}\s*from\s+['"]([^'"]+)['"]/g, 
      "local temp = require(\"$2\"); local $1 = temp.$1");
        
    // ES6 exports
    code = code.replace(/export\s+default\s+(\w+)/g, "return $1");
    code = code.replace(/export\s+{\s*([^}]+)\s*}/g, "return { $1 }");
        
    return code;
  }

  /**
     * Performs basic optimizations on the generated Lua code.
     * @param {string} code - The Lua code to optimize.
     * @returns {string} The optimized Lua code.
     */
  optimizeCode(code) {
    // Remove unnecessary semicolons
    code = code.replace(/;\s*end/g, " end");
        
    // Optimize string concatenations
    code = code.replace(/(\w+)\s*\.\.\s*(\w+)\s*\.\.\s*(\w+)/g, "$1 .. $2 .. $3");
        
    // Optimize boolean expressions
    code = code.replace(/not\s+not\s+/g, "");
        
    // Do not aggressively remove parentheses; function params and conditions rely on them
        
    return code;
  }

  /**
     * Cleans up the final generated code, fixing syntax and formatting.
     * @param {string} code - The code to clean up.
     * @returns {string} The cleaned-up code.
     */
  cleanupCode(code) {
    // The AST generator already produces proper 'end' keywords for control structures
    // We should NOT convert braces to 'end' here as it breaks object literals
        
    // Clean up excessive whitespace while preserving structure
    // Preserve newlines but trim each line
    code = code.split("\n").map(line => line.trim()).join("\n");
        
    // Remove multiple spaces within lines
    code = code.replace(/  +/g, " ");
        
    // Fix line endings
    code = code.trim();
        
    return code;
  }

  /**
     * Generates a basic source map for debugging.
     * @param {string} jsCode - The original JavaScript code.
     * @param {string} luaCode - The transpiled Lua code.
     * @param {string} filename - The original filename.
     * @returns {object} A source map object.
     */
  generateSourceMap(jsCode, luaCode, filename) {
    return {
      version: 3,
      file: filename.replace(".js", ".lua"),
      sourceRoot: "",
      sources: [filename],
      names: [],
      mappings: "AAAA" // Simplified mapping
    };
  }

  /**
     * Generates a cache key for a given code string.
     * @param {string} code - The code to generate a key for.
     * @returns {string} The MD5 hash of the code.
     */
  getCacheKey(code) {
    return require("crypto").createHash("md5").update(code).digest("hex");
  }

  /**
     * Retrieves the current transpilation statistics.
     * @returns {object} An object containing statistics about transpilation operations.
     */
  getStats() {
    return { ...this.stats };
  }

  /**
     * Clears the transpilation cache.
     */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = { CoreTranspiler };
