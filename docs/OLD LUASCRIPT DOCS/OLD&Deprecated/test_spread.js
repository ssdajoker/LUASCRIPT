// Quick test for spread operator
const { parseAndLower } = require('./src/ir/pipeline');
const { emitLuaFromIR } = require('./src/ir/emitter');

const source = 'const arr = [1, ...[2, 3], 4];';
console.log('Source:', source);

try {
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  console.log('\nGenerated Lua:');
  console.log(lua);
  console.log('\nIR nodes (first 3):');
  const nodeIds = Object.keys(ir.nodes).slice(0, 5);
  nodeIds.forEach(id => {
    const node = ir.nodes[id];
    console.log(`  ${id}: ${node.kind}`, node.hasSpread ? '(hasSpread)' : '');
  });
} catch (err) {
  console.error('Error:', err.message);
}
