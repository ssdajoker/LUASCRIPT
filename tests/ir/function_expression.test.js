"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { validateIR } = require("../../src/ir/validator");
const { IREmitter } = require("../../src/ir/emitter");

console.log("Testing FunctionExpression support...");

// Test 1: Anonymous function expression
const anonymousSrc = `const x = function() { return 5; };`;
const anonymousIR = parseAndLower(anonymousSrc, {
  sourcePath: "anonymous.js",
  metadata: { authoredBy: "function-expression-test" },
});

assert.ok(validateIR(anonymousIR).ok, "Anonymous function IR should validate");

const anonymousVarDecl = anonymousIR.nodes[anonymousIR.module.body[0]];
assert.strictEqual(anonymousVarDecl.kind, "VariableDeclaration", "Should be a VariableDeclaration");

const anonymousInit = anonymousVarDecl.declarations[0].init;
const anonymousFuncExpr = anonymousIR.nodes[anonymousInit];
assert.strictEqual(anonymousFuncExpr.kind, "FunctionExpression", "Init should be a FunctionExpression");
assert.strictEqual(anonymousFuncExpr.name, null, "Anonymous function should have null name");

// Test emitting
const anonymousEmitter = new IREmitter();
const anonymousLua = anonymousEmitter.emit(anonymousIR);
assert.ok(anonymousLua.includes("local x = function()"), "Should emit Lua function expression");
assert.ok(anonymousLua.includes("return 5"), "Should emit return statement");

console.log("✓ Anonymous function expression test passed");

// Test 2: Named function expression
const namedSrc = `const y = function myFunc(a, b) { return a + b; };`;
const namedIR = parseAndLower(namedSrc, {
  sourcePath: "named.js",
  metadata: { authoredBy: "function-expression-test" },
});

assert.ok(validateIR(namedIR).ok, "Named function expression IR should validate");

const namedVarDecl = namedIR.nodes[namedIR.module.body[0]];
const namedInit = namedVarDecl.declarations[0].init;
const namedFuncExpr = namedIR.nodes[namedInit];
assert.strictEqual(namedFuncExpr.kind, "FunctionExpression", "Init should be a FunctionExpression");
assert.strictEqual(namedFuncExpr.name, "myFunc", "Named function should have name");

// Test emitting
const namedEmitter = new IREmitter();
const namedLua = namedEmitter.emit(namedIR);
assert.ok(namedLua.includes("local y = function(a, b)"), "Should emit Lua function with params");
assert.ok(namedLua.includes("return a + b"), "Should emit return with addition");

console.log("✓ Named function expression test passed");

// Test 3: Function expression in object
const objectSrc = `const obj = { method: function(x) { return x * 2; } };`;
const objectIR = parseAndLower(objectSrc, {
  sourcePath: "object.js",
  metadata: { authoredBy: "function-expression-test" },
});

assert.ok(validateIR(objectIR).ok, "Object with function expression IR should validate");

console.log("✓ Object with function expression test passed");

// Test 4: Function expression as callback
const callbackSrc = `[1, 2, 3].map(function(n) { return n * 2; });`;
const callbackIR = parseAndLower(callbackSrc, {
  sourcePath: "callback.js",
  metadata: { authoredBy: "function-expression-test" },
});

assert.ok(validateIR(callbackIR).ok, "Callback with function expression IR should validate");

// Find the function expression in the IR
const exprStmt = callbackIR.nodes[callbackIR.module.body[0]];
const callExpr = callbackIR.nodes[exprStmt.expression];
assert.strictEqual(callExpr.kind, "CallExpression", "Should be a CallExpression");

// The argument should be a FunctionExpression
const argId = callExpr.arguments[0];
const argNode = callbackIR.nodes[argId];
assert.strictEqual(argNode.kind, "FunctionExpression", "Callback should be a FunctionExpression");
assert.strictEqual(argNode.name, null, "Callback should be anonymous");

console.log("✓ Callback with function expression test passed");

console.log("\n✅ All FunctionExpression tests passed!");
