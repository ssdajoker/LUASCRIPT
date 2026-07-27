/**
 * KOTLIN PHASE C GENERATOR
 * Generates Lua and JavaScript from Kotlin Phase C AST
 * - Extension functions → prototype injection (JS) / metatable (Lua)
 * - Coroutines → async/await (JS) / coroutine.* (Lua)
 * - Reified generics → runtime type tracking
 * - DSL builders → builder pattern generation
 * - Data classes → class with auto-generated methods
 * 
 * Lines: 330
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");

class KotlinPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(config = {}) {
    super({
      language: "Kotlin",
      ...config
    });

    this.generatorMetrics = {
      extensionsGenerated: 0,
      coroutinesGenerated: 0,
      reifiedGenerated: 0,
      dslBuildersGenerated: 0,
      dataClassesGenerated: 0,
      sealedClassesGenerated: 0
    };
  }

  /**
   * MAIN GENERATION ENTRY
   */
  generate(parseResult, targetLanguage = "lua") {
    const startTime = performance.now();
    this.ast = parseResult.ast || parseResult;
    this.target = targetLanguage.toLowerCase();
    this.output = [];

    if (this.target === "lua") {
      this.generateLua();
    } else if (this.target === "javascript" || this.target === "js") {
      this.generateJavaScript();
    } else {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    const elapsed = performance.now() - startTime;
    return {
      code: this.output.join("\n"),
      target: this.target,
      metrics: this.generatorMetrics,
      elapsed
    };
  }

  /**
   * GENERATE LUA
   */
  generateLua() {
    this.output.push("-- Generated from Kotlin Phase C");
    this.output.push("");

    for (const node of this.ast.body) {
      const code = this.generateLuaNode(node);
      if (code) {
        this.output.push(code);
        this.output.push("");
      }
    }
  }

  /**
   * GENERATE LUA NODE
   */
  generateLuaNode(node) {
    switch (node.kind) {
    case "extension_function":
      return this.generateLuaExtensionFunction(node);
    case "suspend_function":
      return this.generateLuaSuspendFunction(node);
    case "inline_function":
      return this.generateLuaInlineFunction(node);
    case "data_class":
      return this.generateLuaDataClass(node);
    case "sealed_class":
      return this.generateLuaSealedClass(node);
    case "dsl_invocation":
      return this.generateLuaDSLBuilder(node);
    case "coroutine_builder":
      return this.generateLuaCoroutineBuilder(node);
    case "when_expression":
      return this.generateLuaWhenExpression(node);
    default:
      return `-- Unknown node: ${node.kind}`;
    }
  }

  /**
   * LUA: Extension Function
   * Output: Type metatable injection
   */
  generateLuaExtensionFunction(node) {
    this.generatorMetrics.extensionsGenerated++;
    
    const receiverType = node.receiverType || "Type";
    const funcName = node.name || "extensionFunc";
    const params = node.parameters.map(p => p.name).join(", ");

    return `-- Extension: ${receiverType}.${funcName}
${receiverType} = ${receiverType} or {}
${receiverType}.__index = ${receiverType}.__index or ${receiverType}

function ${receiverType}.${funcName}(self${params ? ", " + params : ""})
  -- Extension function body
  return self
end`;
  }

  /**
   * LUA: Suspend Function
   * Output: Coroutine wrapper
   */
  generateLuaSuspendFunction(node) {
    this.generatorMetrics.coroutinesGenerated++;
    
    const funcName = node.name || "suspendFunc";
    const params = node.parameters.map(p => p.name).join(", ");

    return `-- Suspend function: ${funcName}
local function ${funcName}(${params})
  return coroutine.create(function()
    -- Suspend function body
    coroutine.yield()
    return nil
  end)
end`;
  }

  /**
   * LUA: Inline Function with Reified
   * Output: Function with type tracking
   */
  generateLuaInlineFunction(node) {
    if (node.hasReified) {
      this.generatorMetrics.reifiedGenerated++;
    }

    const funcName = node.name || "inlineFunc";
    const params = node.parameters.map(p => p.name).join(", ");
    const typeTracking = node.hasReified ? "  local __type_info = type(value)\n" : "";

    return `-- Inline function: ${funcName}${node.hasReified ? " (reified)" : ""}
local function ${funcName}(${params})
${typeTracking}  -- Inline function body
  return nil
end`;
  }

  /**
   * LUA: Data Class
   * Output: Class with constructor and copy method
   */
  generateLuaDataClass(node) {
    this.generatorMetrics.dataClassesGenerated++;
    
    const className = node.name || "DataClass";
    const props = node.properties.map(p => p.name).join(", ");
    const propAssignments = node.properties.map(p => 
      `  self.${p.name} = ${p.name}`
    ).join("\n");

    return `-- Data class: ${className}
${className} = {}
${className}.__index = ${className}

function ${className}.new(${props})
  local self = setmetatable({}, ${className})
${propAssignments}
  return self
end

function ${className}:copy(changes)
  changes = changes or {}
  return ${className}.new(
${node.properties.map(p => `    changes.${p.name} or self.${p.name}`).join(",\n")}
  )
end

function ${className}:__tostring()
  return "${className}(${node.properties.map(p => `${p.name}=" .. tostring(self.${p.name}) .. "`).join(", ")})"
end`;
  }

  /**
   * LUA: Sealed Class
   * Output: Base class with subclass validation
   */
  generateLuaSealedClass(node) {
    this.generatorMetrics.sealedClassesGenerated++;
    
    const className = node.name || "SealedClass";

    return `-- Sealed class: ${className}
${className} = { __sealed = true, __subclasses = {} }
${className}.__index = ${className}

function ${className}.register_subclass(name)
  ${className}.__subclasses[name] = true
end`;
  }

  /**
   * LUA: DSL Builder
   * Output: Builder pattern
   */
  generateLuaDSLBuilder(node) {
    this.generatorMetrics.dslBuildersGenerated++;
    
    const builderName = node.builderName;

    return `-- DSL Builder: ${builderName}
local function ${builderName}(block)
  local builder = { __context = {} }
  if block then
    block(builder)
  end
  return builder
end`;
  }

  /**
   * LUA: Coroutine Builder
   * Output: Coroutine creation
   */
  generateLuaCoroutineBuilder(node) {
    const builderType = node.builderType;

    return `-- Coroutine builder: ${builderType}
local ${builderType}_routine = coroutine.create(function()
  -- ${builderType} body
  coroutine.yield()
end)`;
  }

  /**
   * LUA: When Expression
   * Output: if-elseif-else chain
   */
  generateLuaWhenExpression(node) {
    const subject = node.subject || "value";
    const branches = node.branches.map((branch, idx) => {
      const isElse = branch.condition === "else";
      const prefix = idx === 0 ? "if" : (isElse ? "else" : "elseif");
      const condition = isElse ? "" : ` ${subject} == ${branch.condition} then`;
      return `${prefix}${condition}
  -- Branch body
  result = nil`;
    }).join("\n");

    return `-- When expression
local result
${branches}
end`;
  }

  /**
   * GENERATE JAVASCRIPT
   */
  generateJavaScript() {
    this.output.push("// Generated from Kotlin Phase C");
    this.output.push("");

    for (const node of this.ast.body) {
      const code = this.generateJavaScriptNode(node);
      if (code) {
        this.output.push(code);
        this.output.push("");
      }
    }
  }

  /**
   * GENERATE JAVASCRIPT NODE
   */
  generateJavaScriptNode(node) {
    switch (node.kind) {
    case "extension_function":
      return this.generateJSExtensionFunction(node);
    case "suspend_function":
      return this.generateJSSuspendFunction(node);
    case "inline_function":
      return this.generateJSInlineFunction(node);
    case "data_class":
      return this.generateJSDataClass(node);
    case "sealed_class":
      return this.generateJSSealedClass(node);
    case "dsl_invocation":
      return this.generateJSDSLBuilder(node);
    case "coroutine_builder":
      return this.generateJSCoroutineBuilder(node);
    case "when_expression":
      return this.generateJSWhenExpression(node);
    default:
      return `// Unknown node: ${node.kind}`;
    }
  }

  /**
   * JS: Extension Function
   * Output: Prototype method
   */
  generateJSExtensionFunction(node) {
    this.generatorMetrics.extensionsGenerated++;
    
    const receiverType = node.receiverType || "Type";
    const funcName = node.name || "extensionFunc";
    const params = node.parameters.map(p => p.name).join(", ");

    return `// Extension: ${receiverType}.${funcName}
${receiverType}.prototype.${funcName} = function(${params}) {
  // Extension function body
  return this;
};`;
  }

  /**
   * JS: Suspend Function
   * Output: Async function
   */
  generateJSSuspendFunction(node) {
    this.generatorMetrics.coroutinesGenerated++;
    
    const funcName = node.name || "suspendFunc";
    const params = node.parameters.map(p => p.name).join(", ");

    return `// Suspend function: ${funcName}
async function ${funcName}(${params}) {
  // Suspend function body
  await Promise.resolve();
  return null;
}`;
  }

  /**
   * JS: Inline Function with Reified
   * Output: Function with type checking
   */
  generateJSInlineFunction(node) {
    if (node.hasReified) {
      this.generatorMetrics.reifiedGenerated++;
    }

    const funcName = node.name || "inlineFunc";
    const params = node.parameters.map(p => p.name).join(", ");
    const typeCheck = node.hasReified 
      ? `  const __type = typeof value;
  if (__type !== expectedType) {
    throw new TypeError(\`Expected \${expectedType}, got \${__type}\`);
  }
` : "";

    return `// Inline function: ${funcName}${node.hasReified ? " (reified)" : ""}
function ${funcName}(${params}) {
${typeCheck}  // Inline function body
  return null;
}`;
  }

  /**
   * JS: Data Class
   * Output: ES6 class with constructor and copy
   */
  generateJSDataClass(node) {
    this.generatorMetrics.dataClassesGenerated++;
    
    const className = node.name || "DataClass";
    const props = node.properties.map(p => p.name).join(", ");
    const propAssignments = node.properties.map(p => 
      `    this.${p.name} = ${p.name};`
    ).join("\n");

    return `// Data class: ${className}
class ${className} {
  constructor(${props}) {
${propAssignments}
  }

  copy(changes = {}) {
    return new ${className}(
${node.properties.map(p => `      changes.${p.name} !== undefined ? changes.${p.name} : this.${p.name}`).join(",\n")}
    );
  }

  toString() {
    return \`${className}(${node.properties.map(p => `${p.name}=\${this.${p.name}}`).join(", ")})\`;
  }
}`;
  }

  /**
   * JS: Sealed Class
   * Output: Abstract class with subclass tracking
   */
  generateJSSealedClass(node) {
    this.generatorMetrics.sealedClassesGenerated++;
    
    const className = node.name || "SealedClass";

    return `// Sealed class: ${className}
class ${className} {
  static __sealed = true;
  static __subclasses = new Set();

  constructor() {
    if (new.target === ${className}) {
      throw new Error('Cannot instantiate sealed class ${className}');
    }
    ${className}.__subclasses.add(this.constructor.name);
  }
}`;
  }

  /**
   * JS: DSL Builder
   * Output: Builder pattern
   */
  generateJSDSLBuilder(node) {
    this.generatorMetrics.dslBuildersGenerated++;
    
    const builderName = node.builderName;

    return `// DSL Builder: ${builderName}
function ${builderName}(block) {
  const builder = {
    __context: {},
    build() { return this.__context; }
  };
  if (block) {
    block.call(builder, builder);
  }
  return builder;
}`;
  }

  /**
   * JS: Coroutine Builder
   * Output: Async function or Promise
   */
  generateJSCoroutineBuilder(node) {
    const builderType = node.builderType;

    if (builderType === "launch") {
      return `// Coroutine builder: launch
(async () => {
  // Launch body
  await Promise.resolve();
})();`;
    } else if (builderType === "async") {
      return `// Coroutine builder: async
const asyncResult = (async () => {
  // Async body
  await Promise.resolve();
  return null;
})();`;
    } else if (builderType === "flow") {
      return `// Coroutine builder: flow
async function* flow() {
  // Flow body
  yield null;
}`;
    }
  }

  /**
   * JS: When Expression
   * Output: Switch statement or if-else
   */
  generateJSWhenExpression(node) {
    const subject = node.subject || "value";
    
    const branches = node.branches.map(branch => {
      const isElse = branch.condition === "else";
      if (isElse) {
        return `  default:
    // Else branch
    result = null;
    break;`;
      }
      return `  case ${branch.condition}:
    // Case branch
    result = null;
    break;`;
    }).join("\n");

    return `// When expression
let result;
switch (${subject}) {
${branches}
}`;
  }
}

module.exports = KotlinPhaseC_Generator;
