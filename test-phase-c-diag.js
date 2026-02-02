#!/usr/bin/env node
const Transpiler = require('./src/transpiler');
const t = new Transpiler();

console.log('=== Test 1: Default Parameter ===');
try {
  const r1 = t.transpile('function greet(name = "World") { return "Hello " + name; }', 'test.js');
  console.log('Success:', r1.success);
  if (!r1.success) console.log('Error:', r1.errors[0]);
} catch(e) { 
  console.log('Exception:', e.message); 
}

console.log('\n=== Test 2: Rest Parameters ===');
try {
  const r2 = t.transpile('function sum(...numbers) { return numbers; }', 'test.js');
  console.log('Success:', r2.success);
  if (!r2.success) console.log('Error:', r2.errors[0]);
} catch(e) { 
  console.log('Exception:', e.message); 
}

console.log('\n=== Test 3: This Expression ===');
try {
  const r3 = t.transpile('const obj = { name: "test", greet: function() { return "Hello " + this.name; } };', 'test.js');
  console.log('Success:', r3.success);
  if (!r3.success) console.log('Error:', r3.errors[0]);
} catch(e) { 
  console.log('Exception:', e.message); 
}

console.log('\n=== Test 4: Spread in Call ===');
try {
  const r4 = t.transpile('const result = sum(...args);', 'test.js');
  console.log('Success:', r4.success);
  if (!r4.success) console.log('Error:', r4.errors[0]);
} catch(e) { 
  console.log('Exception:', e.message); 
}
