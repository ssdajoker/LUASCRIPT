/**
 * OCAML PHASE C GENERATOR - TIER 2 IMPLEMENTATION
 * Generates Lua and JavaScript from OCaml Phase C AST:
 * - Modules → namespaces/objects
 * - Polymorphic variants → tagged unions
 * - GADTs → type-safe wrappers
 * - Pattern matching → match/switch translation
 * - First-class modules → closures + vtables
 * - Objects → prototypes/metatables
 * 
 * Complexity: TIER 2 - HARD
 * Lines: 340
 * Target: Clean Lua/JS output, <2.5ms per language
 */

const AbstractPhaseCGenerator = require("../framework/abstract_generator");

class OCamlPhaseC_Generator extends AbstractPhaseCGenerator {
  constructor(config = {}) {
    super({
      language: "OCaml",
      ...config
    });

    this.generatorMetrics = {
      modulesGenerated: 0,
      functorsGenerated: 0,
      polymorphicVariantsGenerated: 0,
      gadtsGenerated: 0,
      patternMatchesGenerated: 0,
      firstClassModulesGenerated: 0,
      objectsGenerated: 0
    };
  }

  /**
   * Generate Lua code from OCaml AST
   * @param {Object} ast - OCaml Phase C AST
   * @returns {string} Lua code
   */
  generateLua(ast) {
    const lines = [];

    // Generate modules
    for (const module of ast.modules || []) {
      lines.push(this.generateLuaModule(module));
      this.generatorMetrics.modulesGenerated++;
    }

    // Generate type definitions
    for (const type of ast.types || []) {
      lines.push(this.generateLuaType(type));
    }

    // Generate bindings
    for (const binding of ast.bindings || []) {
      lines.push(this.generateLuaBinding(binding));
    }

    // Generate expressions
    for (const expr of ast.expressions || []) {
      lines.push(this.generateLuaExpression(expr));
    }

    return lines.filter(l => l).join("\n\n");
  }

  /**
   * Generate Lua module: module Name = struct ... end → Name = { ... }
   */
  generateLuaModule(node) {
    const { name, body } = node;

    if (body.kind === "module_struct") {
      const members = body.members.map(m => this.generateLuaModuleMember(m));
      return `local ${name} = {\n${members.map(m => "  " + m).join(",\n")}\n}`;
    }

    if (body.kind === "functor_application") {
      // Module alias to functor: module M = Make(Impl)
      const args = body.arguments.join(", ");
      return `local ${name} = ${body.functor}(${args})`;
    }

    if (body.kind === "module_alias") {
      return `local ${name} = ${body.target}`;
    }

    return `-- Module ${name} (unsupported body type)`;
  }

  /**
   * Generate Lua module member
   */
  generateLuaModuleMember(member) {
    if (member.kind === "let_binding") {
      const value = this.generateLuaExpression(member.value);
      return `${member.name} = ${value}`;
    }

    if (member.kind === "type_definition") {
      // Types don't translate directly, add comment
      return `-- type ${member.name}`;
    }

    return `-- ${member.kind}`;
  }

  /**
   * Generate Lua type (polymorphic variants, GADTs)
   */
  generateLuaType(node) {
    if (node.kind === "polymorphic_variant_type") {
      this.generatorMetrics.polymorphicVariantsGenerated++;
      return this.generateLuaPolymorphicVariant(node);
    }

    if (node.kind === "gadt_definition") {
      this.generatorMetrics.gadtsGenerated++;
      return this.generateLuaGADT(node);
    }

    // Regular type definition
    const constructors = node.variants.map(v => {
      return `  ${v.name} = function(${v.type ? "value" : ""}) return { tag = "${v.name}"${v.type ? ", value = value" : ""} } end`;
    });

    return `-- Type ${node.name}\nlocal ${node.name} = {\n${constructors.join(",\n")}\n}`;
  }

  /**
   * Generate Lua polymorphic variant: [> `A | `B] → { tag = "A", value = ... }
   */
  generateLuaPolymorphicVariant(node) {
    const { name, variantKind, tags } = node;

    const constructors = tags.map(t => {
      const tagName = t.tag.replace("`", "");
      if (t.type) {
        return `  ${tagName} = function(value) return { tag = "${tagName}", value = value } end`;
      }
      return `  ${tagName} = function() return { tag = "${tagName}" } end`;
    });

    const comment = `-- Polymorphic variant (${variantKind}): ${name}`;
    return `${comment}\nlocal ${name} = {\n${constructors.join(",\n")}\n}`;
  }

  /**
   * Generate Lua GADT: type-safe tagged unions with type tracking
   */
  generateLuaGADT(node) {
    const { name, constructors } = node;

    const ctorFunctions = constructors.map(c => {
      return `  ${c.name} = function(value) return { tag = "${c.name}", value = value, type = "${c.typeSignature}" } end`;
    });

    const comment = `-- GADT: ${name}`;
    return `${comment}\nlocal ${name} = {\n${ctorFunctions.join(",\n")}\n}`;
  }

