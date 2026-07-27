/**
 * PHASE 5.1 TEST RUNNER - Standalone execution wrapper
 * Can be executed with: node run_phase5_test_standalone.js
 */

const fs = require('fs');
const path = require('path');

// Load test file
const testFilePath = path.join(__dirname, 'clarity_super_canon_phase5_unit_tests.js');

console.log('='.repeat(95));
console.log('PHASE 5.1: COMPREHENSIVE UNIT TESTING');
console.log('='.repeat(95));
console.log('');

try {
  // Execute test file
  require(testFilePath);
  
  console.log('');
  console.log('='.repeat(95));
  console.log('TEST EXECUTION COMPLETED SUCCESSFULLY');
  console.log('='.repeat(95));
} catch (error) {
  console.error('TEST EXECUTION FAILED:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
