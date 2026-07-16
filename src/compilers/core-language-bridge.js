"use strict";
const {
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
} = require("./index-internal");

const SOURCE_LANGUAGE_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  ls: "luascript",
  luascript: "luascript",
  lua: "lua",
  py: "python",
  python: "python",
  rb: "ruby",
  ruby: "ruby",
  php: "php",
  dart: "dart",
  cs: "csharp",
  csharp: "csharp",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  java: "java",
  go: "go",
  rs: "rust",
  rust: "rust",
  kt: "kotlin",
  kotlin: "kotlin",
  elm: "elm",
  gleam: "gleam"
};

const TARGET_LANGUAGE_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  lua: "lua",
  ls: "luascript",
  luascript: "luascript",
  py: "python",
  python: "python",
  cs: "csharp",
  csharp: "csharp",
  c: "c",
  cpp: "cpp",
  "c++": "cpp"
};

function normalizeSourceLanguage(language) {
  const normalized = SOURCE_LANGUAGE_ALIASES[String(language || "").toLowerCase()];
  if (!normalized) {
    throw new Error(`Unsupported source language: ${language}`);
  }
  return normalized;
}

function normalizeTargetLanguage(language) {
  const normalized = TARGET_LANGUAGE_ALIASES[String(language || "").toLowerCase()];
  if (!normalized) {
    throw new Error(`Unsupported target language: ${language}`);
  }
  return normalized;
}

function compilerResultToProgram(result) {
  if (!result) {
    throw new Error("Compiler returned no IR result");
  }
  if (result.program) {
    return result.program;
  }
  return result;
}

class CoreLanguageBridge {
  constructor(options = {}) {
    this.options = {
      pythonCommands: options.pythonCommands || ["python3", "python"],
      ...options
    };
  }

  getSupportedSourceLanguages() {
    return [
      "javascript",
      "typescript",
      "luascript",
      "lua",
      "python",
      "ruby",
      "php",
      "dart",
      "csharp",
      "c",
      "cpp",
      "java",
      "go",
      "rust",
      "kotlin",
      "elm",
      "gleam"
    ];
  }

  getSupportedTargetLanguages() {
    return ["lua", "javascript", "luascript", "python", "csharp", "c", "cpp"];
  }

  compileToIR(sourceCode, sourceLanguage) {
    const normalizedLanguage = normalizeSourceLanguage(sourceLanguage);

    if (normalizedLanguage === "luascript") {
      const compiler = this.createSourceCompiler(normalizedLanguage);
      const artifact = compiler.compileArtifact(sourceCode);
      return artifact.program;
    }

    const compiler = this.createSourceCompiler(normalizedLanguage);
    const program = compilerResultToProgram(
      typeof compiler.compileArtifact === "function"
        ? compiler.compileArtifact(sourceCode)
        : compiler.compile(sourceCode)
    );

    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: normalizedLanguage
    };

    return program;
  }

  emitFromIR(program, targetLanguage, sourceLanguage) {
    const normalizedTarget = normalizeTargetLanguage(targetLanguage);
    const normalizedSource = normalizeSourceLanguage(sourceLanguage);
    const generator = this.createTargetGenerator(normalizedTarget, normalizedSource);
    return generator.generate(program);
  }

  transpileSource(sourceCode, options = {}) {
    const sourceLanguage = normalizeSourceLanguage(options.sourceLanguage || "javascript");
    const targetLanguage = normalizeTargetLanguage(options.targetLanguage || "lua");

    const ir = this.compileToIR(sourceCode, sourceLanguage);
    const code = this.emitFromIR(ir, targetLanguage, sourceLanguage);

    return {
      code,
      sourceLanguage,
      targetLanguage,
      ir,
      stats: {
        originalSize: sourceCode.length,
        transpiled: code.length,
        filename: options.filename || `main.${sourceLanguage}`
      }
    };
  }

  createSourceCompiler(language) {
    switch (language) {
    case "javascript":
      return new JSToIRCompiler();
    case "typescript":
      return new TypeScriptToIRCompiler();
    case "lua":
      return new LuaToIRCompiler();
    case "luascript":
      return new LuaScriptToIRCompiler();
    case "python":
      return new PythonToIRCompiler({ pythonCommands: this.options.pythonCommands });
    case "ruby":
      return new RubyToIRCompiler();
    case "php":
      return new PHPToIRCompiler();
    case "dart":
      return new DartToIRCompiler();
    case "csharp":
      return new CSharpToIRCompiler();
    case "c":
      return new CToIRCompiler();
    case "cpp":
      return new CppToIRCompiler();
    case "java":
      return new JavaToIRCompiler();
    case "go":
      return new GoToIRCompiler();
    case "rust":
      return new RustToIRCompiler();
    case "kotlin":
      return new KotlinToIRCompiler();
    case "elm":
      return new ElmToIRCompiler();
    case "gleam":
      return new GleamToIRCompiler();
    default:
      throw new Error(`No core source compiler registered for ${language}`);
    }
  }

  createTargetGenerator(language, sourceLanguage) {
    switch (language) {
    case "lua":
      return new IRToLuaGenerator({ sourceLanguage });
    case "javascript":
      return new IRToJSGenerator({ sourceLanguage, luaIndexBase: sourceLanguage === "lua" ? 1 : undefined });
    case "luascript":
      return new IRToLSGenerator({
        sourceLanguage,
        luaIndexBase: sourceLanguage === "lua" ? 1 : undefined
      });
    case "python":
      return new IRToPythonGenerator({ sourceLanguage });
    case "csharp":
      return new IRToCSharpGenerator();
    case "c":
      return new IRToCGenerator();
    case "cpp":
      return new IRToCppGenerator();
    default:
      throw new Error(`No core target generator registered for ${language}`);
    }
  }

}

module.exports = {
  CoreLanguageBridge,
  normalizeSourceLanguage,
  normalizeTargetLanguage
};
