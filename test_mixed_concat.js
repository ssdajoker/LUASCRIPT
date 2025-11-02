const { IREmitter } = require("./src/ir/emitter");

// Test case 1: const msg = "Value: " + x;
console.log("Test 1: const msg = \"Value: \" + x;");
const ir1 = {
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
      value: "Value: ",
      raw: '"Value: "',
    },
    id2: { kind: "Identifier", name: "x" },
  },
};

const emitter = new IREmitter();
const lua1 = emitter.emit(ir1);
console.log("Generated:", lua1);
console.log("Uses '..'?", lua1.includes(".."));
console.log();

// Test case 2: const result = x + y; (numeric addition)
console.log("Test 2: const result = x + y;");
const ir2 = {
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
    id2: { kind: "Identifier", name: "x" },
    id3: { kind: "Identifier", name: "y" },
  },
};

const lua2 = emitter.emit(ir2);
console.log("Generated:", lua2);
console.log("Uses '+'?", lua2.includes("+"));
console.log();

// Test case 3: const mixed = "Count: " + (x + y);
console.log("Test 3: const mixed = \"Count: \" + (x + y);");
const ir3 = {
  module: { body: ["var1"] },
  nodes: {
    var1: {
      kind: "VariableDeclaration",
      declarationKind: "const",
      declarations: [{ pattern: "id1", init: "binop1" }],
    },
    id1: { kind: "Identifier", name: "mixed" },
    binop1: {
      kind: "BinaryExpression",
      operator: "+",
      left: "lit0",
      right: "binop2",
    },
    lit0: {
      kind: "Literal",
      literalKind: "string",
      value: "Count: ",
      raw: '"Count: "',
    },
    binop2: {
      kind: "BinaryExpression",
      operator: "+",
      left: "id2",
      right: "id3",
    },
    id2: { kind: "Identifier", name: "x" },
    id3: { kind: "Identifier", name: "y" },
  },
};

const lua3 = emitter.emit(ir3);
console.log("Generated:", lua3);
console.log();
