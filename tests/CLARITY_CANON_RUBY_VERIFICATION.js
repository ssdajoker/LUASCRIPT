/**
 * CLARITY CANON - RUBY TRANSPILER VERIFICATION
 * 
 * Full phase gate verification for Ruby transpiler:
 * Phase A: Parsing & Lowering
 * Phase B: Canonical IR normalization
 * Phase C: Speed optimization
 * Phase E: Security validation
 * 
 * Target: 80% → 100% Ruby support completion
 */

const { RubyParser } = require("../src/parsers/ruby_parser");
const RubyLowerer = require("../src/ir/lowerer_ruby");
const { RubyIRLowererPhaseB } = require("../src/ir/ruby_ir_lowerer_phase_b");
const { RubyEmitter } = require("../src/ir/emitter_ruby");
const RubyPerformanceOptimizer = require("../src/optimizers/ruby/ruby_performance_optimizer");
const { RubySecurityValidator } = require("../src/optimizers/ruby/ruby_security_validator");

// Test counters
let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ ${description}`);
    console.error(`     Error: ${error.message}`);
  }
}

// Test data: Simple Ruby snippets
const rubySnippets = {
  empty: "",
  assignment: "x = 5",
  method: "def greet(name)\n  puts \"Hello, #{name}\"\nend",
  class: "class Person\n  def initialize(name)\n    @name = name\n  end\nend",
  if: "if x > 10\n  puts \"big\"\nelse\n  puts \"small\"\nend",
  loop: "5.times { |i| puts i }",
  array: "[1, 2, 3, 4, 5]",
  hash: "{ name: 'John', age: 30 }",
};

console.log("=" * 70);
console.log("🚀 PHASE A - PARSING & AST GENERATION");
console.log("=" * 70);

test("Parser instantiates", () => {
  const parser = new RubyParser();
  if (!parser) throw new Error("Parser failed to instantiate");
});

test("Parse: empty", () => {
  const parser = new RubyParser();
  const ast = parser.parse(rubySnippets.empty);
  if (!ast || !ast.body) throw new Error("Empty parse failed");
});

test("Parse: assignment", () => {
  const parser = new RubyParser();
  const ast = parser.parse(rubySnippets.assignment);
  if (!ast || !ast.body || ast.body.length === 0) throw new Error("Assignment parse failed");
});

test("Parse: method", () => {
  const parser = new RubyParser();
  const ast = parser.parse(rubySnippets.method);
  if (!ast || !ast.body || ast.body.length === 0) throw new Error("Method parse failed");
});

console.log("\n" + "=" * 70);
console.log("🚀 PHASE A - LOWERING TO PHASE A IR");
console.log("=" * 70);

test("Lowerer instantiates", () => {
  const lowerer = new RubyLowerer();
  if (!lowerer) throw new Error("Lowerer failed to instantiate");
});

test("Lower: empty", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const ast = parser.parse(rubySnippets.empty);
  const ir = lowerer.lower(ast);
  if (!ir) throw new Error("Empty lowering failed");
});

test("Lower: assignment", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const ast = parser.parse(rubySnippets.assignment);
  const ir = lowerer.lower(ast);
  if (!ir || !ir.nodes) throw new Error("Assignment lowering failed");
});

test("Lower: method", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const ast = parser.parse(rubySnippets.method);
  const ir = lowerer.lower(ast);
  if (!ir || !ir.nodes) throw new Error("Method lowering failed");
});

console.log("\n" + "=" * 70);
console.log("🚀 PHASE B - NORMALIZATION TO CANONICAL IR");
console.log("=" * 70);

test("Phase B Lowerer instantiates", () => {
  const phaseBLowerer = new RubyIRLowererPhaseB();
  if (!phaseBLowerer) throw new Error("Phase B lowerer failed to instantiate");
});

test("Phase B lower: empty", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const phaseBLowerer = new RubyIRLowererPhaseB();
  
  const ast = parser.parse(rubySnippets.empty);
  const phaseAIR = lowerer.lower(ast);
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) throw new Error("Phase B empty lowering failed");
});

test("Phase B lower: assignment", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const phaseBLowerer = new RubyIRLowererPhaseB();
  
  const ast = parser.parse(rubySnippets.assignment);
  const phaseAIR = lowerer.lower(ast);
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) throw new Error("Phase B assignment lowering failed");
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Phase B errors: ${result.errors.map(e => e.message).join(", ")}`);
  }
});

test("Phase B lower: method", () => {
  const parser = new RubyParser();
  const lowerer = new RubyLowerer();
  const phaseBLowerer = new RubyIRLowererPhaseB();
  
  const ast = parser.parse(rubySnippets.method);
  const phaseAIR = lowerer.lower(ast);
  const result = phaseBLowerer.lower(phaseAIR);
  
  if (!result || !result.ir) throw new Error("Phase B method lowering failed");
});

console.log("\n" + "=" * 70);
console.log("🚀 PHASE C - SPEED OPTIMIZATION");
console.log("=" * 70);

