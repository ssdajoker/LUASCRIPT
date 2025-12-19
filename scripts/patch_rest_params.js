#!/usr/bin/env node
/**
 * Patch parseParameterList to support rest parameters
 */

const fs = require('fs');
const path = require('path');

const PARSER_PATH = path.join(__dirname, '../src/phase1_core_parser.js');

function main() {
  console.log('🔧 Patching parseParameterList for rest parameters...\n');

  let content = fs.readFileSync(PARSER_PATH, 'utf8');

  if (content.includes('// Rest parameter support')) {
    console.log('✅ Already patched!\n');
    return;
  }

  const oldMethod = `    parseParameterList() {
        const params = [];
        
        if (!this.check('RIGHT_PAREN')) {
            do {
                params.push(this.parseBindingPattern({ allowDefault: true }));
            } while (this.match('COMMA'));
        }
        
        return params;
    }`;

  const newMethod = `    parseParameterList() {
        const params = [];
        
        if (!this.check('RIGHT_PAREN')) {
            do {
                // Rest parameter support: ...rest
                if (this.match('SPREAD')) {
                    const arg = this.parseBindingPattern({ allowDefault: false });
                    params.push(new RestElementNode(arg, { line: arg.line, column: arg.column }));
                    break; // Rest must be last
                } else {
                    params.push(this.parseBindingPattern({ allowDefault: true }));
                }
            } while (this.match('COMMA'));
        }
        
        return params;
    }`;

  if (!content.includes(oldMethod)) {
    console.error('❌ Could not find parseParameterList method');
    process.exit(1);
  }

  content = content.replace(oldMethod, newMethod);
  fs.writeFileSync(PARSER_PATH, content);

  console.log('✅ Patched successfully!');
  console.log('💡 Rest parameters now supported: function f(a, b, ...rest) {}\n');
}

main();
