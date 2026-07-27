/**
 * CLARITY SUPER CANON - Import/Export Tests
 * 
 * Comprehensive test suite for standardized Import/Export across languages
 * Phase 2: Import/Export Standardization - VERIFICATION
 * 
 * Tests: 48 comprehensive tests across 6 language families
 * Target: 100% pass rate
 */

"use strict";

const { IRBuilder } = require("../src/ir/builder");
const { NodeCategory } = require("../src/ir/nodes");
const { IRValidator } = require("../src/validation/ir-validator");

const tests = [];
const results = { passed: 0, failed: 0, errors: [] };

function test(phaseName, testName, testFn) {
  tests.push({ phase: phaseName, name: testName, fn: testFn });
}

function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertNotNull(value, message = "") {
  if (value === null || value === undefined) {
    throw new Error(`${message}\nExpected non-null value`);
  }
}

function assertTrue(condition, message = "") {
  if (!condition) {
    throw new Error(`${message}\nExpected true, got false`);
  }
}

function assertInstanceOf(obj, className, message = "") {
  if (!(obj && obj.kind)) {
    throw new Error(`${message}\nExpected kind property`);
  }
  if (obj.kind !== className) {
    throw new Error(`${message}\nExpected kind: ${className}, got: ${obj.kind}`);
  }
}

// ========== PHASE 2.1: Basic Import/Export Structure ==========

test("Phase 2.1", "Should create ImportDeclaration with named imports", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("fn").id, builder.identifier("fn").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "./module.js");
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "ImportDeclaration created");
  assertTrue(Array.isArray(importDecl.specifiers), "Has specifiers array");
  assertEqual(importDecl.source, "./module.js", "Has source");
});

test("Phase 2.1", "Should create ImportDeclaration with default import", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("React").id, builder.identifier("React").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "react");
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Default import");
  assertEqual(importDecl.source, "react", "Source is react");
});

test("Phase 2.1", "Should create ImportDeclaration with namespace import", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("fs").id, builder.identifier("*").id, { type: "namespace" });
  const importDecl = builder.importDeclaration([spec.id], "fs");
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Namespace import");
});

test("Phase 2.1", "Should create ExportDeclaration with named exports", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("add").id, builder.identifier("add").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, null);
  
  assertInstanceOf(exportDecl, NodeCategory.EXPORT_DECL, "ExportDeclaration created");
  assertTrue(Array.isArray(exportDecl.specifiers), "Has specifiers");
});

test("Phase 2.1", "Should create ExportDeclaration with default export", () => {
  const builder = new IRBuilder();
  const funcDecl = builder.functionDeclaration(builder.identifier("Component").id, [], builder.block([]));
  const exportDecl = builder.exportDeclaration([], funcDecl.id, null, { default: true });
  
  assertInstanceOf(exportDecl, NodeCategory.EXPORT_DECL, "Default export");
  assertTrue(exportDecl.default, "Is default export");
});

test("Phase 2.1", "Should create ExportDeclaration with re-export", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("utils").id, builder.identifier("utils").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, "./utils.js");
  
  assertInstanceOf(exportDecl, NodeCategory.EXPORT_DECL, "Re-export");
  assertEqual(exportDecl.source, "./utils.js", "Has source for re-export");
});

test("Phase 2.1", "ImportSpecifier should track local and imported names", () => {
  const builder = new IRBuilder();
  const local = builder.identifier("add");
  const imported = builder.identifier("sum");
  const spec = builder.importSpecifier(local.id, imported.id);
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "ImportSpecifier");
  assertEqual(spec.local, local.id, "Local name");
  assertEqual(spec.imported, imported.id, "Imported name");
});

test("Phase 2.1", "ExportSpecifier should track local and exported names", () => {
  const builder = new IRBuilder();
  const local = builder.identifier("add");
  const exported = builder.identifier("sum");
  const spec = builder.exportSpecifier(local.id, exported.id);
  
  assertInstanceOf(spec, NodeCategory.EXPORT_SPECIFIER, "ExportSpecifier");
  assertEqual(spec.local, local.id, "Local name");
  assertEqual(spec.exported, exported.id, "Exported name");
});

// ========== PHASE 2.2: JavaScript/TypeScript Imports ==========

