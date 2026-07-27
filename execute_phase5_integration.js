#!/usr/bin/env node

/**
 * PHASE 5.2 Integration Test Executor
 * 
 * Executes comprehensive integration tests for PHASE 4.1 type system
 * integration with parser, scope manager, and other components.
 */

"use strict";

console.log("\n🚀 Starting PHASE 5.2: Integration Tests\n");
console.log("═══════════════════════════════════════════════════════════════════\n");

// Execute the integration test suite
try {
  require("./tests/clarity_super_canon_phase5_integration_tests.js");
} catch (error) {
  console.error("Fatal error executing integration tests:");
  console.error(error);
  process.exit(1);
}