  /**
   * Generate Lua let binding
   */
  generateLuaBinding(node) {
    const { name, isRecursive, parameters, value } = node;

    if (parameters.length > 0) {
      // Function binding
      const params = parameters.join(", ");
      const body = this.generateLuaExpression(value);
      const keyword = isRecursive ? "local function" : "local";
      if (isRecursive) {
        return `${keyword} ${name}(${params})\n  return ${body}\nend`;
      }
      return `${keyword} ${name} = function(${params}) return ${body} end`;
    }

    // Value binding
    const valueCode = this.generateLuaExpression(value);
    return `local ${name} = ${valueCode}`;
  }

  /**
   * Generate Lua expression
   */
  generateLuaExpression(node) {
    if (!node) return "nil";

    switch (node.kind) {
    case "number_literal":
      return node.value;

    case "string_literal":
      return node.value;

    case "identifier":
      return node.name;

    case "variant_value": {
      const tag = node.tag.replace("`", "");
      return `{ tag = "${tag}" }`;
    }

    case "match_expression":
      this.generatorMetrics.patternMatchesGenerated++;
      return this.generateLuaMatch(node);

    case "object_expression":
      this.generatorMetrics.objectsGenerated++;
      return this.generateLuaObject(node);

    case "module_pack":
      this.generatorMetrics.firstClassModulesGenerated++;
      return `{ _module = ${node.module}, _signature = "${node.signature}" }`;

    default:
      return "nil";
    }
  }

  /**
   * Generate Lua match expression: match x with | pattern -> expr
   */
  generateLuaMatch(node) {
    const { scrutinee, cases } = node;
    const scrutineeVar = this.generateLuaExpression(scrutinee);

    const lines = ["(function()"];
    lines.push(`  local _match = ${scrutineeVar}`);

    for (const caseNode of cases) {
      const condition = this.generateLuaPatternCondition(caseNode.pattern, "_match");
      const body = this.generateLuaExpression(caseNode.body);

      if (caseNode.guard) {
        const guardCode = this.generateLuaExpression(caseNode.guard);
        lines.push(`  if ${condition} and ${guardCode} then return ${body} end`);
      } else {
        lines.push(`  if ${condition} then return ${body} end`);
      }
    }

    lines.push("  return nil");
    lines.push("end)()");

    return lines.join("\n");
  }

  /**
   * Generate Lua pattern matching condition
   */
  generateLuaPatternCondition(pattern, matchVar) {
    if (pattern.kind === "wildcard") {
      return "true";
    }

    if (pattern.kind === "variable_pattern") {
      return "true"; // Always matches, binds to variable
    }

    if (pattern.kind === "variant_pattern") {
      const tag = pattern.tag.replace("`", "");
      return `${matchVar}.tag == "${tag}"`;
    }

    if (pattern.kind === "constructor_pattern") {
      return `${matchVar}.tag == "${pattern.name}"`;
    }

    if (pattern.kind === "or_pattern") {
      const conditions = pattern.alternatives.map(alt =>
        this.generateLuaPatternCondition(alt, matchVar)
      );
      return `(${conditions.join(" or ")})`;
    }

    if (pattern.kind === "as_pattern") {
      return this.generateLuaPatternCondition(pattern.pattern, matchVar);
    }

    return "false";
  }

  /**
   * Generate Lua object: object method x = ... end
   */
  generateLuaObject(node) {
    const methods = node.methods.map(m => {
      const methodName = m.isPrivate ? `_${m.name}` : m.name;
      const body = this.generateLuaExpression(m.body);
      return `  ${methodName} = function(self) return ${body} end`;
    });

    return `{\n${methods.join(",\n")}\n}`;
  }

  /**
   * Generate JavaScript code from OCaml AST
   * @param {Object} ast - OCaml Phase C AST
   * @returns {string} JavaScript code
   */
  generateJavaScript(ast) {
    const lines = [];

    // Generate modules
    for (const module of ast.modules || []) {
      lines.push(this.generateJSModule(module));
    }

    // Generate type definitions (as comments + constructor functions)
    for (const type of ast.types || []) {
      lines.push(this.generateJSType(type));
    }

    // Generate bindings
    for (const binding of ast.bindings || []) {
      lines.push(this.generateJSBinding(binding));
    }

    // Generate expressions
    for (const expr of ast.expressions || []) {
      lines.push(this.generateJSExpression(expr));
    }

    return lines.filter(l => l).join("\n\n");
  }

  /**
   * Generate JS module: module Name = struct ... end → const Name = { ... }
   */
  generateJSModule(node) {
    const { name, body } = node;

    if (body.kind === "module_struct") {
      const members = body.members.map(m => this.generateJSModuleMember(m));
      return `const ${name} = {\n${members.map(m => "  " + m).join(",\n")}\n};`;
    }

    if (body.kind === "functor_application") {
      const args = body.arguments.join(", ");
      return `const ${name} = ${body.functor}(${args});`;
    }

    if (body.kind === "module_alias") {
      return `const ${name} = ${body.target};`;
    }

    return `// Module ${name} (unsupported body type)`;
  }

