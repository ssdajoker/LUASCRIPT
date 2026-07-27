/**
 * FORENSIC DEBUG - Gleam Parser Hang Analysis
 * Deep instrumentation to identify infinite loop location
 */

const GleamTokenizerExtended = require('./src/tokenizers/gleam_tokenizer_extended');
const GleamParserExtended = require('./src/parsers/gleam_parser_extended');

// Patch parser with logging
const OriginalParser = GleamParserExtended.prototype.parse;
const OriginalAdvance = GleamParserExtended.prototype.advance;
const OriginalCurrent = GleamParserExtended.prototype.current;

let callDepth = 0;
let iterationCount = 0;
const maxIterations = 1000;

GleamParserExtended.prototype.parse = function(tokens) {
  console.log('[PARSE START]');
  callDepth++;
  iterationCount = 0;
  return OriginalParser.call(this, tokens);
};

GleamParserExtended.prototype.advance = function() {
  iterationCount++;
  if (iterationCount % 50 === 0) {
    console.log(`  [ADVANCE] iterations=${iterationCount}, pos=${this.pos}/${this.tokens.length}`);
  }
  if (iterationCount > maxIterations) {
    throw new Error(`INFINITE LOOP DETECTED: ${maxIterations}+ iterations!`);
  }
  OriginalAdvance.call(this);
};

const gleamCode = `
pub type Result(a, b) {
  Ok(a)
  Error(b)
}

pub type Bool {
  True
  False
}
`;

console.log('='.repeat(60));
console.log('TEST 2: Public Type with Variants');
console.log('='.repeat(60));
console.log('Code:');
console.log(gleamCode);
console.log('-'.repeat(60));

try {
  console.log('STEP 1: Creating tokenizer...');
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  
  console.log('STEP 2: Tokenizing...');
  const tokens = tokenizer.tokenize();
  console.log(`✓ Got ${tokens.length} tokens:`);
  tokens.forEach((t, i) => {
    if (i < 20 || i >= tokens.length - 5) {
      console.log(`  [${i}] ${t.type.padEnd(12)} "${t.value}"`);
    } else if (i === 20) {
      console.log(`  ... (${tokens.length - 25} more tokens) ...`);
    }
  });
  
  console.log('STEP 3: Creating parser...');
  const parser = new GleamParserExtended(gleamCode);
  
  console.log('STEP 4: Parsing tokens...');
  const ast = parser.parse(tokens);
  
  console.log('✓ Parse complete!');
  console.log(`  ast.publicTypes.length = ${ast.publicTypes.length}`);
  ast.publicTypes.forEach((t, i) => {
    console.log(`    [${i}] ${t.name} with ${t.variants.length} variants`);
  });
  
} catch (error) {
  console.error('✗ ERROR:', error.message);
  console.error('  Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
}

console.log('='.repeat(60));
