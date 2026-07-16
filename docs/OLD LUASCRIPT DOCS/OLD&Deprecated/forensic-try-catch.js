/**
 * FORENSIC DEBUGGING: Try-Catch-Finally IR Validation Issue
 * Goal: Identify why IR validation is failing for try-catch-finally
 */

const { parseAndLower } = require('./src/ir/pipeline');
const { validateIR } = require('./src/ir/validator');
const { emitLuaFromIR } = require('./src/ir/emitter');
const util = require('util');

console.log('='.repeat(70));
console.log('FORENSIC DEBUG: Try-Catch-Finally IR Validation');
console.log('='.repeat(70));

// Test case from failing test
const source = 'try { doSomething(); } catch (err) { log(err); } finally { cleanup(); }';

console.log('\n📋 Test Source:');
console.log(`  ${source}\n`);

try {
  console.log('🔍 Step 1: Parsing and lowering...');
  const ir = parseAndLower(source);
  
  console.log('\n📊 IR Structure:');
  console.log(util.inspect(ir, { depth: 6, colors: true, compact: false }));
  
  console.log('\n🧪 Step 2: Validating IR...');
  const validation = validateIR(ir);
  console.log(`\n✓ Validation result: ${JSON.stringify(validation)}`);
  
  if (!validation.ok) {
    console.log('\n❌ Validation FAILED');
    console.log('Errors:', validation.errors);
  } else {
    console.log('\n✅ Validation PASSED');
  }
  
  console.log('\n🔄 Step 3: Emitting Lua...');
  const lua = emitLuaFromIR(ir);
  console.log('\nGenerated Lua:');
  console.log(lua);
  
} catch (error) {
  console.log('\n❌ ERROR OCCURRED:');
  console.log(`  Type: ${error.constructor.name}`);
  console.log(`  Message: ${error.message}`);
  console.log(`  Stack: ${error.stack}`);
}

console.log('\n' + '='.repeat(70));