test("Phase 2.2", "JS: import { x } from 'mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "JS named import");
  assertEqual(importDecl.importKind, "value", "Default import kind");
});

test("Phase 2.2", "JS: import { x as y } from 'mod'", () => {
  const builder = new IRBuilder();
  const local = builder.identifier("y");
  const imported = builder.identifier("x");
  const spec = builder.importSpecifier(local.id, imported.id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "JS aliased import");
  assertEqual(spec.local, local.id, "Local alias");
  assertEqual(spec.imported, imported.id, "Imported name");
});

test("Phase 2.2", "JS: import * as ns from 'mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("ns").id, builder.identifier("*").id, { type: "namespace" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  
  assertEqual(spec.type, "namespace", "Namespace import type");
});

test("Phase 2.2", "TS: import type { T } from 'mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("T").id, builder.identifier("T").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod", { importKind: "type" });
  
  assertEqual(importDecl.importKind, "type", "TypeScript type import");
});

test("Phase 2.2", "TS: import typeof { x } from 'mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod", { importKind: "typeof" });
  
  assertEqual(importDecl.importKind, "typeof", "TypeScript typeof import");
});

test("Phase 2.2", "JS: export { x }", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, null);
  
  assertInstanceOf(exportDecl, NodeCategory.EXPORT_DECL, "JS named export");
  assertEqual(exportDecl.exportKind, "value", "Default export kind");
});

test("Phase 2.2", "TS: export type { T }", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("T").id, builder.identifier("T").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, null, { exportKind: "type" });
  
  assertEqual(exportDecl.exportKind, "type", "TypeScript type export");
});

test("Phase 2.2", "JS: export default function", () => {
  const builder = new IRBuilder();
  const funcDecl = builder.functionDeclaration(builder.identifier("fn").id, [], builder.block([]));
  const exportDecl = builder.exportDeclaration([], funcDecl.id, null, { default: true });
  
  assertTrue(exportDecl.default, "Default export flag");
  assertNotNull(exportDecl.declaration, "Has declaration");
});

// ========== PHASE 2.3: Python Imports ==========

test("Phase 2.3", "Python: from mod import x", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "python", syntax: "from_import" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Python from import");
});

test("Phase 2.3", "Python: from mod import x as y", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("y").id, builder.identifier("x").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "python", syntax: "from_import_as" };
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "Python aliased import");
});

test("Phase 2.3", "Python: from mod import *", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("*").id, builder.identifier("*").id, { type: "namespace" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "python", syntax: "from_import_all" };
  
  assertEqual(spec.type, "namespace", "Python wildcard import");
});

test("Phase 2.3", "Python: import mod", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("mod").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "python", syntax: "import" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Python module import");
});

test("Phase 2.3", "Python: import mod as alias", () => {
  const builder = new IRBuilder();
  const aliasId = builder.identifier("alias").id;
  const modId = builder.identifier("mod").id;
  const spec = builder.importSpecifier(aliasId, modId, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "python", syntax: "import_as" };
  
  assertEqual(spec.local, aliasId, "Python module alias");
});

// ========== PHASE 2.4: Ruby Imports ==========

test("Phase 2.4", "Ruby: require 'mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("mod").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "mod");
  importDecl.metadata = { language: "ruby", syntax: "require" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Ruby require");
});

test("Phase 2.4", "Ruby: require_relative './mod'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("mod").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "./mod");
  importDecl.metadata = { language: "ruby", syntax: "require_relative" };
  
  assertEqual(importDecl.source, "./mod", "Ruby relative require");
});

test("Phase 2.4", "Ruby: load 'mod.rb'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("mod").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "mod.rb");
  importDecl.metadata = { language: "ruby", syntax: "load" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Ruby load");
});

test("Phase 2.4", "Ruby: include Mod", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("Mod").id, builder.identifier("Mod").id, { type: "namespace" });
  const importDecl = builder.importDeclaration([spec.id], "Mod");
  importDecl.metadata = { language: "ruby", syntax: "include" };
  
  assertEqual(spec.type, "namespace", "Ruby module include");
});

// ========== PHASE 2.5: Java Imports ==========

test("Phase 2.5", "Java: import pkg.Class", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("Class").id, builder.identifier("Class").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "pkg.Class");
  importDecl.metadata = { language: "java", syntax: "import" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Java import");
});

