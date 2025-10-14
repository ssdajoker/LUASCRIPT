"use strict";

const { CoreTranspiler } = require("../../src/core_transpiler");
const { AdvancedFeatures } = require("../../src/advanced_features");

let total = 0;
let passed = 0;
const failures = [];

async function test(name, fn) {
  total += 1;
  try {
    const ok = await fn();
    if (ok) {
      passed += 1;
      console.log(`  ✅ ${name}`);
    } else {
      failures.push(`${name}: returned false`);
      console.log(`  ❌ ${name} (returned false)`);
    }
  } catch (err) {
    failures.push(`${name}: ${err && err.message}`);
    console.log(`  ❌ ${name} (${err && err.message})`);
  }
}

async function run() {
  console.log("\n🎯 Parity Tests: Closures, Patterns, Metamethods\n");

  // Closures (transpiler output parity)
  await test("Closures: function returns arrow function", async () => {
    const js = "function makeAdder(x) { return (y) => x + y; }";
    const transpiler = new CoreTranspiler({ optimize: false });
    const { code } = transpiler.transpile(js, "closures.js");
    return /function\s*\(/.test(code) && /return\s+function\s*\(/.test(code);
  });

  // Pattern matching transform presence
  await test("Pattern Matching: switch -> if/elseif chain", async () => {
    const af = new AdvancedFeatures({ enablePatternMatching: true, enableOOP: false, enableTypeSystem: false, enableMacros: false });
    const lua = af.transform("switch(x) { case 1: y = 1; break; case 2: y = 2; break; }", ["patterns"]);
    return /_match_value/.test(lua) || /if\s+/.test(lua);
  });

  // Metamethods/OOP alignment (setmetatable + __index)
  await test("Metamethods/OOP: class extends translates to setmetatable + __index", async () => {
    const af = new AdvancedFeatures({ enablePatternMatching: false, enableOOP: true, enableTypeSystem: false, enableMacros: false });
    const lua = af.transform("class A extends B { constructor() {} foo() {} }", ["oop"]);
    return /A\.__index\s*=\s*A/.test(lua) && /setmetatable\(A,\s*B\)/.test(lua);
  });

  console.log("\n—— Summary ——");
  console.log(`Passed ${passed}/${total}`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log("  -", f);
    process.exit(1);
  }
}

run();