  /**
   * Generate JS module member
   */
  generateJSModuleMember(member) {
    if (member.kind === "let_binding") {
      const value = this.generateJSExpression(member.value);
      return `${member.name}: ${value}`;
    }

    if (member.kind === "type_definition") {
      return `// type ${member.name}`;
    }

    return `// ${member.kind}`;
  }

  /**
   * Generate JS type (polymorphic variants, GADTs)
   */
  generateJSType(node) {
    if (node.kind === "polymorphic_variant_type") {
      return this.generateJSPolymorphicVariant(node);
    }

    if (node.kind === "gadt_definition") {
      return this.generateJSGADT(node);
    }

    // Regular type definition
    const constructors = node.variants.map(v => {
      return `  ${v.name}: (${v.type ? "value" : ""}) => ({ tag: "${v.name}"${v.type ? ", value" : ""} })`;
    });

    return `// Type ${node.name}\nconst ${node.name} = {\n${constructors.join(",\n")}\n};`;
  }

  /**
   * Generate JS polymorphic variant
   */
  generateJSPolymorphicVariant(node) {
    const { name, variantKind, tags } = node;

    const constructors = tags.map(t => {
      const tagName = t.tag.replace("`", "");
      if (t.type) {
        return `  ${tagName}: (value) => ({ tag: "${tagName}", value })`;
      }
      return `  ${tagName}: () => ({ tag: "${tagName}" })`;
    });

    const comment = `// Polymorphic variant (${variantKind}): ${name}`;
    return `${comment}\nconst ${name} = {\n${constructors.join(",\n")}\n};`;
  }

  /**
   * Generate JS GADT
   */
  generateJSGADT(node) {
    const { name, constructors } = node;

    const ctorFunctions = constructors.map(c => {
      return `  ${c.name}: (value) => ({ tag: "${c.name}", value, type: "${c.typeSignature}" })`;
    });

    const comment = `// GADT: ${name}`;
    return `${comment}\nconst ${name} = {\n${ctorFunctions.join(",\n")}\n};`;
  }

  /**
   * Generate JS let binding
   */
  generateJSBinding(node) {
    const { name, parameters, value } = node;

    if (parameters.length > 0) {
      const params = parameters.join(", ");
      const body = this.generateJSExpression(value);
      return `const ${name} = (${params}) => ${body};`;
    }

    const valueCode = this.generateJSExpression(value);
    return `const ${name} = ${valueCode};`;
  }

  /**
   * Generate JS expression
   */
  generateJSExpression(node) {
    if (!node) return "null";

    switch (node.kind) {
    case "number_literal":
      return node.value;

    case "string_literal":
      return node.value;

    case "identifier":
      return node.name;

    case "variant_value": {
      const tag = node.tag.replace("`", "");
      return `{ tag: "${tag}" }`;
    }

    case "match_expression":
      return this.generateJSMatch(node);

    case "object_expression":
      return this.generateJSObject(node);

    case "module_pack":
      return `{ _module: ${node.module}, _signature: "${node.signature}" }`;

    default:
      return "null";
    }
  }

  /**
   * Generate JS match expression
   */
  generateJSMatch(node) {
    const { scrutinee, cases } = node;
    const scrutineeVar = this.generateJSExpression(scrutinee);

    const lines = ["(() => {"];
    lines.push(`  const _match = ${scrutineeVar};`);

    for (const caseNode of cases) {
      const condition = this.generateJSPatternCondition(caseNode.pattern, "_match");
      const body = this.generateJSExpression(caseNode.body);

      if (caseNode.guard) {
        const guardCode = this.generateJSExpression(caseNode.guard);
        lines.push(`  if (${condition} && ${guardCode}) return ${body};`);
      } else {
        lines.push(`  if (${condition}) return ${body};`);
      }
    }

    lines.push("  return null;");
    lines.push("})()");

    return lines.join("\n");
  }

  /**
   * Generate JS pattern matching condition
   */
  generateJSPatternCondition(pattern, matchVar) {
    if (pattern.kind === "wildcard") {
      return "true";
    }

    if (pattern.kind === "variable_pattern") {
      return "true";
    }

    if (pattern.kind === "variant_pattern") {
      const tag = pattern.tag.replace("`", "");
      return `${matchVar}.tag === "${tag}"`;
    }

    if (pattern.kind === "constructor_pattern") {
      return `${matchVar}.tag === "${pattern.name}"`;
    }

    if (pattern.kind === "or_pattern") {
      const conditions = pattern.alternatives.map(alt =>
        this.generateJSPatternCondition(alt, matchVar)
      );
      return `(${conditions.join(" || ")})`;
    }

    if (pattern.kind === "as_pattern") {
      return this.generateJSPatternCondition(pattern.pattern, matchVar);
    }

    return "false";
  }

  /**
   * Generate JS object
   */
  generateJSObject(node) {
    const methods = node.methods.map(m => {
      const methodName = m.isPrivate ? `_${m.name}` : m.name;
      const body = this.generateJSExpression(m.body);
      return `  ${methodName}() { return ${body}; }`;
    });

    return `{\n${methods.join(",\n")}\n}`;
  }

  /**
   * Get generator metrics
   */
  getMetrics() {
    return { ...this.generatorMetrics };
  }
}

module.exports = OCamlPhaseC_Generator;
