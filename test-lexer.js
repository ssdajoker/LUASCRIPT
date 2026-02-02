const { LuaScriptLexer } = require('./src/phase1_core_lexer');

const js = `const add = function(a, b) {
    return a + b;
};`;

console.log('Input:');
console.log(js);
console.log('\n=== TOKENS ===\n');

const lexer = new LuaScriptLexer(js);
const tokens = lexer.tokenize();

tokens.forEach((token, i) => {
  console.log(`${i}: ${token.type.padEnd(20)} ${JSON.stringify(token.value).padEnd(20)} line:${token.line} col:${token.column}`);
});
