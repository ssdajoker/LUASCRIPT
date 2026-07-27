const { CoreTranspiler } = require("./src/core_transpiler");

const tests = [
  { name: "Simple template", code: '`Hello, world!`' },
  { name: "With one expression", code: '`Hello, ${name}!`' },
  { name: "With multiple expressions", code: '`${greeting}, ${name}! You are ${age} years old.`' },
  { name: "Template in assignment", code: 'const msg = `Count: ${x + y}`;' }
];

console.log("=== TEMPLATE LITERAL VERIFICATION ===\n");

const transpiler = new CoreTranspiler({ optimize: false });

tests.forEach(test => {
  console.log(`${test.name}:`);
  console.log(`  JS: ${test.code}`);
  try {
    const result = transpiler.transpile(test.code, "test.js");
    // Extract just the code, not the full object
    const luaCode = result.code.split('\n').filter(line => line.trim() && !line.includes('--')).join('\n');
    console.log(`  Lua: ${luaCode}`);
    console.log("  ✅ PASS\n");
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
  }
});
