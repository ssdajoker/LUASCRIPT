#!/usr/bin/env node

/**
 * ⚔️ PHASE 5.1 STANDALONE TEST RUNNER
 * 
 * Manual execution for CLARITY SUPER CANON comprehensive validation
 * This script loads and executes all 51 unit tests with forensic reporting
 * 
 * Usage: node execute_phase5_standalone.js
 */

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  ⚔️  PHASE 5.1: CLARITY SUPER CANON UNIT TESTS           ║');
console.log('║                                                           ║');
console.log('║  Type System Hardening Validation                         ║');
console.log('║  IR Builder & Async Function Verification                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Safely require test suite
try {
  console.log('📋 Loading test suite...\n');
  
  // Load the comprehensive test file
  const testFile = './tests/clarity_super_canon_phase5_unit_tests.js';
  require(testFile);
  
  console.log('\n✅ All tests completed. Review above for detailed results.\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Test Execution Complete - See results above             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
} catch (error) {
  console.error('\n❌ Test Execution Error:\n');
  console.error(`   Message: ${error.message}`);
  console.error(`   File:    ${error.stack?.split('\n')[1] || 'Unknown'}`);
  console.error('\n📍 Troubleshooting:');
  console.error('   1. Verify test file exists: tests/clarity_super_canon_phase5_unit_tests.js');
  console.error('   2. Check IR system files loaded correctly');
  console.error('   3. Verify all dependencies available\n');
  process.exit(1);
}
