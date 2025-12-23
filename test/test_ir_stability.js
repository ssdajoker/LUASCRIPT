
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const { IRBuilder } = require('../src/ir/builder');
const { IRValidator } = require('../src/ir/validator');
const assert = require('assert');

// Mock AST nodes
const mockProgram = {
  type: 'Program',
  body: [
    {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: 'test' },
      params: [],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Literal',
              value: 'Hello'
            }
          }
        ]
      }
    }
  ]
};

console.log('🧪 Testing IR Stability...');

// 1. Test Builder Consistency
const builder = new IRBuilder();
const lowerer = new EnhancedLowerer(builder);

try {
  const ir = lowerer.lower(mockProgram);
  console.log('✅ IR Lowering successful');

  // 2. Test Validator Hardening
  const validator = new IRValidator();
  const validationResult = validator.validate(ir);

  // Note: ir is the IR *artifact* (with module, nodes), validator expects a *node* or handles the artifact?
  // EnhancedLowerer.lower returns `this.builder.program(body)`. This returns the Program NODE.
  // Wait, builder.program returns `this._storeNode(...)`.
  // Lowerer calls `this.builder.program(body)`.
  // So `ir` is a NODE.

  if (validationResult.valid) {
    console.log('✅ IR Validation successful');
  } else {
    console.error('❌ IR Validation failed:', validationResult.errors);
    process.exit(1);
  }

  // 3. Test New Builder Methods
  const testNodeId = builder.forOfStatement(
      builder.identifier('x'),
      builder.identifier('y'),
      builder.block([])
  ).id;

  if (builder.nodes[testNodeId].kind === 'ForOfStatement') {
      console.log('✅ New Builder Method (forOfStatement) verified');
  } else {
      console.error('❌ New Builder Method failed');
      process.exit(1);
  }

} catch (e) {
  console.error('❌ Test crashed:', e);
  process.exit(1);
}
