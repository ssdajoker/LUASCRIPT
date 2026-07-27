/**
 * FORENSIC - Simple token trace
 */

const GleamTokenizerExtended = require('./src/tokenizers/gleam_tokenizer_extended');

const gleamCode = `pub type Result(a, b) { Ok(a) Error(b) }`;

console.log('Code: ' + gleamCode);
console.log('\n');

const tokenizer = new GleamTokenizerExtended(gleamCode);
const tokens = tokenizer.tokenize();

console.log(`Total tokens: ${tokens.length}`);
console.log('\nToken sequence:');
tokens.forEach((t, i) => {
  console.log(`[${i.toString().padStart(2)}] ${t.type.padEnd(12)} = "${t.value}"`);
});

console.log('\n\nManual parsing simulation:');
let pos = 0;

const current = () => tokens[pos];
const peek = (offset) => tokens[pos + offset];
const advance = () => { pos++; };

console.log(`[pos=${pos}] token="${current().value}"`);

if (current().value === 'pub' && peek(1) && peek(1).value === 'type') {
  console.log('→ Matched: pub type');
  advance();
  advance();
  console.log(`[pos=${pos}] token="${current().value}" (type name)`);
  const name = current().value;
  console.log(`→ Type name: ${name}`);
  advance();
  
  // Type params
  if (current() && current().value === '(') {
    console.log(`[pos=${pos}] Found '('`);
    advance();
    while (current() && current().value !== ')') {
      if (current().type === 'Identifier') {
        console.log(`  → param: ${current().value}`);
      }
      advance();
    }
    if (current() && current().value === ')') {
      console.log(`[pos=${pos}] Found ')'`);
      advance();
    }
  }
  
  // Variants
  if (current() && current().value === '{') {
    console.log(`[pos=${pos}] Found '{'`);
    advance();
    
    let varCount = 0;
    while (current() && current().value !== '}' && varCount < 50) {
      varCount++;
      console.log(`  [pos=${pos}] token="${current().value}" type=${current().type}`);
      
      if ((current().type === 'Identifier' || 
           (current().type === 'Keyword' && !['pub','type','fn'].includes(current().value)))) {
        console.log(`    → variant: ${current().value}`);
        advance();
        
        if (current() && current().value === '(') {
          console.log(`    → variant has fields`);
          advance();
          while (current() && current().value !== ')') {
            console.log(`      → field: ${current().value}`);
            advance();
          }
          if (current() && current().value === ')') {
            advance();
          }
        }
      } else {
        console.log(`    → skip token`);
        advance();
      }
    }
    
    if (varCount >= 50) {
      console.log('WARNING: Loop limit hit');
    }
  }
}

console.log('\nDone');
