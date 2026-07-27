"use strict";

const { JSToIRCompiler } = require("./js-to-ir");
const { CToIRCompiler, CppToIRCompiler } = require("./c-like-to-ir");
const { CSharpToIRCompiler } = require("./csharp-to-ir");
const { DartToIRCompiler } = require("./dart-to-ir");
const { ElmToIRCompiler } = require("./elm-to-ir");
const { GleamToIRCompiler } = require("./gleam-to-ir");
const { GoToIRCompiler } = require("./go-to-ir");
const { KotlinToIRCompiler } = require("./kotlin-to-ir");
const { LuaToIRCompiler } = require("./lua-to-ir");
const { LuaScriptToIRCompiler } = require("./luascript-to-ir");
const { PythonToIRCompiler } = require("./python-to-ir");
const { JavaToIRCompiler } = require("./java-to-ir");
const { PHPToIRCompiler } = require("./php-to-ir");
const { RubyToIRCompiler } = require("./ruby-to-ir");
const { RustToIRCompiler } = require("./rust-to-ir");
const { TypeScriptToIRCompiler } = require("./typescript-to-ir");
const { IRToCGenerator } = require("./ir-to-c");
const { IRToCppGenerator } = require("./ir-to-cpp");
const { IRToCSharpGenerator } = require("./ir-to-csharp");
const { IRToJSGenerator } = require("./ir-to-js");
const { IRToLuaGenerator } = require("./ir-to-lua");
const { IRToLSGenerator } = require("./ir-to-ls");
const { IRToPythonGenerator } = require("./ir-to-python");

module.exports = {
  JSToIRCompiler,
  CToIRCompiler,
  CppToIRCompiler,
  CSharpToIRCompiler,
  DartToIRCompiler,
  ElmToIRCompiler,
  GleamToIRCompiler,
  GoToIRCompiler,
  KotlinToIRCompiler,
  LuaToIRCompiler,
  LuaScriptToIRCompiler,
  PythonToIRCompiler,
  JavaToIRCompiler,
  PHPToIRCompiler,
  RubyToIRCompiler,
  RustToIRCompiler,
  TypeScriptToIRCompiler,
  IRToCGenerator,
  IRToCppGenerator,
  IRToCSharpGenerator,
  IRToJSGenerator,
  IRToLuaGenerator,
  IRToLSGenerator,
  IRToPythonGenerator
};
