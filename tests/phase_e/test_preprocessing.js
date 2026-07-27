const acorn = require('acorn');
const fs = require('fs');
const path = require('path');

function preprocessSourceForParsing(source) {
  if (!source || typeof source !== 'string') {
    return source;
  }

  let result = source;

  // Strip out class field declarations (e.g., `code;` in class bodies)
  result = result.replace(/(\{\s*)([\w$]+)\s*;\s*(\n\s*)/gm, '$1$3');

  // Remove triple-slash directives
  result = result.replace(/\/\/\/\s*<reference[^>]*>/g, '');

  // Remove decorators
  result = result.replace(/@\w+(\([^)]*\))?/g, '');

  return result;
}

const file = path.join('node_modules/@angular/core/fesm2022/core.mjs');
const content = fs.readFileSync(file, 'utf-8');
const sliced = content.slice(0, 100000);

const preprocessed = preprocessSourceForParsing(sliced);

console.log('Lines 40-50 (after preprocessing):');
preprocessed.split('\n').slice(39, 50).forEach((line, i) => {
  console.log(`${40 + i}: ${line}`);
});

console.log('\nTesting Angular parsing with ecmaVersion 2022...\n');

console.log('1. Preprocessed acorn [module]:');
try {
  const ast = acorn.parse(preprocessed, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  console.log(`   ✅ SUCCESS - body items: ${ast.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

console.log('\n2. Preprocessed acorn [script]:');
try {
  const ast = acorn.parse(preprocessed, { ecmaVersion: 2022, sourceType: 'script', locations: true });
  console.log(`   ✅ SUCCESS - body items: ${ast.body.length}`);
} catch (e) {
  console.log(`   ❌ FAIL: ${e.message.split('\n')[0]}`);
}

