/**
 * IR to LUASCRIPT .ls Generator
 *
 * Emits the currently supported JS-like LUASCRIPT syntax from canonical IR.
 */

const { IRToJSGenerator } = require("./ir-to-js");
const { NodeCategory } = require("../ir/nodes");

class IRToLSGenerator extends IRToJSGenerator {
  constructor(options = {}) {
    super({
      semicolons: options.semicolons !== false,
      indent: options.indent || "  ",
      ...options
    });
    this.usedHelpers = new Set();
  }

  generate(node) {
    this.usedHelpers = new Set();
    const code = this.visit(node);
    const helpers = this.emitHelpers();
    const body = helpers ? `${helpers}\n${code}` : code;
    const profile = this.emitMetaProfiles(node && node.metadata ? node.metadata.luascriptMeta : null);
    const meta = this.emitMetaBlock(node && node.metadata ? node.metadata.luascriptMeta : null);
    const repair = this.emitRepairBlock(node && node.metadata ? node.metadata.luascriptMeta : null);
    const verify = this.emitVerifyBlock(node && node.metadata ? node.metadata.luascriptVerify : null);
    const compileTime = [profile, meta, repair, verify].filter(Boolean).join("\n\n");
    return compileTime ? `${compileTime}\n\n${body}` : body;
  }

  emitMetaProfiles(policy) {
    if (!policy || !Array.isArray(policy.profiles) || policy.profiles.length === 0) {
      return "";
    }

    return policy.profiles.map(profileName => `meta profile ${profileName};`).join("\n");
  }

  emitMetaBlock(policy) {
    const declaredTargets = policy && policy.declaredTargets ? policy.declaredTargets : (policy ? policy.targets : null);
    if (!declaredTargets) {
      return "";
    }

    const entries = Object.entries(declaredTargets).filter(([, targetPolicy]) => {
      return (
        (targetPolicy.requires || []).length > 0 ||
        (targetPolicy.forbid || []).length > 0 ||
        Object.keys(targetPolicy.resolve || {}).length > 0 ||
        Object.keys(targetPolicy.adapters || {}).length > 0 ||
        Object.keys(targetPolicy.diagnostics || {}).length > 0
      );
    });
    if (entries.length === 0) {
      return "";
    }

    const lines = ["meta {"];
    for (const [target, targetPolicy] of entries) {
      lines.push(`  target ${target} {`);
      for (const capability of targetPolicy.requires || []) {
        lines.push(`    requires ${capability};`);
      }
      for (const capability of targetPolicy.forbid || []) {
        lines.push(`    forbid ${capability};`);
      }
      for (const [capability, strategy] of Object.entries(targetPolicy.resolve || {})) {
        lines.push(`    resolve ${capability} using ${strategy};`);
      }
      for (const [feature, strategy] of Object.entries(targetPolicy.adapters || {})) {
        lines.push(`    adapt ${feature} using ${strategy};`);
      }
      for (const [feature, message] of Object.entries(targetPolicy.diagnostics || {})) {
        lines.push(`    diagnose ${feature} as unsupported ${JSON.stringify(message)};`);
      }
      lines.push("  }");
    }
    lines.push("}");
    return lines.join("\n");
  }

  emitRepairBlock(policy) {
    const declaredTargets = policy && policy.declaredTargets ? policy.declaredTargets : (policy ? policy.targets : null);
    if (!declaredTargets) {
      return "";
    }

    const targetRepairs = Object.entries(declaredTargets)
      .map(([target, targetPolicy]) => [target, Object.entries(targetPolicy.repairs || {})])
      .filter(([, repairs]) => repairs.length > 0);
    if (targetRepairs.length === 0) {
      return "";
    }

    const lines = ["repair {"];
    for (const [target, repairs] of targetRepairs) {
      lines.push(`  target ${target} {`);
      for (const [feature, strategy] of repairs) {
        lines.push(`    lower ${feature} using ${strategy};`);
      }
      lines.push("  }");
    }
    lines.push("}");
    return lines.join("\n");
  }

