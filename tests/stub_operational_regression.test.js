"use strict";

const assert = require("assert");
const { FunctionCache } = require("../src/optimizers/javascript/speed/function_cache");
const { CacheManager } = require("../src/optimizers/javascript/speed/cache_manager");
const { analyzeFfiCalls } = require("../src/optimizers/javascript/interop/ffi-analyzer");
const { calculateCompliance } = require("../src/optimizers/javascript/javascript-optimizer");
const PythonParser = require("../src/parsers/python_parser");

function identifier(name) {
  return { type: "Identifier", name };
}

function literal(value) {
  return { type: "Literal", value };
}

function binary(left, operator, right) {
  return { type: "BinaryExpression", left, operator, right };
}

function testFunctionCacheCompilesAndTracksClosures() {
  const manager = new CacheManager();
  const cache = new FunctionCache(manager);

  const fnAst = {
    type: "FunctionDeclaration",
    id: identifier("sumWithOuter"),
    params: [identifier("x")],
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "VariableDeclaration",
          declarations: [
            { type: "VariableDeclarator", id: identifier("localValue"), init: literal(2) }
          ]
        },
        {
          type: "ReturnStatement",
          argument: binary(binary(identifier("x"), "+", identifier("localValue")), "+", identifier("outer"))
        }
      ]
    }
  };

  const lua = cache.cacheFunctionDeclaration(fnAst);
  assert.match(lua, /local function sumWithOuter\(x\)/);
  assert.match(lua, /local localValue = 2/);
  assert.match(lua, /return x \+ localValue \+ outer/);
  assert.deepStrictEqual([...cache.closureMap.values()][0], ["outer"]);
  manager.destroy();
}

function testDestructuredParameterCompilation() {
  const manager = new CacheManager();
  const cache = new FunctionCache(manager);
  const fnAst = {
    type: "FunctionDeclaration",
    id: identifier("readPoint"),
    params: [
      {
        type: "ObjectPattern",
        properties: [
          { key: identifier("x"), value: identifier("x") },
          { key: identifier("y"), value: identifier("y") }
        ]
      }
    ],
    body: {
      type: "BlockStatement",
      body: [
        { type: "ReturnStatement", argument: binary(identifier("x"), "+", identifier("y")) }
      ]
    }
  };

  const lua = cache.cacheDestructuredFunction(fnAst);
  assert.match(lua, /destructured_param_1/);
  assert.match(lua, /local x = destructured_param_1\.x/);
  assert.match(lua, /local y = destructured_param_1\.y/);
  assert.match(lua, /return x \+ y/);
  manager.destroy();
}

function testFfiCallbackCapturesAreDataDerived() {
  const ir = {
    type: "Program",
    body: [
      {
        type: "Call",
        _nodeId: "Callback_1",
        callee: { type: "Member", object: { name: "ffi" }, property: "callback" },
        arguments: [
          {
            type: "Function",
            params: [identifier("value")],
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "VariableDeclaration",
                  declarations: [
                    { type: "VariableDeclarator", id: identifier("localValue"), init: identifier("value") }
                  ]
                },
                {
                  type: "ReturnStatement",
                  argument: binary(identifier("localValue"), "+", identifier("captured"))
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const analysis = analyzeFfiCalls(ir);
  assert.strictEqual(analysis.ffiCallbacks.length, 1);
  assert.deepStrictEqual(analysis.ffiCallbacks[0].capturedVariables, ["captured"]);
}

function testInteropScoreUsesMetrics() {
  const phases = [{ name: "Phase 5: Interop Optimization", success: true, time: 1 }];
  const highOverhead = calculateCompliance(
    phases,
    { phaseResults: { interop: { totalCalls: 2, totalOverhead: 300, batchingOpportunities: 0 } } },
    { targetCompliance: 85 }
  );
  const lowOverhead = calculateCompliance(
    phases,
    { phaseResults: { interop: { totalCalls: 2, totalOverhead: 10, batchingOpportunities: 2 } } },
    { targetCompliance: 85 }
  );

  assert.ok(highOverhead.scores.interop < lowOverhead.scores.interop);
  assert.strictEqual(highOverhead.gates.interopGate, false);
  assert.strictEqual(lowOverhead.gates.interopGate, true);
}

function testPythonCompoundStatementsCarryFields() {
  const parser = new PythonParser({ enableTier1Optimizations: false });
  const ast = parser.parse("if x:\n    return 1\nelse:\n    return 0\n");
  const ifNode = ast.body[0];

  assert.strictEqual(ifNode.type, "IfStatement");
  assert.ok(ifNode.test);
  assert.ok(Array.isArray(ifNode.consequent));
  assert.ok(Array.isArray(ifNode.alternate));
  assert.strictEqual(ifNode.consequent[0].type, "ReturnStatement");
}

function main() {
  testFunctionCacheCompilesAndTracksClosures();
  testDestructuredParameterCompilation();
  testFfiCallbackCapturesAreDataDerived();
  testInteropScoreUsesMetrics();
  testPythonCompoundStatementsCarryFields();
  console.log("stub operational regression tests passed");
}

if (require.main === module) {
  main();
}

module.exports = { main };