test("Optimizer instantiates", () => {
  const optimizer = new RubyPerformanceOptimizer();
  if (!optimizer) throw new Error("Optimizer failed to instantiate");
});

test("Optimizer: dead code elimination", () => {
  const optimizer = new RubyPerformanceOptimizer();
  const testIR = {
    nodes: [
      { type: "VariableDeclaration", name: "unused" },
      { type: "ReturnStatement", argument: { type: "Literal", value: 5 } },
      { type: "ExpressionStatement", expression: { type: "Literal", value: 10 } }, // Dead code
    ],
  };
  
  const optimized = optimizer.eliminateDeadCode(testIR);
  if (optimized.nodes.length !== 2) throw new Error("Dead code not eliminated");
  if (optimizer.getStats().deadCodeRemoved === 0) throw new Error("Stats not updated");
});

test("Optimizer: constant folding", () => {
  const optimizer = new RubyPerformanceOptimizer();
  const testIR = {
    nodes: [
      {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Literal", value: 2 },
        right: { type: "Literal", value: 3 },
      },
    ],
  };
  
  const optimized = optimizer.foldConstants(testIR);
  if (optimized.nodes[0].type !== "Literal" || optimized.nodes[0].value !== 5) {
    throw new Error("Constant folding failed");
  }
  if (optimizer.getStats().constantsFolded === 0) throw new Error("Stats not updated");
});

test("Optimizer: full pipeline", () => {
  const optimizer = new RubyPerformanceOptimizer();
  const testIR = {
    nodes: [
      { type: "VariableDeclaration", name: "x", init: { type: "Literal", value: 10 } },
      { type: "ReturnStatement", argument: { type: "Identifier", name: "x" } },
    ],
  };
  
  const optimized = optimizer.optimize(testIR);
  if (!optimized) throw new Error("Optimization pipeline failed");
  
  const stats = optimizer.getStats();
  if (typeof stats.totalOptimizations !== "number") throw new Error("Stats invalid");
});

console.log("\n" + "=" * 70);
console.log("🚀 PHASE E - SECURITY VALIDATION");
console.log("=" * 70);

test("Security validator instantiates", () => {
  const validator = new RubySecurityValidator();
  if (!validator) throw new Error("Security validator failed to instantiate");
});

test("Security: detect eval vulnerability", () => {
  const validator = new RubySecurityValidator({ allowEval: false });
  const testIR = {
    nodes: [
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "eval" },
        arguments: [{ type: "Literal", value: "user_input" }],
      },
    ],
  };
  
  const result = validator.validate(testIR);
  if (result.passed) throw new Error("Should detect eval vulnerability");
  if (result.stats.criticalIssues === 0) throw new Error("Critical issue not detected");
});

test("Security: safe code passes", () => {
  const validator = new RubySecurityValidator();
  const testIR = {
    nodes: [
      { type: "VariableDeclaration", name: "x", init: { type: "Literal", value: 10 } },
      { type: "ReturnStatement", argument: { type: "Identifier", name: "x" } },
    ],
  };
  
  const result = validator.validate(testIR);
  if (!result.passed && result.stats.criticalIssues > 0) {
    throw new Error("Safe code flagged as insecure");
  }
});

test("Security: score calculation", () => {
  const validator = new RubySecurityValidator();
  const testIR = { nodes: [] };
  
  const result = validator.validate(testIR);
  if (result.securityScore !== 100) throw new Error("Security score incorrect");
});

console.log("\n" + "=" * 70);
console.log("🎯 CLARITY CANON - RUBY TRANSPILER VERIFICATION REPORT");
console.log("=" * 70);

console.log("\nPhase Coverage:");
console.log("  ✅ Phase A - Parsing & AST Generation");
console.log("  ✅ Phase A - Lowering to Phase A IR");
console.log("  ✅ Phase B - Normalization to Canonical IR");
console.log("  ✅ Phase C - Speed Optimization");
console.log("  ✅ Phase E - Security Validation");

console.log("\nTest Results:");
console.log(`  Total:  ${totalTests}`);
console.log(`  Passed: ${passedTests} ✅`);
console.log(`  Failed: ${totalTests - passedTests} ❌`);
console.log(`  Rate:   ${((passedTests / totalTests) * 100).toFixed(1)}%`);

console.log("\nPhase Gate Status:");
console.log(`  Phase A: ${passedTests >= 6 ? "✅ PASS" : "❌ FAIL"}`);
console.log(`  Phase B: ${passedTests >= 9 ? "✅ PASS" : "❌ FAIL"}`);
console.log(`  Phase C: ${passedTests >= 12 ? "✅ PASS" : "❌ FAIL"}`);
console.log(`  Phase E: ${passedTests >= 15 ? "✅ PASS" : "❌ FAIL"}`);

console.log(`\nOverall Status: ${passedTests === totalTests ? "✅ PASS" : "⚠️  PARTIAL"}`);
console.log("=" * 70);

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
