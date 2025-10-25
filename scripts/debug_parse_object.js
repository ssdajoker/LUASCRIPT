const { LuaScriptParser } = require('../src/phase1_core_parser');
const { LuaScriptLexer } = require('../src/phase1_core_lexer');
const { normalizeProgram } = require('../src/ir/normalizer');

const src = 'const obj={a:1,b:2};';
const lexer = new LuaScriptLexer(src, {});
const parser = new LuaScriptParser(src, {});
const ast = parser.parse();
function hasErrorNode(n) {
  if (!n) return false;
  if (n.type === 'Error') return true;
  if (Array.isArray(n.body)) return n.body.some(hasErrorNode);
  if (n.children) return n.children.some(hasErrorNode);
  return false;
}
console.log('AST has Error?', hasErrorNode(ast));
const norm = normalizeProgram(ast);
function listTypes(n, out=[]) {
  if (!n) return out;
  if (typeof n === 'object' && n.type) out.push(n.type);
  for (const k in n) {
    if (k === 'type') continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach(x => listTypes(x, out)); else if (v && typeof v === 'object') listTypes(v, out);
  }
  return out;
}
console.log('Normalized types:', listTypes(norm).filter((x,i,a)=>a.indexOf(x)===i).join(','));
console.log(JSON.stringify(norm, null, 2));
