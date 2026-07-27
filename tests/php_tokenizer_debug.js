/**
 * Simple PHP Tokenizer Debug Test
 */

const { PHPParser } = require('../src/parsers/php_parser');

console.log('\n🔍 PHP TOKENIZER DEBUG TEST\n');

const simpleCode = '<?php echo "test"; ?>';

console.log('Input code:', simpleCode);
console.log('\nTokenizing...\n');

try {
    const parser = new PHPParser(simpleCode);
    const tokens = parser.tokenize();
    
    console.log(`Token count: ${tokens.length}`);
    console.log('\nTokens:');
    tokens.slice(0, 20).forEach((token, i) => {
        console.log(`  ${i}: ${token.type} = "${token.value}"`);
    });
    
    if (tokens.length > 20) {
        console.log(`  ... and ${tokens.length - 20} more tokens`);
    }
    
    if (tokens.length > 1000) {
        console.log('\n⚠️  WARNING: Token count exceeds 1000 - likely infinite tokenization loop!');
    }
} catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    console.log(error.stack);
}

console.log('\n✅ Tokenizer test complete\n');
