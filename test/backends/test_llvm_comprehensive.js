"use strict";

const assert = require("assert");
const { IRToLLVMCompiler } = require("../../src/backends/llvm");
const { builder } = require("../../src/ir/builder");

function compile(ir, options = {}) {
  const compiler = new IRToLLVMCompiler({ optimize: true, ...options });
  return compiler.compile(ir);
}

function makeAddFunction() {
  return builder.functionDecl(
    "add",
    [builder.parameter("a", builder.types.number()), builder.parameter("b", builder.types.number())],
    builder.block([builder.returnStmt(builder.add(builder.identifier("a"), builder.identifier("b")))]),
    builder.types.number()
  );
}

(function testHeaderAndDeclarations() {
  const ir = builder.program([makeAddFunction()]);
  const llvm = compile(ir);

  assert.ok(llvm.includes("ModuleID"), "module header should exist");
  assert.ok(llvm.includes("target triple"), "target triple should be emitted");
  assert.ok(llvm.match(/declare.*@printf/), "printf declaration should be present");
})();

(function testStringConstants() {
  const ir = builder.program([
    builder.functionDecl(
      "hello",
      [],
      builder.block([
        builder.variableDecl("msg", builder.literal("hello")),
        builder.returnStmt(builder.identifier("msg"))
      ]),
      builder.types.string()
    )
  ]);

  const llvm = compile(ir);
  assert.ok(llvm.includes("@.str."), "string constant should be emitted");
  assert.ok(llvm.includes("private unnamed_addr constant"), "string constant storage should be private");
})();

(function testControlFlowPhiShapes() {
  const ir = builder.program([
    builder.functionDecl(
      "max",
      [builder.parameter("a", builder.types.number()), builder.parameter("b", builder.types.number())],
      builder.block([
        builder.ifStmt(
          builder.gt(builder.identifier("a"), builder.identifier("b")),
          builder.block([builder.returnStmt(builder.identifier("a"))]),
          builder.block([builder.returnStmt(builder.identifier("b"))])
        )
      ]),
      builder.types.number()
    )
  ]);

  const llvm = compile(ir);
  assert.ok(llvm.match(/br i1/), "conditional branch expected");
  assert.ok(llvm.match(/phi/), "ssa phi nodes should exist for control flow merge");
})();

(function testLoopsEmitBlocks() {
  const ir = builder.program([
    builder.functionDecl(
      "loop",
      [builder.parameter("n", builder.types.number())],
      builder.block([
        builder.variableDecl("i", builder.literal(0)),
        builder.whileStmt(
          builder.lt(builder.identifier("i"), builder.identifier("n")),
          builder.block([
            builder.expressionStmt(
              builder.assign(
                builder.identifier("i"),
                builder.add(builder.identifier("i"), builder.literal(1))
              )
            )
          ])
        ),
        builder.returnStmt(builder.identifier("i"))
      ]),
      builder.types.number()
    )
  ]);

  const llvm = compile(ir);
  assert.ok(llvm.includes("while_cond:"), "loop condition block should exist");
  assert.ok(llvm.includes("while_body:"), "loop body block should exist");
  assert.ok(llvm.includes("while_end:"), "loop end block should exist");
})();

(function testCallingConventionAndSSA() {
  const ir = builder.program([
    makeAddFunction(),
    builder.functionDecl(
      "caller",
      [],
      builder.block([
        builder.variableDecl("tmp", builder.call(builder.identifier("add"), [builder.literal(2), builder.literal(3)])),
        builder.returnStmt(builder.identifier("tmp"))
      ]),
      builder.types.number()
    )
  ]);

  const llvm = compile(ir, { targetTriple: "x86_64-pc-linux-gnu" });
  assert.ok(llvm.includes("define double @caller"), "caller definition should exist");
  assert.ok(llvm.includes("call double @add"), "should call add with double args");
  assert.ok(/%v\d+/.test(llvm), "SSA value names should be generated");
})();

(function testOptimizerFlagRespected() {
  const ir = builder.program([makeAddFunction()]);
  const withOpt = compile(ir, { optimize: true });
  const withoutOpt = compile(ir, { optimize: false });

  assert.notStrictEqual(withOpt, withoutOpt, "opt flag should influence output");
})();

console.log("✅ LLVM comprehensive backend tests passed");
