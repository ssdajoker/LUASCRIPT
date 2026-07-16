/**
 * FORENSIC DEBUG - Gleam Public Type Parsing Detail
 * Step through parsePublicType with full instrumentation
 */

const GleamTokenizerExtended = require('./src/tokenizers/gleam_tokenizer_extended');

// Create a custom parser with detailed logging
class GleamParserDebug {
  constructor(code = '') {
    this.code = code;
    this.tokenizer = new GleamTokenizerExtended(code);
    this.tokens = [];
    this.pos = 0;
    this.depth = 0;
  }
  
  log(msg) {
    console.log('  '.repeat(this.depth) + msg);
  }
  
  current() {
    const t = this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    if (t) this.log(`[current] pos=${this.pos}: ${t.type} "${t.value}"`);
    return t;
  }
  
  peek(offset = 1) {
    return this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
  }
  
  advance() {
    this.log(`[advance] ${this.pos} -> ${this.pos + 1}`);
    this.pos++;
  }
  
  parse(tokens = null) {
    this.tokens = tokens || this.tokenizer.tokenize();
    this.pos = 0;
    
    this.log(`[parse] Starting with ${this.tokens.length} tokens`);
    this.depth++;
    
    const ast = {
      publicTypes: []
    };
    
    while (this.pos < this.tokens.length) {
      this.log(`[parse loop] pos=${this.pos}`);
      const token = this.current();
      
      if (!token) {
        this.log(`[parse] No token at pos ${this.pos}`);
        break;
      }
      
      if (token.value === 'pub' && this.peek(1) && this.peek(1).value === 'type') {
        this.log(`[parse] Found pub type`);
        const publicType = this.parsePublicType();
        if (publicType) {
          ast.publicTypes.push(publicType);
          this.log(`[parse] Added type: ${publicType.name}`);
        }
        continue;
      }
      
      this.log(`[parse] Advancing (not pub type)`);
      this.advance();
    }
    
    this.depth--;
    return ast;
  }
  
  parsePublicType() {
    this.depth++;
    this.log(`[parsePublicType START] pos=${this.pos}`);
    
    const typeNode = {
      type: 'PublicType',
      name: '',
      typeParams: [],
      variants: []
    };
    
    this.log(`[parsePublicType] Skipping 'pub'`);
    this.advance(); // skip 'pub'
    
    this.log(`[parsePublicType] Skipping 'type'`);
    this.advance(); // skip 'type'
    
    // Type name
    this.log(`[parsePublicType] Getting type name`);
    if (this.current()) {
      typeNode.name = this.current().value;
      this.log(`[parsePublicType] name = ${typeNode.name}`);
      this.advance();
    }
    
    // Type parameters in parentheses
    this.log(`[parsePublicType] Checking for type params`);
    if (this.current() && this.current().value === '(') {
      this.log(`[parsePublicType] Found '(' - parsing type params`);
      this.advance();
      
      const paramLoop = 0;
      while (this.current() && this.current().value !== ')') {
        if (this.current().type === 'Identifier') {
          typeNode.typeParams.push(this.current().value);
          this.log(`[parsePublicType] param: ${this.current().value}`);
        }
        this.advance();
      }
      
      if (this.current() && this.current().value === ')') {
        this.log(`[parsePublicType] Closing ')'`);
        this.advance();
      }
    }
    
    // Variants
    this.log(`[parsePublicType] Checking for variants`);
    if (this.current() && this.current().value === '{') {
      this.log(`[parsePublicType] Found '{' - parsing variants`);
      this.advance();
      
      let variantLoop = 0;
      while (this.current() && this.current().value !== '}' && variantLoop < 100) {
        variantLoop++;
        this.log(`[parsePublicType] variant loop ${variantLoop}: pos=${this.pos}, token="${this.current().value}"`);
        
        if (this.current().type === 'Identifier' || 
            (this.current().type === 'Keyword' && !['pub', 'type', 'fn'].includes(this.current().value))) {
          
          const variant = {
            name: this.current().value,
            fields: []
          };
          this.log(`[parsePublicType] variant name: ${variant.name}`);
          this.advance();
          
          // Parse variant fields in parentheses
          if (this.current() && this.current().value === '(') {
            this.log(`[parsePublicType] variant has fields`);
            this.advance();
            
            let fieldLoop = 0;
            while (this.current() && this.current().value !== ')' && fieldLoop < 100) {
              fieldLoop++;
              this.log(`[parsePublicType]   field loop ${fieldLoop}: "${this.current().value}"`);
              
              if (this.current().type === 'Identifier') {
                variant.fields.push(this.current().value);
                this.log(`[parsePublicType]   field: ${this.current().value}`);
              }
              this.advance();
            }
            
            if (this.current() && this.current().value === ')') {
              this.log(`[parsePublicType] closing variant fields`);
              this.advance();
            }
          }
          
          typeNode.variants.push(variant);
          this.log(`[parsePublicType] added variant: ${variant.name}`);
        } else {
          this.log(`[parsePublicType] skipping token: ${this.current().value}`);
          this.advance();
        }
      }
      
      if (variantLoop >= 100) {
        this.log(`[parsePublicType] WARNING: variant loop limit hit!`);
      }
      
      if (this.current() && this.current().value === '}') {
        this.log(`[parsePublicType] Closing '}'`);
        this.advance();
      }
    }
    
    this.log(`[parsePublicType END] name=${typeNode.name}, variants=${typeNode.variants.length}`);
    this.depth--;
    return typeNode;
  }
}

const gleamCode = `
pub type Result(a, b) {
  Ok(a)
  Error(b)
}
`;

console.log('='.repeat(70));
console.log('DETAILED PARSE TRACE');
console.log('='.repeat(70));

const parser = new GleamParserDebug(gleamCode);
const ast = parser.parse();

console.log('='.repeat(70));
console.log('RESULTS:');
console.log(JSON.stringify(ast, null, 2));
