"use strict";

/**
 * Shared test utilities for scripts tests
 */

// Helper function to clear MCP endpoint environment variables
function clearMcpEndpoints() {
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('MCP_') && key.endsWith('_ENDPOINT')) {
      delete process.env[key];
    }
  });
}

// Helper function to restore environment variables
function restoreEnv(originalEnv) {
  // Clear current env vars that weren't in original
  Object.keys(process.env).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      delete process.env[key];
    }
  });
  // Restore original values
  Object.keys(originalEnv).forEach(key => {
    process.env[key] = originalEnv[key];
  });
}

// Helper function to mock console output
function mockConsole() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logs = [];
  
  console.log = (...args) => logs.push(args.join(' '));
  console.warn = (...args) => logs.push(`WARN: ${args.join(' ')}`);
  
  return {
    logs,
    restore() {
      console.log = originalLog;
      console.warn = originalWarn;
    }
  };
}

// Helper function to assert console output contains expected strings
function assertConsoleOutput(logs, expectedStrings, testName) {
  const assert = require('assert');
  const outputStr = logs.join('\n');
  expectedStrings.forEach(expected => {
    assert.ok(outputStr.includes(expected), `${testName}: should include "${expected}"`);
  });
}

module.exports = {
  clearMcpEndpoints,
  restoreEnv,
  mockConsole,
  assertConsoleOutput,
};