  emitVerifyBlock(verification) {
    if (!verification || Object.keys(verification).length === 0) {
      return "";
    }

    const aliases = {
      javascript_stdout: "js_stdout",
      javascript_runtime_error: "js_runtime_error",
      javascript_contains: "js_contains",
      javascript_not_contains: "js_not_contains",
      javascript_policy: "js_policy",
      javascript_not_policy: "js_not_policy",
      javascript_repair: "js_repair",
      luascript_stdout: "ls_stdout",
      luascript_runtime_error: "ls_runtime_error",
      luascript_contains: "ls_contains",
      luascript_not_contains: "ls_not_contains",
      luascript_policy: "ls_policy",
      luascript_not_policy: "ls_not_policy",
      luascript_repair: "ls_repair"
    };
    const orderedKeys = [
      "stdout",
      "diagnostic",
      "feature",
      "no_feature",
      "profile",
      "no_profile",
      "implicit_profile",
      "no_implicit_profile",
      "lua_stdout",
      "lua_runtime_error",
      "lua_contains",
      "lua_not_contains",
      "lua_policy",
      "lua_not_policy",
      "lua_repair",
      "javascript_stdout",
      "javascript_runtime_error",
      "javascript_contains",
      "javascript_not_contains",
      "javascript_policy",
      "javascript_not_policy",
      "javascript_repair",
      "python_stdout",
      "python_runtime_error",
      "python_contains",
      "python_not_contains",
      "python_policy",
      "python_not_policy",
      "python_repair",
      "luascript_stdout",
      "luascript_runtime_error",
      "luascript_contains",
      "luascript_not_contains",
      "luascript_policy",
      "luascript_not_policy",
      "luascript_repair"
    ];

    const lines = ["verify {"];
    for (const key of orderedKeys) {
      if (!Object.prototype.hasOwnProperty.call(verification, key)) {
        continue;
      }
      const directive = aliases[key] || key;
      const values = Array.isArray(verification[key])
        ? verification[key]
        : [verification[key]];
      for (const value of values) {
        lines.push(`  ${directive} ${JSON.stringify(value)};`);
      }
    }
    lines.push("}");
    return lines.length > 2 ? lines.join("\n") : "";
  }

