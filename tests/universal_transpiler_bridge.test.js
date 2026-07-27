"use strict";

const assert = require("assert");
const { UniversalMultiLanguageTranspiler } = require("../src/transpiler_universal");

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label} missing ${expected}\n---\n${text}\n---`);
  }
}

function main() {
  const transpiler = new UniversalMultiLanguageTranspiler();

  assert.strictEqual(transpiler.isLanguagePairSupported("javascript", "lua"), true);
  assert.strictEqual(transpiler.isLanguagePairSupported("python", "javascript"), true);
  assert.strictEqual(transpiler.isLanguagePairSupported("groovy", "lua"), false);
  assert.strictEqual(transpiler.isLanguagePairSupported("ruby", "ruby"), false);

  const jsToLua = transpiler.transpile("let x = 5; console.log(x);", "javascript", "lua");
  assert.strictEqual(jsToLua.success, true);
  assertIncludes(jsToLua.code, "local x = 5", "javascript->lua");

  const pythonToLua = transpiler.transpile("value = 3\nprint(value)\n", "python", "lua");
  assert.strictEqual(pythonToLua.success, true);
  assertIncludes(pythonToLua.code, "local value = 3", "python->lua");

  const groovyToLua = transpiler.transpile("println 1", "groovy", "lua");
  assert.strictEqual(groovyToLua.success, false);
  assert.match(groovyToLua.error, /advisory-only|not core-integrated/i);

  const rubyToRuby = transpiler.transpile("puts 1", "ruby", "ruby");
  assert.strictEqual(rubyToRuby.success, false);
  assert.match(rubyToRuby.error, /not core-integrated/i);

  const report = transpiler.generateStatusReport();
  assert.strictEqual(report.advisory, true);
  assert.strictEqual(report.configuration.mode, "core-bridge-only");
  assert.strictEqual(report.supportMatrix.javascript.lua, "core-bridge");
  assert.strictEqual(report.supportMatrix.groovy.lua, "unsupported");

  console.log("Universal transpiler bridge tests passed");
}

main();