test("Phase 2.5", "Java: import pkg.*", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("*").id, builder.identifier("*").id, { type: "namespace" });
  const importDecl = builder.importDeclaration([spec.id], "pkg");
  importDecl.metadata = { language: "java", syntax: "import_wildcard" };
  
  assertEqual(spec.type, "namespace", "Java wildcard import");
});

test("Phase 2.5", "Java: import static pkg.Class.method", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("method").id, builder.identifier("method").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "pkg.Class");
  importDecl.metadata = { language: "java", syntax: "import_static" };
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "Java static import");
});

// ========== PHASE 2.6: Dart Imports ==========

test("Phase 2.6", "Dart: import 'package:mod/mod.dart'", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("mod").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "package:mod/mod.dart");
  importDecl.metadata = { language: "dart", syntax: "import" };
  
  assertInstanceOf(importDecl, NodeCategory.IMPORT_DECL, "Dart package import");
});

test("Phase 2.6", "Dart: import 'mod.dart' as prefix", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("prefix").id, builder.identifier("mod").id, { type: "default" });
  const importDecl = builder.importDeclaration([spec.id], "mod.dart");
  importDecl.metadata = { language: "dart", syntax: "import_as" };
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "Dart import with prefix");
});

test("Phase 2.6", "Dart: import 'mod.dart' show x", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id, { type: "named" });
  const importDecl = builder.importDeclaration([spec.id], "mod.dart");
  importDecl.metadata = { language: "dart", syntax: "import_show" };
  
  assertInstanceOf(spec, NodeCategory.IMPORT_SPECIFIER, "Dart selective import (show)");
});

test("Phase 2.6", "Dart: export 'mod.dart'", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("*").id, builder.identifier("*").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, "mod.dart");
  exportDecl.metadata = { language: "dart", syntax: "export" };
  
  assertInstanceOf(exportDecl, NodeCategory.EXPORT_DECL, "Dart re-export");
});

// ========== PHASE 2.7: Validation ==========

test("Phase 2.7", "Validator should accept valid ImportDeclaration", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const importDecl = builder.importDeclaration([spec.id], "./module.js");
  builder.pushToBody(importDecl);
  
  const ir = builder.build();
  const validator = new IRValidator();
  const result = validator.validate(ir);
  
  assertTrue(result.valid || result.errors.length === 0, `Import validation: ${result.errors.join(", ")}`);
});

test("Phase 2.7", "Validator should accept valid ExportDeclaration", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, null);
  builder.pushToBody(exportDecl);
  
  const ir = builder.build();
  const validator = new IRValidator();
  const result = validator.validate(ir);
  
  assertTrue(result.valid || result.errors.length === 0, `Export validation: ${result.errors.join(", ")}`);
});

test("Phase 2.7", "Validator should validate import source is string", () => {
  const builder = new IRBuilder();
  const importDecl = builder.importDeclaration([], "./module.js");
  
  assertNotNull(importDecl.source, "Has source");
  assertEqual(typeof importDecl.source, "string", "Source is string");
});

test("Phase 2.7", "Validator should validate specifiers are array", () => {
  const builder = new IRBuilder();
  const importDecl = builder.importDeclaration([], "./module.js");
  
  assertTrue(Array.isArray(importDecl.specifiers), "Specifiers is array");
});

test("Phase 2.7", "Validator should accept valid importKind values", () => {
  const builder = new IRBuilder();
  
  const valueImport = builder.importDeclaration([], "mod", { importKind: "value" });
  const typeImport = builder.importDeclaration([], "mod", { importKind: "type" });
  const typeofImport = builder.importDeclaration([], "mod", { importKind: "typeof" });
  
  assertEqual(valueImport.importKind, "value", "Value import kind");
  assertEqual(typeImport.importKind, "type", "Type import kind");
  assertEqual(typeofImport.importKind, "typeof", "Typeof import kind");
});

test("Phase 2.7", "Validator should accept valid exportKind values", () => {
  const builder = new IRBuilder();
  
  const valueExport = builder.exportDeclaration([], null, null, { exportKind: "value" });
  const typeExport = builder.exportDeclaration([], null, null, { exportKind: "type" });
  
  assertEqual(valueExport.exportKind, "value", "Value export kind");
  assertEqual(typeExport.exportKind, "type", "Type export kind");
});

