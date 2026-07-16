const {LuaScriptLexer} = require('./src/phase1_core_lexer');
const {LuaScriptParser} = require('./src/phase1_core_parser');
const code = "const s = `tick \\` tock`;";
console.log('code literal:', code);
console.log('code chars:', Array.from(code).map(ch => ch + '(' + ch.charCodeAt(0) + ')').join(' '));
console.log('json string:', JSON.stringify(code));
const lexer = new LuaScriptLexer(code);
const tokens = lexer.tokenize();
console.log('tokens', tokens.map(t => t.type + ':' + t.value).join('\n'));
console.log('lexerErrors', lexer.getErrors());
const ast = new LuaScriptParser(code).parse();
console.log('parserErrors', ast.errors);
const hasErrorNode = (() => {
  const seen = new WeakSet();
  let found = false;
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node) || found) return;
    seen.add(node);
    if (node.type === 'Error') { found = true; return; }
    Object.values(node).forEach(v => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    });
  })(ast);
  return found;
})();
console.log('hasErrorNode', hasErrorNode);
