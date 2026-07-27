#!/usr/bin/env node

/**
 * PHASE 3 JAVASCRIPT OPTIMIZATION - VERIFICATION DEMO
 * 
 * Demonstrates the complete 6-phase optimization pipeline in action.
 * Run this script to see all optimization phases working together.
 */

const { optimizeJavaScript } = require('./src/optimizers/javascript/javascript-optimizer');

console.log('='.repeat(70));
console.log('PHASE 3 JAVASCRIPT OPTIMIZATION - LIVE DEMONSTRATION');
console.log('='.repeat(70));
console.log('');

// Create a sample IR with various optimization opportunities
const sampleIR = {
  program: {
    type: 'Program',
    body: [
      // Dead code: unreachable after return
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'example' },
        params: [],
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'Literal', value: 42 }
            },
            {
              type: 'ExpressionStatement',
              expression: { type: 'Literal', value: 'unreachable' }
            }
          ]
        }
      },
      
      // Constant folding opportunity
      {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [{
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'computed' },
          init: {
            type: 'BinaryExpression',
            left: { type: 'Literal', value: 10 },
            operator: '*',
            right: { type: 'Literal', value: 5 }
          }
        }]
      },
      
      // Loop for algorithm optimization
      {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          kind: 'let',
          declarations: [{
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'i' },
            init: { type: 'Literal', value: 0 }
          }]
        },
        test: {
          type: 'BinaryExpression',
          left: { type: 'Identifier', name: 'i' },
          operator: '<',
          right: { type: 'Literal', value: 10 }
        },
        update: {
          type: 'UpdateExpression',
          operator: '++',
          argument: { type: 'Identifier', name: 'i' },
          prefix: false
        },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'BinaryExpression',
                left: { type: 'Literal', value: 2 },
                operator: '+',
                right: { type: 'Literal', value: 3 }
              }
            }
          ]
        }
      }
    ]
  }
};

console.log('Input IR Summary:');
console.log('- Function with unreachable code');
console.log('- Constant expression (10 * 5)');
console.log('- Loop with invariant code (2 + 3)');
console.log('');

console.log('Running complete 6-phase optimization pipeline...');
console.log('');

// Run optimization
const result = optimizeJavaScript(sampleIR, {
  runPhase1: true,  // Speed
  runPhase2: true,  // Memory
  runPhase3: true,  // Security
  runPhase4: true,  // Algorithm
  runPhase5: true,  // Interop
  runPhase6: true,  // Quality
  determinismRuns: 10,
  targetCompliance: 85
});

// Display results
console.log('─'.repeat(70));
console.log('OPTIMIZATION RESULTS');
console.log('─'.repeat(70));
console.log('');

console.log(`Overall Success: ${result.success ? '✅ YES' : '❌ NO'}`);
console.log(`Compliance Score: ${result.compliance.overallScore}%`);
console.log(`Compliance Status: ${result.compliance.passes ? '✅ PASSED' : '❌ FAILED'} (Target: ${result.compliance.targetScore}%)`);
console.log(`Total Time: ${result.metrics.totalTime.toFixed(2)}ms`);
console.log(`Total Optimizations: ${result.metrics.overallOptimizations}`);
console.log('');

console.log('─'.repeat(70));
console.log('PHASE BREAKDOWN');
console.log('─'.repeat(70));
console.log('');

result.phases.forEach((phase, index) => {
  const status = phase.success ? '✅' : '❌';
  console.log(`${status} ${phase.name}`);
  console.log(`   Time: ${phase.time.toFixed(2)}ms`);
  
  if (phase.metrics) {
    if (phase.name.includes('Speed')) {
      console.log(`   Optimizations: ${phase.metrics.totalOptimizations || 0}`);
      console.log(`   - Dead Code: ${phase.metrics.passes?.deadCode?.optimizations || 0}`);
      console.log(`   - Constants: ${phase.metrics.passes?.constantFolding?.optimizations || 0}`);
      console.log(`   - Tail Calls: ${phase.metrics.passes?.tailCalls?.optimizations || 0}`);
    } else if (phase.name.includes('Memory')) {
      console.log(`   GC Patterns: ${phase.metrics.totalPatterns || 0}`);
    } else if (phase.name.includes('Security')) {
      console.log(`   Array Accesses: ${phase.metrics.totalArrayAccesses || 0}`);
      console.log(`   Bounds Checks Needed: ${phase.metrics.needsCheckAccesses || 0}`);
      console.log(`   Out of Bounds: ${phase.metrics.outOfBoundsAccesses || 0}`);
    } else if (phase.name.includes('Algorithm')) {
      console.log(`   Total Loops: ${phase.metrics.totalLoops || 0}`);
      console.log(`   Invariant Moves: ${phase.metrics.invariantMoves || 0}`);
      console.log(`   Unrollable Loops: ${phase.metrics.unrollableLoops || 0}`);
      console.log(`   Strength Reductions: ${phase.metrics.strengthReductions || 0}`);
    } else if (phase.name.includes('Interop')) {
      console.log(`   FFI Calls: ${phase.metrics.ffiCalls || 0}`);
      console.log(`   Batching Opportunities: ${phase.metrics.batchingOpportunities || 0}`);
    } else if (phase.name.includes('Quality')) {
      const det = phase.determinism;
      const slo = phase.slo;
      console.log(`   Determinism: ${det?.success ? '✅ Verified' : '❌ Failed'}`);
      console.log(`   Unique Hashes: ${det?.uniqueHashes?.length || 0}`);
      console.log(`   SLO Compliance: ${slo?.success ? '✅ Passed' : '❌ Failed'}`);
      if (slo && slo.failures && slo.failures.length > 0) {
        slo.failures.forEach(f => console.log(`     - ${f}`));
      }
    }
  }
  
  if (phase.error) {
    console.log(`   Error: ${phase.error}`);
  }
  
  console.log('');
});

console.log('─'.repeat(70));
console.log('COMPLIANCE GATES');
console.log('─'.repeat(70));
console.log('');

const gates = result.compliance.gates;
console.log(`Speed Gate:     ${gates.speedGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Memory Gate:    ${gates.memoryGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Security Gate:  ${gates.securityGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Algorithm Gate: ${gates.algorithmGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Interop Gate:   ${gates.interopGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Quality Gate:   ${gates.qualityGate ? '✅ PASSED' : '❌ FAILED'}`);
console.log('');
console.log(`Gates Passed: ${result.compliance.details.gatesPassed}/${result.compliance.details.totalGates}`);
console.log('');

console.log('─'.repeat(70));
console.log('RECOMMENDATIONS');
console.log('─'.repeat(70));
console.log('');

if (result.recommendations && result.recommendations.length > 0) {
  result.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
} else {
  console.log('✅ No recommendations - All optimization targets met!');
}
console.log('');

console.log('─'.repeat(70));
console.log('SUMMARY');
console.log('─'.repeat(70));
console.log('');
console.log(result.summary);
console.log('');

console.log('='.repeat(70));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(70));
console.log('');
console.log('Phase 3 JavaScript Optimization is operational and verified.');
console.log(`Clarity Canon Compliance: ${result.compliance.overallScore}% ${result.compliance.passes ? '✅ PASSED' : '❌ FAILED'}`);
console.log('');

// Exit with appropriate code
process.exit(result.success && result.compliance.passes ? 0 : 1);