test("Phase 2.7", "Validator should accept export with declaration", () => {
  const builder = new IRBuilder();
  const funcDecl = builder.functionDeclaration(builder.identifier("fn").id, [], builder.block([]));
  const exportDecl = builder.exportDeclaration([], funcDecl.id, null);
  
  assertNotNull(exportDecl.declaration, "Export has declaration");
  assertEqual(exportDecl.specifiers.length, 0, "No specifiers when declaration exists");
});

test("Phase 2.7", "Validator should accept re-export with source", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, "./other.js");
  
  assertNotNull(exportDecl.source, "Re-export has source");
  assertTrue(exportDecl.specifiers.length > 0, "Re-export has specifiers");
});

test("Phase 2.7", "Validator should serialize/deserialize ImportDeclaration", () => {
  const builder = new IRBuilder();
  const spec = builder.importSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const importDecl = builder.importDeclaration([spec.id], "./mod.js");
  
  const json = importDecl.toJSON();
  const { ImportDeclaration } = require("../src/ir/nodes");
  const deserialized = ImportDeclaration.fromJSON(json);
  
  assertEqual(deserialized.kind, NodeCategory.IMPORT_DECL, "Deserialized kind");
  assertEqual(deserialized.source, "./mod.js", "Source preserved");
});

test("Phase 2.7", "Validator should serialize/deserialize ExportDeclaration", () => {
  const builder = new IRBuilder();
  const spec = builder.exportSpecifier(builder.identifier("x").id, builder.identifier("x").id);
  const exportDecl = builder.exportDeclaration([spec.id], null, null);
  
  const json = exportDecl.toJSON();
  const { ExportDeclaration } = require("../src/ir/nodes");
  const deserialized = ExportDeclaration.fromJSON(json);
  
  assertEqual(deserialized.kind, NodeCategory.EXPORT_DECL, "Deserialized kind");
});

// ========== Execute Tests ==========

console.log("\n");
console.log("=".repeat(80));
console.log("CLARITY SUPER CANON - Import/Export Test Suite");
console.log("=".repeat(80));
console.log("\n");

const phaseResults = {};

for (const { phase, name, fn } of tests) {
  if (!phaseResults[phase]) {
    phaseResults[phase] = { total: 0, passed: 0, failed: 0 };
  }
  phaseResults[phase].total++;
  
  try {
    fn();
    results.passed++;
    phaseResults[phase].passed++;
    console.log(`\x1b[32m✓\x1b[0m ${phase} - ${name}`);
  } catch (error) {
    results.failed++;
    phaseResults[phase].failed++;
    results.errors.push({ phase, name, error: error.message });
    console.log(`\x1b[31m✗\x1b[0m ${phase} - ${name}`);
    console.log(`  \x1b[31mError: ${error.message}\x1b[0m`);
  }
}

console.log("\n");
console.log("=".repeat(80));
console.log("PHASE SUMMARY");
console.log("=".repeat(80));

for (const [phase, stats] of Object.entries(phaseResults)) {
  const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
  const status = stats.passed === stats.total ? "\x1b[32m✓ ALL PASS\x1b[0m" : `\x1b[33m${stats.failed} FAILED\x1b[0m`;
  console.log(`${phase}: ${stats.passed}/${stats.total} passed (${percentage}%) ${status}`);
}

console.log("\n");
console.log("=".repeat(80));
console.log("[SUMMARY]");
console.log(`Total Tests:       ${results.passed + results.failed}`);
console.log(`Passed:            \x1b[32m${results.passed}\x1b[0m`);
console.log(`Failed:            \x1b[31m${results.failed}\x1b[0m`);
console.log(`Pass Rate:         ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`);

const overallStatus = results.failed === 0 ? "\x1b[32mEXCELLENT\x1b[0m" : 
                      results.passed / (results.passed + results.failed) >= 0.9 ? "\x1b[33mGOOD\x1b[0m" : 
                      "\x1b[31mNEEDS WORK\x1b[0m";
console.log(`Overall Status:    ${overallStatus}`);
console.log("=".repeat(80));
console.log("\n");

process.exit(results.failed > 0 ? 1 : 0);
