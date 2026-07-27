#!/usr/bin/env node
/**
 * Patch script to add SpreadElement support to parser
 * Adds SpreadElementNode class and parsing logic for spread in arrays
 */

const fs = require('fs');
const path = require('path');

const AST_PATH = path.join(__dirname, '../src/phase1_core_ast.js');
const PARSER_PATH = path.join(__dirname, '../src/phase1_core_parser.js');

function patchAstNodes() {
  console.log('📝 Patching AST nodes...');
  let content = fs.readFileSync(AST_PATH, 'utf8');

  if (content.includes('class SpreadElementNode')) {
    console.log('   ✓ SpreadElementNode already exists');
    return false;
  }

  // Add SpreadElementNode after RestElementNode
  const insertPoint = content.indexOf('/** Represents an assignment pattern');
  if (insertPoint === -1) {
    console.error('   ❌ Could not find insertion point');
    return false;
  }

  const spreadNode = `
/** Represents a spread element in array expressions. */
class SpreadElementNode extends ASTNode {
    constructor(argument, properties = {}) {
        super('SpreadElement', properties);
        this.argument = argument;
        if (argument) this.addChild(argument);
    }
}

`;

  content = content.slice(0, insertPoint) + spreadNode + content.slice(insertPoint);

  // Add to exports
  const exportsMatch = content.match(/(module\.exports = \{[^}]*RestElementNode,)/);
  if (exportsMatch) {
    content = content.replace(exportsMatch[1], exportsMatch[1] + '\n    SpreadElementNode,');
  }

  fs.writeFileSync(AST_PATH + '.backup', fs.readFileSync(AST_PATH));
  fs.writeFileSync(AST_PATH, content);
  console.log('   ✓ Added SpreadElementNode class');
  return true;
}

function patchParser() {
  console.log('📝 Patching parser...');
  let content = fs.readFileSync(PARSER_PATH, 'utf8');

  if (content.includes('SpreadElementNode')) {
    console.log('   ✓ Parser already imports SpreadElementNode');
    return false;
  }

  // Add SpreadElementNode to imports
  const importMatch = content.match(/(RestElementNode,)/);
  if (importMatch) {
    content = content.replace(importMatch[1], importMatch[1] + ' SpreadElementNode,');
  }

  // Update parseArrayExpression to handle spread
  const oldArrayParse = `    parseArrayExpression() {
        const elements = [];
        
        if (!this.check('RIGHT_BRACKET')) {
            do {
                if (this.check('COMMA')) {
                    // Sparse array element
                    elements.push(null);
                } else {
                    elements.push(this.parseAssignmentExpression());
                }
            } while (this.match('COMMA'));
        }
        
        this.consume('RIGHT_BRACKET', "Expected ']' after array elements");
        
        return new ArrayExpressionNode(elements, {
            line: this.previous().line,
            column: this.previous().column
        });
    }`;

  const newArrayParse = `    parseArrayExpression() {
        const elements = [];
        
        if (!this.check('RIGHT_BRACKET')) {
            do {
                if (this.check('COMMA')) {
                    // Sparse array element
                    elements.push(null);
                } else if (this.match('SPREAD')) {
                    // Spread element: ...expr
                    const arg = this.parseAssignmentExpression();
                    elements.push(new SpreadElementNode(arg, {
                        line: this.previous().line,
                        column: this.previous().column
                    }));
                } else {
                    elements.push(this.parseAssignmentExpression());
                }
            } while (this.match('COMMA'));
        }
        
        this.consume('RIGHT_BRACKET', "Expected ']' after array elements");
        
        return new ArrayExpressionNode(elements, {
            line: this.previous().line,
            column: this.previous().column
        });
    }`;

  if (!content.includes(oldArrayParse)) {
    console.error('   ❌ Could not find parseArrayExpression method');
    return false;
  }

  content = content.replace(oldArrayParse, newArrayParse);

  fs.writeFileSync(PARSER_PATH + '.backup', fs.readFileSync(PARSER_PATH));
  fs.writeFileSync(PARSER_PATH, content);
  console.log('   ✓ Updated parseArrayExpression to handle spread');
  return true;
}

function main() {
  console.log('🔧 Adding SpreadElement support to parser...\n');

  const astPatched = patchAstNodes();
  const parserPatched = patchParser();

  if (!astPatched && !parserPatched) {
    console.log('\n✅ All patches already applied!\n');
    return;
  }

  console.log('\n✅ SpreadElement support added successfully!\n');
  console.log('📋 Backups created:');
  if (astPatched) console.log('   - src/phase1_core_ast.js.backup');
  if (parserPatched) console.log('   - src/phase1_core_parser.js.backup');
  console.log('\n💡 Next: npm run harness\n');
}

main();
