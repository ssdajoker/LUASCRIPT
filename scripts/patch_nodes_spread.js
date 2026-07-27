#!/usr/bin/env node
/**
 * Patch to preserve spread metadata in ArrayExpression nodes
 */

const fs = require('fs');
const path = require('path');

const NODES_PATH = path.join(__dirname, '../src/ir/nodes.js');

function main() {
  console.log('🔧 Patching IR nodes to preserve spread metadata...\n');

  let content = fs.readFileSync(NODES_PATH, 'utf8');

  if (content.includes('hasSpread: Boolean(options.hasSpread)')) {
    console.log('✅ Already patched!\n');
    return;
  }

  const oldMethod = `  createArrayExpression(elementRefs, options = {}) {
    return this.createNode("ArrayExpression", {
      elements: elementRefs,
      span: options.span || null,
      meta: options.meta || {},
    });
  }`;

  const newMethod = `  createArrayExpression(elementRefs, options = {}) {
    return this.createNode("ArrayExpression", {
      elements: elementRefs,
      hasSpread: Boolean(options.hasSpread),
      spreadElements: options.spreadElements || null,
      span: options.span || null,
      meta: options.meta || {},
    });
  }`;

  if (!content.includes(oldMethod)) {
    console.error('❌ Could not find createArrayExpression method');
    process.exit(1);
  }

  fs.writeFileSync(NODES_PATH + '.backup', content);
  content = content.replace(oldMethod, newMethod);
  fs.writeFileSync(NODES_PATH, content);

  console.log('✅ Patched successfully!');
  console.log('📦 Backup: src/ir/nodes.js.backup\n');
}

main();
