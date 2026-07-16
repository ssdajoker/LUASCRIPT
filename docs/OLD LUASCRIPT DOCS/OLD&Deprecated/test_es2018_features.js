// Test ES2018+ features: try-catch patterns and async iteration
const { LuaScriptParser } = require("./src/phase1_core_parser");
const { IRLowerer } = require("./src/ir/lowerer");

const testCases = [
  {
    name: "Try-catch with simple identifier",
    code: "try { throw new Error(); } catch (error) { error.message; }",
  },
  {
    name: "Try-catch with object pattern",
    code: "try { throw {message: 'error', stack: 'trace'}; } catch ({message, stack}) { message; }",
  },
  {
    name: "Try-catch with array pattern",
    code: "try { throw [1, 2, 3]; } catch ([a, b, c]) { a + b + c; }",
  },
  {
    name: "Try-catch with optional catch binding (no parameter)",
    code: "try { risky(); } catch { console.log('failed'); }",
  },
  {
    name: "For-await-of with simple variable",
    code: "async function f() { for await (const item of asyncIterator) { item; } }",
  },
  {
    name: "For-await-of with array pattern",
    code: "async function f() { for await (const [a, b] of asyncIterator) { a + b; } }",
  },
];

console.log("\n" + "=".repeat(80));
console.log("ES2018+ FEATURES TEST SUITE");
console.log("=".repeat(80) + "\n");

let passed = 0;
let failed = 0;

testCases.forEach(({ name, code }) => {
  console.log(`Testing: ${name}`);
  console.log(`Code: ${code.substring(0, 60)}${code.length > 60 ? "..." : ""}`);
  
  try {
    const parser = new LuaScriptParser(code);
    const ast = parser.parse();
    
    if (parser.errors && parser.errors.length > 0) {
      console.log(`❌ Parse error: ${parser.errors[0].message}\n`);
      failed++;
      return;
    }
    
    const lowerer = new IRLowerer();
    const ir = lowerer.lowerProgram(ast);
    
    console.log(`✅ Success\n`);
    passed++;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    failed++;
  }
});

console.log("=".repeat(80));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log(`Pass Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);
console.log("=".repeat(80));
