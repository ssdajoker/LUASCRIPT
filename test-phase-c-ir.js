#!/usr/bin/env node
const { parseAndLower } = require('./src/ir/pipeline');
const { emitLuaFromIR } = require('./src/ir/emitter');

console.log('=== Test 1: Default Parameter ===');
try {
  const js = `function greet(name = "World") {
    return "Hello " + name;
  }`;
  const ir = parseAndLower(js);
  console.log('IR module body:', ir.module.body.map(id => ({ id, kind: ir.nodes[id]?.kind })));
  console.log('\nFirst node:', ir.nodes[ir.module.body[0]]);
  
  const lua = emitLuaFromIR(ir);
  console.log('\nLua output:');
  console.log(lua);
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n\n=== Test 2: Rest Parameters ===');
try {
  const js = `function sum(...numbers) {
    return numbers;
  }`;
  const ir = parseAndLower(js);
  console.log('IR module body:', ir.module.body.map(id => ({ id, kind: ir.nodes[id]?.kind })));
  
  const lua = emitLuaFromIR(ir);
  console.log('\nLua output:');
  console.log(lua);
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n\n=== Test 3: Spread in Call ===');
try {
  const js = `const result = sum(...args);`;
  const ir = parseAndLower(js);
  console.log('IR module body:', ir.module.body.map(id => ({ id, kind: ir.nodes[id]?.kind })));
  
  const lua = emitLuaFromIR(ir);
  console.log('\nLua output:');
  console.log(lua);
} catch (e) {
  console.log('Error:', e.message);
}
