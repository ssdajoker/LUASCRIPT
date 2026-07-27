/**
 * Regex-based function extraction fallback
 * When all parsers fail, extract function signatures via pattern matching
 * This is a pragmatic fallback for benchmarking purposes
 */

/**
 * Extract function-like nodes via regex patterns
 * Returns synthetic AST-like objects for function nodes found in source
 */
function extractFunctionsViaRegex(source) {
  const nodes = [];
  if (!source || typeof source !== 'string') {
    return nodes;
  }

  // Pattern 1: function declarations - `function name(...) { ... }`
  const functionDeclPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = functionDeclPattern.exec(source)) !== null) {
    nodes.push({
      type: 'FunctionDeclaration',
      id: { name: match[1] },
      params: [],
      body: { body: [] },
      range: [match.index, match.index + match[0].length]
    });
  }

  // Pattern 2: arrow functions - `const x = (...) => { ... }`
  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[\w$]+)\s*=>/g;
  while ((match = arrowPattern.exec(source)) !== null) {
    nodes.push({
      type: 'VariableDeclaration',
      declarations: [{
        id: { name: match[1] },
        init: {
          type: 'ArrowFunctionExpression',
          params: [],
          body: { body: [] }
        }
      }],
      range: [match.index, match.index + match[0].length]
    });
  }

  // Pattern 3: class declarations - `class Name { ... }`
  const classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
  while ((match = classPattern.exec(source)) !== null) {
    nodes.push({
      type: 'ClassDeclaration',
      id: { name: match[1] },
      body: { body: [] },
      range: [match.index, match.index + match[0].length]
    });
  }

  // Pattern 4: methods within class - `.methodName(...) { ... }`
  const methodPattern = /\b(\w+)\s*\([^)]*\)\s*\{/g;
  while ((match = methodPattern.exec(source)) !== null) {
    // Avoid duplicates and filter out keywords
    const methodName = match[1];
    if (!['function', 'if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(methodName)) {
      nodes.push({
        type: 'MethodDefinition',
        key: { name: methodName },
        value: {
          type: 'FunctionExpression',
          params: [],
          body: { body: [] }
        },
        range: [match.index, match.index + match[0].length]
      });
    }
  }

  // Pattern 5: export declarations - `export function x(...) { ... }`
  const exportPattern = /export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)/g;
  while ((match = exportPattern.exec(source)) !== null) {
    nodes.push({
      type: 'ExportNamedDeclaration',
      declaration: {
        id: { name: match[1] }
      },
      range: [match.index, match.index + match[0].length]
    });
  }

  return nodes;
}

// Test on Angular bundle
const fs = require('fs');
const path = require('path');

const file = path.join('node_modules/@angular/core/fesm2022/core.mjs');
const content = fs.readFileSync(file, 'utf-8');
const sliced = content.slice(0, 100000);

console.log('🔍 Testing regex-based function extraction on Angular bundle...\n');

const nodes = extractFunctionsViaRegex(sliced);
console.log(`✅ Extracted ${nodes.length} function-like nodes via regex`);

// Show distribution
const typeCount = {};
nodes.forEach(n => {
  typeCount[n.type] = (typeCount[n.type] || 0) + 1;
});

console.log('\nNode distribution:');
Object.entries(typeCount).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}`);
});

// Show some samples
console.log('\nFirst 10 extracted nodes:');
nodes.slice(0, 10).forEach((n, i) => {
  if (n.id) {
    console.log(`  ${i + 1}. ${n.type}: ${n.id.name}`);
  } else if (n.declarations) {
    console.log(`  ${i + 1}. ${n.type}: ${n.declarations[0].id.name}`);
  } else if (n.key) {
    console.log(`  ${i + 1}. ${n.type}: ${n.key.name}`);
  } else if (n.declaration) {
    console.log(`  ${i + 1}. ${n.type}: ${n.declaration.id?.name || '?'}`);
  } else {
    console.log(`  ${i + 1}. ${n.type}`);
  }
});

console.log('\n✅ Regex extraction test complete');
