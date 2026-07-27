const { IREmitter } = require("./src/ir/emitter");

// Create a simple IR for: const greeting = "Hello, " + name + "!";
const ir = {
  module: {
    body: ["var1"],
  },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [
        {
          pattern: "id1",
          init: "binop1",
        },
      ],
    },
    id1: {
      kind: "Identifier",
      name: "greeting",
    },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "binop2",
      right: "lit2",
    },
    binop2: {
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
    id2: {
      kind: "Identifier",
      name: "name",
    },
    lit2: {
      kind: "Literal",
      literalKind: "string",
      value: "!",
      raw: '"!"',
    },
  },
};

const emitter = new IREmitter();
const lua = emitter.emit(ir);
console.log("Generated Lua:");
console.log(lua);

if (lua.includes("..")) {
  console.log("\n✓ String concatenation uses '..' operator (PASS)");
} else if (lua.includes("+")) {
  console.log("\n✗ String concatenation uses '+' operator (FAIL)");
}
