#!/usr/bin/env node
/**
 * Fix rest parameter patch to use correct node access
 */

const fs = require('fs');
const path = require('path');

const LOWERER_PATH = path.join(__dirname, '../src/ir/lowerer.js');

function main() {
  console.log('🔧 Fixing rest parameter node access...\n');

  let content = fs.readFileSync(LOWERER_PATH, 'utf8');

  const oldCode = `    // If rest parameter, prepend assignment: local rest = {...}
    if (hasRest && restParamId) {
      const restIdentifier = this.builder.identifier('...');
      const restTable = this.builder.arrayExpression([restIdentifier.id]).id;
      const restDecl = this.builder.variableDeclarator(restParamId, restTable, { kind: 'local' });
      const restStmt = this.builder.variableDeclaration([restDecl], { kind: 'local' });
      // Prepend to body statements
      const bodyNode = this.builder.getNode(bodyBlock);
      if (bodyNode && bodyNode.body) {
        bodyNode.body = [restStmt.id, ...bodyNode.body];
      }
    }`;

  const newCode = `    // If rest parameter, prepend assignment: local rest = {...}
    if (hasRest && restParamId) {
      const restIdentifier = this.builder.identifier('...');
      const restTable = this.builder.arrayExpression([restIdentifier.id]).id;
      const restDecl = this.builder.variableDeclarator(restParamId, restTable, { kind: 'local' });
      const restStmt = this.builder.variableDeclaration([restDecl], { kind: 'local' });
      // Prepend to body statements
      const bodyNode = this.builder.module.nodes[bodyBlock];
      if (bodyNode && bodyNode.body) {
        bodyNode.body = [restStmt.id, ...bodyNode.body];
      }
    }`;

  if (!content.includes(oldCode)) {
    console.error('❌ Could not find code to fix');
    process.exit(1);
  }

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(LOWERER_PATH, content);

  console.log('✅ Fixed successfully!\n');
}

main();
