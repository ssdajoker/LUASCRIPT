"use strict";

const path = require("path");
const { CoreTranspiler } = require("../../src/core_transpiler");
const { parseAndLower } = require("../../src/ir/pipeline");
const { emitLuaFromIR } = require("../../src/ir/emitter");
const {
  CoreLanguageBridge,
  IRToJSGenerator,
  IRToLuaGenerator,
  JSToIRCompiler
} = require("../../src/compilers");
const {
  repoRoot,
  relativePath,
  fileHash,
  hashText,
  environmentMetadata,
  supportMatrixTraceability,
  writeJsonReport
} = require("../conformance/report_utils");

console.log("Testing unsupported IR diagnostics...");

const reportPath = path.join(repoRoot, "artifacts", "conformance", "unsupported-diagnostics-report.json");
const testPath = __filename;
const startedAt = Date.now();
const classIR = parseAndLower("class Point { constructor(x) { this.x = x; } }");
const jsCompiler = new JSToIRCompiler();
const bridge = new CoreLanguageBridge();
const coreTranspiler = new CoreTranspiler({ strict: false });

const cases = [
  {
    id: "class_declaration_lua_emitter",
    label: "ClassDeclaration must fail with an explicit unsupported diagnostic",
    category: "ir-emitter",
    pattern: /Emitter does not support FunctionDeclaration: class-like FunctionDeclaration requires class lowering before Lua emission/,
    run: () => emitLuaFromIR(classIR)
  },
  {
    id: "javascript_for_of",
    label: "ForOfStatement must fail with a named JavaScript control-flow diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript control flow: for-of loops/,
    run: () => jsCompiler.compile("for (const value of [1, 2]) { console.log(value); }")
  },
  {
    id: "javascript_try_catch",
    label: "TryStatement must fail with a named JavaScript exception diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript exception flow: try\/catch\/finally/,
    run: () => jsCompiler.compile("try { console.log('body'); } catch (error) { console.log(error); }")
  },
  {
    id: "javascript_throw",
    label: "ThrowStatement must fail with a named JavaScript exception diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript exception flow: throw statements/,
    run: () => jsCompiler.compile("throw new Error('boom');")
  },
  {
    id: "javascript_tagged_template",
    label: "TaggedTemplateExpression must fail with a named JavaScript template diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript template literal form: tagged template literals/,
    run: () => jsCompiler.compile("function tag(parts) { return parts[0]; }\nconsole.log(tag`value`);")
  },
  {
    id: "javascript_object_spread",
    label: "Object spread must fail with a named JavaScript data-structure diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript object spread/,
    run: () => jsCompiler.compile("const base = { a: 1 };\nconst copy = { ...base, b: 2 };\nconsole.log(copy.b);")
  },
  {
    id: "javascript_destructuring",
    label: "Destructuring declarations must fail with a named JavaScript pattern diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript variable declarator pattern: ObjectPattern/,
    run: () => jsCompiler.compile("const { a } = { a: 1 };\nconsole.log(a);")
  },
  {
    id: "luascript_for_of",
    label: ".ls for-of syntax must fail with the named JS-like control-flow diagnostic",
    category: "luascript-source",
    pattern: /Unsupported JavaScript control flow: for-of loops/,
    run: () => bridge.compileToIR("for (let value of [1, 2]) { console.log(value); }", "luascript")
  },
  {
    id: "luascript_try_catch",
    label: ".ls try/catch syntax must fail with the named JS-like exception diagnostic",
    category: "luascript-source",
    pattern: /Unsupported JavaScript exception flow: try\/catch\/finally/,
    run: () => bridge.compileToIR("try { console.log('body'); } catch (error) { console.log(error); }", "luascript")
  },
  {
    id: "luascript_repair_strategy",
    label: ".ls repair blocks must fail with a named repair-strategy diagnostic",
    category: "luascript-source",
    pattern: /Unsupported repair strategy for indexing: one_based/,
    run: () => bridge.compileToIR("repair { target lua { lower indexing using one_based; } }\nconsole.log('x');", "luascript")
  },
  {
    id: "python_slice_step",
    label: "Python slice steps must fail with a named input-feature diagnostic",
    category: "python-source",
    pattern: /Unsupported Python input feature: slice steps/,
    run: () => bridge.compileToIR("values = [1, 2, 3]\nprint(values[0:3:2])\n", "python")
  },
  {
    id: "python_slice_assignment",
    label: "Python slice assignment must fail with a named input-feature diagnostic",
    category: "python-source",
    pattern: /Unsupported Python input feature: slice assignment/,
    run: () => bridge.compileToIR("values = [1, 2, 3]\nvalues[1:2] = [9]\nprint(values)\n", "python")
  },
  {
    id: "python_continue",
    label: "Python continue statements must fail with a named input-feature diagnostic",
    category: "python-source",
    pattern: /Unsupported Python input feature: continue statements/,
    run: () => bridge.compileToIR("total = 0\nfor value in range(3):\n    if value == 1:\n        continue\n    total = total + value\nprint(total)\n", "python")
  },
  {
    id: "lua_varargs",
    label: "Lua varargs must fail with a named input-feature diagnostic",
    category: "lua-source",
    pattern: /Unsupported Lua input feature: varargs/,
    run: () => bridge.compileToIR("function collect(...)\n  print(...)\nend\n", "lua")
  },
  {
    id: "lua_metatables",
    label: "Lua metatable helpers must fail with a named input-feature diagnostic",
    category: "lua-source",
    pattern: /Unsupported Lua input feature: metatables/,
    run: () => bridge.compileToIR("local box = setmetatable({}, {})\nprint(box)\n", "lua")
  },
  {
    id: "lua_require",
    label: "Lua require calls must fail with a named input-feature diagnostic",
    category: "lua-source",
    pattern: /Unsupported Lua input feature: require/,
    run: () => bridge.compileToIR("local tools = require('tools')\nprint(tools)\n", "lua")
  },
  {
    id: "lua_complex_table_key",
    label: "Lua complex table keys must fail with a named input-feature diagnostic",
    category: "lua-source",
    pattern: /Unsupported Lua input feature: complex table keys/,
    run: () => bridge.compileToIR("local map = { ['a' .. 'b'] = 1 }\nprint(map)\n", "lua")
  },
  {
    id: "core_transpiler_throw_fallback",
    label: "Core transpiler fallback must fail with a named JavaScript throw diagnostic",
    category: "core-transpiler",
    pattern: /Unsupported JavaScript exception flow: throw statements/,
    run: () => coreTranspiler.generateLuaFromAST({ type: "ThrowStatement" })
  },
  {
    id: "javascript_rest_parameters",
    label: "Rest parameters must fail with a named JavaScript parameter diagnostic",
    category: "javascript-source",
    pattern: /Unsupported JavaScript parameter pattern: RestElement/,
    run: () => jsCompiler.compile("function collect(...items) { return items.length; }")
  },
  {
    id: "javascript_output_unknown_ir",
    label: "JavaScript emitter must fail with a target-specific unsupported IR diagnostic",
    category: "target-emitter",
    pattern: /Unsupported JavaScript output IR node kind: ImaginaryNode/,
    run: () => new IRToJSGenerator().generate({ kind: "ImaginaryNode" })
  },
  {
    id: "lua_output_unknown_ir",
    label: "Lua emitter must fail with a target-specific unsupported IR diagnostic",
    category: "target-emitter",
    pattern: /Unsupported Lua output IR node kind: ImaginaryNode/,
    run: () => new IRToLuaGenerator().generate({ kind: "ImaginaryNode" })
  }
];

