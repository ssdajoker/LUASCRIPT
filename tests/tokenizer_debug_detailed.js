// Debug base_parser tokenizer
const { PHPParser } = require('../src/parsers/php_parser');

const parser = new PHPParser('<?php');

// Override tokenizeC_Family to add logging
const original = parser.tokenizeC_Family.bind(parser);
parser.tokenizeC_Family = function(keywords, operators) {
  const tokens = [];
  let iterations = 0;
  
  while (this.pos < this.source.length && iterations < 10) {
    iterations++;
    this.skipWhitespace();
    if (this.pos >= this.source.length) break;

    const char = this.source[this.pos];
    console.log(`\nIteration ${iterations}:`);
    console.log(`  pos: ${this.pos}`);
    console.log(`  char: "${char}" (code ${char.charCodeAt(0)})`);
    console.log(`  next char: "${this.source[this.pos+1] || 'EOF'}"`);
    
    const twoChar = this.source.substr(this.pos, 2);
    const threeChar = this.source.substr(this.pos, 3);
    
    console.log(`  twoChar: "${twoChar}"`);
    console.log(`  threeChar: "${threeChar}"`);
    console.log(`  operators: [${operators.join(', ')}]`);
    console.log(`  operators.includes(threeChar): ${operators.includes(threeChar)}`);
    console.log(`  operators.includes(twoChar): ${operators.includes(twoChar)}`);
    console.log(`  /[{}()[\\];,.]/.test(char): ${/[{}()[\];,.]/.test(char)}`);
    console.log(`  /[+\\-*/%&|^<>=!?:]/.test(char): ${/[+\-*/%&|^<>=!?:]/.test(char)}`);
    
    // Break to prevent infinite loop
    break;
  }
  
  return tokens;
};

try {
  parser.tokenize();
} catch (error) {
  console.log('\nError:', error.message);
}
