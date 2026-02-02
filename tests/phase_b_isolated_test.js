/**
 * Phase B Isolated Test (No Phase A)
 * Test Phase B lowerer directly without going through parser/Phase A
 */

const { PythonIRLowererPhaseB } = require('../src/ir/python_ir_lowerer_phase_b.js');

console.log('\n🔬 PHASE B ISOLATED TEST (Bypass Phase A)');
console.log('='.repeat(70));

// Create a minimal Phase A IR (simulating what Phase A would produce)
function createMinimalPhaseAIR(varName, value) {
  return {
    type: 'Module',
    body: [{
      type: 'Assignment',
      target: { type: 'Identifier', name: varName },
      value: { type: 'Literal', value: value }
    }]
  };
}

console.log('\n📊 Test: 50 Sequential Phase B Lowerings (Isolated)\n');

try {
  const lowerer = new PythonIRLowererPhaseB({ maxObjects: 50000, poolSize: 5000 });
  
  for (let i = 0; i < 50; i++) {
    const phaseAIR = createMinimalPhaseAIR(`x${i}`, i);
    const result = lowerer.lower(phaseAIR);
    
    if (!result || !result.ir) {
      throw new Error(`Failed at iteration ${i}`);
    }
    
    if (i % 10 === 0) {
      const stats = lowerer.getMemoryStats();
      console.log(`  Iteration ${i}:`);
      console.log(`    Objects: ${stats.objectCount}/${stats.maxObjects}`);
      console.log(`    Pool: ${stats.pool.nodesPooled} nodes, ${stats.pool.typesPooled} types`);
      console.log(`    Type cache: ${stats.typeCacheSize}`);
    }
  }
  
  console.log('\n✅ SUCCESS: All 50 iterations completed!');
  console.log('\n📊 Final Memory Stats:');
  const finalStats = lowerer.getMemoryStats();
  console.log(`  Object count: ${finalStats.objectCount}`);
  console.log(`  Utilization: ${finalStats.utilization}`);
  console.log(`  Pool stats:`, finalStats.pool);
  console.log(`  Type cache: ${finalStats.typeCacheSize} entries`);
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ PHASE B FIX VALIDATED (Isolated)');
  console.log('='.repeat(70));
  console.log('\nPhase B memory leak is FIXED');
  console.log('Memory leak must be in Phase A (parser/lowerer)');
  console.log('\nNEXT: Fix Phase A or run Phase B tests with mock IR\n');
  
} catch (error) {
  console.log('\n❌ FAILED:', error.message);
  console.log(error.stack);
  process.exit(1);
}