function verifyDiagnostic(item) {
  try {
    item.run();
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (!item.pattern.test(message)) {
      throw new Error(`${item.label} expected ${item.pattern}, got ${JSON.stringify(message)}`);
    }
    return {
      id: item.id,
      label: item.label,
      category: item.category,
      status: "passed",
      pattern: item.pattern.source,
      diagnostic: message,
      caseHash: hashText(`${item.id}\n${item.pattern.source}`)
    };
  }

  throw new Error(`${item.label} did not throw`);
}

const results = [];
const failures = [];

for (const item of cases) {
  try {
    results.push(verifyDiagnostic(item));
  } catch (error) {
    failures.push({
      id: item.id,
      label: item.label,
      category: item.category,
      status: "failed",
      message: error && error.message ? error.message : String(error),
      caseHash: hashText(`${item.id}\n${item.pattern.source}`)
    });
    results.push({
      id: item.id,
      label: item.label,
      category: item.category,
      status: "failed",
      pattern: item.pattern.source,
      error: error && error.message ? error.message : String(error)
    });
  }
}

const report = {
  schemaVersion: 1,
  kind: "luascript:unsupported-diagnostics",
  command: "npm run test:unsupported-diagnostics",
  generatedAt: new Date().toISOString(),
  elapsedMs: Date.now() - startedAt,
  environment: environmentMetadata(),
  testFile: {
    path: relativePath(testPath),
    sha256: fileHash(testPath)
  },
  supportMatrixTraceability: supportMatrixTraceability({
    supportRows: [
      "JavaScript input to Lua output",
      "LUASCRIPT `.ls` JS-like syntax plus V0.16 meta layer to Lua/Python/JavaScript/`.ls`",
      "Python",
      "Lua input",
      "Unsupported diagnostics",
      "Canonical IR conformance"
    ],
    evidenceRole: "Named unsupported diagnostics catalog for stable current JavaScript, `.ls`, Python, Lua, core fallback, and target-emitter failures."
  }),
  summary: {
    total: cases.length,
    passed: results.filter(result => result.status === "passed").length,
    failed: failures.length,
    categories: [...new Set(cases.map(item => item.category))].sort()
  },
  results,
  failures
};

writeJsonReport(reportPath, report);

if (failures.length > 0) {
  console.error(`Unsupported IR diagnostics tests failed: ${failures.length} failure(s)`);
  console.error(`Unsupported diagnostics report: ${relativePath(reportPath)}`);
  process.exit(1);
}

console.log("✅ Unsupported IR diagnostics tests passed");
console.log(`Unsupported diagnostics report: ${relativePath(reportPath)}`);
