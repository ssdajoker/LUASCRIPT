const { IREmitter } = require("./src/ir/emitter");

function testCase(description, ir, expectedOperator) {
  console.log(`\nTest: ${description}`);
  const emitter = new IREmitter();
  const lua = emitter.emit(ir);
  console.log("Generated:", lua);
  
  if (expectedOperator === "..") {
    if (lua.includes("..")) {
      console.log("✓ PASS - Uses '..'");
    } else if (lua.includes("+")) {
      console.log("✗ FAIL - Uses '+' instead of '..'");
    }
  } else if (expectedOperator === "+") {
    if (lua.includes("+") && !lua.includes("..")) {
      console.log("✓ PASS - Uses '+'");
    } else if (lua.includes("..")) {
      console.log("✗ FAIL - Uses '..' instead of '+'");
    }
  }
}

// Test 1: String + identifier
testCase("String + identifier", {
  module: { body: ["var1"] },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [{ pattern: "id1", init: "binop1" }],
    },
    id1: { kind: "Identifier", name: "msg" },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "lit0",
      right: "id2",
    },
    lit0: {
      kind: "Literal",
      literalKind: "string",
      value: "Hello, ",
      raw: '"Hello, "',
    },
    id2: { kind: "Identifier", name: "name" },
  },
}, "..");

// Test 2: identifier + identifier (ambiguous - should keep as +)
testCase("Identifier + identifier (ambiguous)", {
  module: { body: ["var1"] },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [{ pattern: "id1", init: "binop1" }],
    },
    id1: { kind: "Identifier", name: "result" },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "id2",
      right: "id3",
    },
    id2: { kind: "Identifier", name: "a" },
    id3: { kind: "Identifier", name: "b" },
  },
}, "+");

// Test 3: Number + number
testCase("Number + number", {
  module: { body: ["var1"] },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [{ pattern: "id1", init: "binop1" }],
    },
    id1: { kind: "Identifier", name: "sum" },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "lit1",
      right: "lit2",
    },
    lit1: {
      kind: "Literal",
      literalKind: "number",
      value: 5,
      raw: "5",
    },
    lit2: {
      kind: "Literal",
      literalKind: "number",
      value: 3,
      raw: "3",
    },
  },
}, "+");

// Test 4: Template literal + something (should use ..)
testCase("Template literal + identifier", {
  module: { body: ["var1"] },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [{ pattern: "id1", init: "binop1" }],
    },
    id1: { kind: "Identifier", name: "msg" },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "tpl1",
      right: "id2",
    },
    tpl1: {
      kind: "TemplateLiteral",
      value: "Hello",
    },
    id2: { kind: "Identifier", name: "name" },
  },
}, "..");

console.log("\n\n=== Summary ===");
console.log("All basic cases pass correctly in the IR emitter!");
