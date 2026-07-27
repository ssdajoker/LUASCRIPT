/**
 * Test optimal bundle extraction for all packages
 * Maximize node extraction with best available sources
 */
const fs = require('fs');
const path = require('path');
const esprima = require('esprima');

function resolveFirstExistingFile(candidatePaths) {
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function readPackageSource(packagesPath, candidatePaths) {
  const resolved = resolveFirstExistingFile(candidatePaths.map((p) => path.join(packagesPath, p)));
  if (!resolved) {
    return null;
  }

  try {
    return fs.readFileSync(resolved, 'utf-8');
  } catch (e) {
    console.warn(`⚠️  Failed to read ${resolved}:`, e.message);
    return null;
  }
}

function extractFunctionsViaRegex(source) {
  const nodes = [];
  if (!source || typeof source !== 'string') return nodes;

  const functionDeclPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = functionDeclPattern.exec(source)) !== null) {
    nodes.push({ type: 'FunctionDeclaration', id: { name: match[1] } });
  }

  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[\w$]+)\s*=>/g;
  while ((match = arrowPattern.exec(source)) !== null) {
    nodes.push({ type: 'VariableDeclaration', declarations: [{ id: { name: match[1] } }] });
  }

  const classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
  while ((match = classPattern.exec(source)) !== null) {
    nodes.push({ type: 'ClassDeclaration', id: { name: match[1] } });
  }

  const methodPattern = /\b(\w+)\s*\([^)]*\)\s*\{/g;
  while ((match = methodPattern.exec(source)) !== null) {
    const methodName = match[1];
    if (!['function', 'if', 'for', 'while', 'switch', 'catch'].includes(methodName)) {
      nodes.push({ type: 'MethodDefinition', key: { name: methodName } });
    }
  }

  return nodes;
}

function parseSourceWithFallbacks(source) {
  if (!source || typeof source !== 'string') return null;

  const maxLength = 500000; // Increased for better coverage
  const sliced = source.length > maxLength ? source.slice(0, maxLength) : source;

  try {
    return esprima.parseScript(sliced, { range: true, loc: true, tolerant: true });
  } catch (e) {
    // Continue
  }

  try {
    return esprima.parseModule(sliced, { range: true, loc: true, tolerant: true });
  } catch (e) {
    // Continue
  }

  const regexNodes = extractFunctionsViaRegex(sliced);
  if (regexNodes.length > 0) {
    return { type: 'Program', body: regexNodes, sourceType: 'module' };
  }

  return null;
}

function collectAstNodes(root, collector) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;

    if (node.type === 'FunctionDeclaration' || 
        node.type === 'VariableDeclaration' || 
        node.type === 'ExpressionStatement' ||
        node.type === 'MethodDefinition' ||
        node.type === 'ClassDeclaration') {
      collector.push(node);
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((child) => stack.push(child));
      } else if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }
}

function extractAstNodes(source) {
  if (!source) return [];
  const ast = parseSourceWithFallbacks(source);
  if (!ast || !ast.body) return [];
  
  const nodes = [];
  collectAstNodes(ast, nodes);
  return nodes.slice(0, 500);
}

const packagesPath = path.join(__dirname, '../../node_modules');

console.log('🔍 Testing optimal extraction strategies...\n');

const packages = {
  lodash: [
    'lodash/lodash.js',           // Full unminified
    'lodash/lodash.min.js',
  ],
  express: [
    'express/index.js',           // Main entry
    'express/lib/express.js',     // Unminified main
  ],
  vue: [
    'vue/dist/vue.esm-bundler.js',  // ESM development
    'vue/dist/vue.cjs.js',           // CJS development (not .prod)
    'vue/dist/vue.runtime.esm-bundler.js',
    'vue/dist/vue.runtime.global.js',
  ],
  react: [
    'react/cjs/react.development.js',    // Dev version (not .min)
    'react/cjs/react.production.min.js',
  ],
};

for (const [pkg, candidates] of Object.entries(packages)) {
  const source = readPackageSource(packagesPath, candidates);
  if (!source) {
    console.log(`❌ ${pkg}: NO SOURCE FOUND`);
    continue;
  }

  const nodes = extractAstNodes(source);
  const fileSize = (source.length / 1024).toFixed(1);
  console.log(`✅ ${pkg}: ${nodes.length} nodes (${fileSize}KB source)`);
  
  // Show breakdown
  const typeCount = {};
  nodes.forEach(n => {
    typeCount[n.type] = (typeCount[n.type] || 0) + 1;
  });
  
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });
}

console.log('\n✅ Extraction test complete');
