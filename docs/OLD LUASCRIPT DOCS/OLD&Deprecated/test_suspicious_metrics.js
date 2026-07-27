/**
 * Quick test to verify C# and other "0.00ms" languages are actually working
 */

const path = require('path');
const fs = require('fs');

// Test languages that show suspiciously perfect metrics
const SUSPICIOUS_LANGUAGES = [
  'CSharp',
  'OCaml',
  'MLIR',
  'Swift',
  'FSharp',
  'Elm'
];

const TEST_CODE = 'const x = 42;';

console.log('🔍 Testing Suspicious "Perfect" Language Metrics\n');
console.log('=' .repeat(70));

// Load tier3 optimizers
let tier3Module;
try {
  tier3Module = require('./src/backends/tier3_optimizers.js');
} catch (e) {
  console.log('❌ Could not load tier3_optimizers:', e.message);
  process.exit(1);
}

SUSPICIOUS_LANGUAGES.forEach(lang => {
  console.log(`\n📋 Testing ${lang}...`);
  
  const optimizerName = `${lang}Optimizer`;
  const OptimizerClass = tier3Module[optimizerName];
  
  if (!OptimizerClass) {
    console.log(`  ⚠️  Optimizer class not found: ${optimizerName}`);
    return;
  }
  
  try {
    const optimizer = new OptimizerClass();
    const start = process.hrtime.bigint();
    const result = optimizer.optimizeTranspilation(TEST_CODE);
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    
    console.log(`  ⏱️  Duration: ${duration.toFixed(2)}ms`);
    console.log(`  📝 Output length: ${result.code ? result.code.length : 0} chars`);
    console.log(`  🔍 Output preview: ${result.code ? result.code.substring(0, 100).replace(/\n/g, '\\n') : 'NONE'}`);
    
    // Check if it's just a stub/comment
    const isStub = !result.code || 
                   result.code.trim().length < 20 ||
                   result.code.trim().startsWith('//') ||
                   result.code.includes('Not yet implemented');
    
    console.log(`  ✅ Real code: ${!isStub ? 'YES' : 'NO (STUB ONLY)'}`);
    
    if (isStub) {
      console.log(`  ⚠️  WARNING: This appears to be a stub, not real transpilation!`);
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n📊 CONCLUSION:');
console.log('Check which languages show real code vs stubs.');
console.log('Languages with only comment stubs should be marked as');
console.log('"Proof-of-Concept" or "Planned", NOT "Fully Production Ready".\n');
