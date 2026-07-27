/**
 * Test @babel/parser for Angular bundle parsing
 * Compare with esprima and acorn
 */
const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const acorn = require('acorn');
const babelParser = require('@babel/parser');

const file = path.join('node_modules/@angular/core/fesm2022/core.mjs');
const content = fs.readFileSync(file, 'utf-8');
const sliced = content.slice(0, 100000);

console.log('🔍 Testing parsers on Angular FESM2022 bundle (100KB chunk)...\n');

// Test esprima
console.log('1. esprima.parseScript (tolerant):');
try {
  const ast = esprima.parseScript(sliced, { range: true, loc: true, tolerant: true });
  console.log(`   ✅ SUCCESS - body items: ${ast.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

// Test acorn
console.log('\n2. acorn.parse (module, ecmaVersion 2022):');
try {
  const ast = acorn.parse(sliced, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  console.log(`   ✅ SUCCESS - body items: ${ast.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

// Test @babel/parser
console.log('\n3. @babel/parser (typescript + jsx + decorators):');
try {
  const ast = babelParser.parse(sliced, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: false }],
      'classFields'
    ]
  });
  console.log(`   ✅ SUCCESS - body items: ${ast.program.body.length}`);
  console.log(`   AST type: ${ast.type}, Program type: ${ast.program.type}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

// Test @babel/parser with script mode
console.log('\n4. @babel/parser (script mode):');
try {
  const ast = babelParser.parse(sliced, {
    sourceType: 'script',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: false }],
      'classFields'
    ]
  });
  console.log(`   ✅ SUCCESS - body items: ${ast.program.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

// Test @babel/parser with minimal plugins
console.log('\n5. @babel/parser (minimal plugins):');
try {
  const ast = babelParser.parse(sliced, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });
  console.log(`   ✅ SUCCESS - body items: ${ast.program.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

console.log('\n✅ Parser comparison complete');
