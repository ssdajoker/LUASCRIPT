#!/usr/bin/env node
/**
 * Patch lowerer to support rest parameters in function declarations
 */

const fs = require('fs');
const path = require('path');

const LOWERER_PATH = path.join(__dirname, '../src/ir/lowerer.js');

function main() {
  console.log('🔧 Patching lowerer for rest parameter support...\n');

  let content = fs.readFileSync(LOWERER_PATH, 'utf8');

  if (content.includes('// Rest parameter handling')) {
    console.log('✅ Already patched!\n');
    return;
  }

  const oldCode = `  lowerFunctionDeclaration(node, { pushToBody }) {
    const idNode = this.lowerIdentifier(node.id, { binding: node.id?.name });
    const params = (node.params || []).map((param) =>
      this.lowerIdentifier(param, { binding: param.name }).id
    );`;

  const newCode = `  lowerFunctionDeclaration(node, { pushToBody }) {
    const idNode = this.lowerIdentifier(node.id, { binding: node.id?.name });
    
    // Rest parameter handling: function f(a, ...rest)
    const params = [];
    let hasRest = false;
    let restParamId = null;
    
    for (const param of node.params || []) {
      if (param.type === 'RestElement') {
        hasRest = true;
        restParamId = this.lowerIdentifier(param.argument, { binding: param.argument.name }).id;
        // Rest params are handled via {...} in Lua function body
        break;
      } else if (param.type === 'Identifier') {
        params.push(this.lowerIdentifier(param, { binding: param.name }).id);
      } else {
        // Handle destructuring params if needed
        params.push(this.lowerIdentifier(param, { binding: param.name }).id);
      }
    }`;

  if (!content.includes(oldCode)) {
    console.error('❌ Could not find lowerFunctionDeclaration method');
    console.error('   Code structure may have changed');
    process.exit(1);
  }

  content = content.replace(oldCode, newCode);
  
  // Now we need to inject rest param assignment into function body
  const bodyLoweringMarker = `const bodyBlock = this.lowerBlockStatement(
      this.normalizeBlockForFunction(node.body)
    );`;
  
  const newBodyLowering = `const bodyBlock = this.lowerBlockStatement(
      this.normalizeBlockForFunction(node.body)
    );
    
    // If rest parameter, prepend assignment: local rest = {...}
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

  content = content.replace(bodyLoweringMarker, newBodyLowering);

  fs.writeFileSync(LOWERER_PATH, content);
  console.log('✅ Patched successfully!');
  console.log('💡 Rest parameters in functions now lower to Lua {...}\n');
}

main();