  visitCall(node) {
    if (node.metadata && node.metadata.luascriptBuiltin === "many") {
      return `many(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && (node.metadata.csharpBuiltin === "len" || node.metadata.cLikeBuiltin === "len")) {
      this.usedHelpers.add("__cs_len");
      return `__cs_len(${this.visit(node.args[0])})`;
    }

    if (node.metadata && (node.metadata.csharpBuiltin === "index" || node.metadata.cLikeBuiltin === "index")) {
      this.usedHelpers.add("__cs_index");
      return `__cs_index(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "len") {
      this.usedHelpers.add("__py_len");
      return `__py_len(${this.visit(node.args[0])})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "string_upper") {
      this.usedHelpers.add("__py_string_upper");
      return `__py_string_upper(${this.visit(node.args[0])})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "string_lower") {
      this.usedHelpers.add("__py_string_lower");
      return `__py_string_lower(${this.visit(node.args[0])})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "index") {
      this.usedHelpers.add("__py_index");
      return `__py_index(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "slice") {
      this.usedHelpers.add("__py_slice");
      return `__py_slice(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "append") {
      this.usedHelpers.add("__py_append");
      return `__py_append(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "pop") {
      this.usedHelpers.add("__py_pop");
      return `__py_pop(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "in_value") {
      this.usedHelpers.add("__py_in_value");
      return `__py_in_value(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "in_key") {
      this.usedHelpers.add("__py_in_key");
      return `__py_in_key(${node.args.map(arg => this.visit(arg)).join(", ")})`;
    }

    if (node.metadata && node.metadata.luaBuiltin === "len") {
      this.usedHelpers.add("__lua_len");
      return `__lua_len(${this.visit(node.args[0])})`;
    }

    return super.visitCall(node);
  }

  visitIf(node) {
    const condition = this.visit(node.condition);
    const consequent = this.visit(node.consequent);

    let result = `${this.indent()}if (${condition}) ${consequent}`;
    if (node.alternate) {
      if (node.alternate.kind === "IfStatement") {
        this.indentLevel++;
        const alternate = this.visit(node.alternate);
        this.indentLevel--;
        result += ` else {\n${alternate}\n${this.indent()}}`;
      } else {
        result += ` else ${this.visit(node.alternate)}`;
      }
    }

    return result;
  }

  visitBinaryOp(node) {
    const operator = node.operator === "concat" ? "+" : node.operator;
    return `${this.visit(node.left)} ${operator} ${this.visit(node.right)}`;
  }

  visitUnaryOp(node) {
    const operand = this.visit(node.operand);
    if (node.operator === "!") {
      return `${operand} == false`;
    }
    if (node.operator === "-") {
      return `-${operand}`;
    }
    return super.visitUnaryOp(node);
  }

  visitAssignment(node) {
    const left = this.visitAssignmentTarget(node.left);
    const right = this.visit(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  visitAssignmentTarget(node) {
    if (node && node.kind === NodeCategory.MEMBER && node.computed) {
      const object = this.visit(node.object);
      const property = this.visitMemberProperty(node.property, node);
      if (node.metadata && node.metadata.zeroBasedIndex) {
        return `${object}[${property}]`;
      }
      return `${object}[${property}]`;
    }
    return this.visit(node);
  }

  visitObjectLiteral(node) {
    if (node.properties.length === 0) {
      return "{}";
    }

    const properties = node.properties.map(prop => {
      const key = this.visit(prop.key);
      const value = this.visit(prop.value);
      return `${key}: ${value}`;
    }).join(", ");
    return `{ ${properties} }`;
  }

  visitMember(node) {
    const object = node.object && node.object.kind === NodeCategory.IDENTIFIER && node.object.name === "math"
      ? "Math"
      : this.visit(node.object);
    const property = this.visitMemberProperty(node.property, node);

    if (node.computed) {
      if (node.metadata && node.metadata.zeroBasedIndex) {
        if (["csharp", "c", "cpp", "java", "php", "ruby", "dart"].includes(node.metadata.sourceLanguage)) {
          this.usedHelpers.add("__cs_index");
          return `__cs_index(${object}, ${property})`;
        }
        return `${object}[${property}]`;
      }
      return `${object}[${property}]`;
    }

    return `${object}.${property}`;
  }

  emitHelpers() {
    const helpers = [];
    if (this.usedHelpers.has("__cs_len")) {
      helpers.push([
        "function __cs_len(value) {",
        "  if (type(value) == \"string\") {",
        "    return string[\"len\"](value);",
        "  }",
        "  let count = 0;",
        "  for (let __cs_item of value) {",
        "    count = count + 1;",
        "  }",
        "  return count;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__cs_index")) {
      helpers.push([
        "function __cs_index(value, key) {",
        "  if (type(value) == \"string\") {",
        "    return string[\"sub\"](value, key + 1, key + 1);",
        "  }",
        "  return value[key];",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_len")) {
      helpers.push([
        "function __py_len(value) {",
        "  let count = 0;",
        "  for (let __py_item of value) {",
        "    count = count + 1;",
        "  }",
        "  return count;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_string_upper")) {
      helpers.push([
        "function __py_string_upper(value) {",
        "  return string[\"upper\"](value);",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_string_lower")) {
      helpers.push([
        "function __py_string_lower(value) {",
        "  return string[\"lower\"](value);",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_index")) {
      helpers.push([
        "function __py_index(value, key) {",
        "  if (type(value) == \"string\") {",
        "    return string[\"sub\"](value, key + 1, key + 1);",
        "  }",
        "  if (type(key) == \"number\") {",
        "    return value[key];",
        "  }",
        "  return value[key];",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_slice")) {
      helpers.push([
        "function __py_slice(value, start_index, end_index) {",
        "  if (type(value) == \"string\") {",
        "    return string[\"sub\"](value, start_index + 1, end_index);",
        "  }",
        "  let result = [];",
        "  let index = start_index;",
        "  while (index < end_index) {",
        "    table[\"insert\"](result, value[index]);",
        "    index = index + 1;",
        "  }",
        "  return result;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_append")) {
      helpers.push([
        "function __py_append(value, item) {",
        "  table[\"insert\"](value, item);",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_pop")) {
      helpers.push([
        "function __py_pop(value, index) {",
        "  if (index == null) {",
        "    return table[\"remove\"](value);",
        "  }",
        "  return table[\"remove\"](value, index + 1);",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__lua_len")) {
      helpers.push([
        "function __lua_len(value) {",
        "  if (type(value) == \"string\") {",
        "    return string[\"len\"](value);",
        "  }",
        "  let count = 0;",
        "  for (let __lua_item of value) {",
        "    count = count + 1;",
        "  }",
        "  return count;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_value")) {
      helpers.push([
        "function __py_in_value(item, value) {",
        "  for (let __py_item of value) {",
        "    if (__py_item == item) {",
        "      return true;",
        "    }",
        "  }",
        "  return false;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_key")) {
      helpers.push([
        "function __py_in_key(key, value) {",
        "  return value[key] != null;",
        "}"
      ].join("\n"));
    }
    return helpers.join("\n");
  }
}

module.exports = {
  IRToLSGenerator
};
