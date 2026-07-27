"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { CoreLanguageBridge } = require("../src/compilers");
const { UnifiedLuaScript } = require("../src/unified_luascript");

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label} missing ${expected}\n---\n${text}\n---`);
  }
}

function assertExcludes(text, forbidden, label) {
  if (text.includes(forbidden)) {
    throw new Error(`${label} still contains ${forbidden}\n---\n${text}\n---`);
  }
}

function testCoreLanguageBridge() {
  const bridge = new CoreLanguageBridge();

  const jsToLua = bridge.transpileSource("let x = 5; console.log(x);", {
    sourceLanguage: "javascript",
    targetLanguage: "lua"
  });
  assertIncludes(jsToLua.code, "local x = 5", "javascript->lua");
  assertIncludes(jsToLua.code, "print(x)", "javascript->lua");

  const jsTemplateToLua = bridge.transpileSource("const label = 'P'; const total = 7; console.log(`ring3_template ${label} ${total}`);", {
    sourceLanguage: "javascript",
    targetLanguage: "lua"
  });
  assertIncludes(jsTemplateToLua.code, "ring3_template ", "javascript template->lua");
  assertIncludes(jsTemplateToLua.code, "..", "javascript template->lua");

  const jsIndexLengthToLua = bridge.transpileSource("const nums = [1, 2, 3]; const idx = 1; nums[idx] = 9; const word = 'cat'; console.log(nums[0], nums[idx], word[idx], nums.length, word.length);", {
    sourceLanguage: "javascript",
    targetLanguage: "lua"
  });
  assertIncludes(jsIndexLengthToLua.code, "__ls_index", "javascript indexing->lua");
  assertIncludes(jsIndexLengthToLua.code, "__ls_set_index", "javascript index assignment->lua");
  assertIncludes(jsIndexLengthToLua.code, "__ls_length", "javascript length->lua");

  const pythonToLua = bridge.transpileSource("x = 5\nprint(x)\n", {
    sourceLanguage: "python",
    targetLanguage: "lua"
  });
  assertIncludes(pythonToLua.code, "local x = 5", "python->lua");
  assertIncludes(pythonToLua.code, "print(x)", "python->lua");

  const luaToJavaScript = bridge.transpileSource("local x = 5\nprint(x)\n", {
    sourceLanguage: "lua",
    targetLanguage: "javascript"
  });
  assertIncludes(luaToJavaScript.code, "let x = 5", "lua->javascript");
  assertIncludes(luaToJavaScript.code, "console.log(x)", "lua->javascript");

  const luaToLuascript = bridge.transpileSource("local items = {2, 4, 6}\nprint(items[2])\n", {
    sourceLanguage: "lua",
    targetLanguage: "luascript"
  });
  assertIncludes(luaToLuascript.code, "console.log(items[1])", "lua->luascript index normalization");
  assertExcludes(luaToLuascript.code, "console.log(items[2])", "lua->luascript index normalization");

  const typeScriptToPython = bridge.transpileSource("let x: number = 5; console.log(x);", {
    sourceLanguage: "typescript",
    targetLanguage: "python"
  });
  assertIncludes(typeScriptToPython.code, "x = 5", "typescript->python");
  assertIncludes(typeScriptToPython.code, "print(x)", "typescript->python");

  const rubyToLua = bridge.transpileSource(
    'def add(a, b)\n  return a + b\nend\n\ndef main\n  total = add(7, 5)\n  puts "ruby_arithmetic"\n  puts total\nend\n',
    {
      sourceLanguage: "ruby",
      targetLanguage: "lua"
    }
  );
  assertIncludes(rubyToLua.code, 'print("ruby_arithmetic")', "ruby->lua");
  assertIncludes(rubyToLua.code, "local function add", "ruby->lua");

  const phpToJavaScript = bridge.transpileSource(
    "<?php\nfunction add($a, $b) {\n    return $a + $b;\n}\n\nfunction main() {\n    $total = add(4, 6);\n    echo \"php_arithmetic\";\n    echo $total;\n}\n?>\n",
    {
      sourceLanguage: "php",
      targetLanguage: "javascript"
    }
  );
  assertIncludes(phpToJavaScript.code, "function add", "php->javascript");
  assertIncludes(phpToJavaScript.code, 'console.log("php_arithmetic")', "php->javascript");

  const dartToPython = bridge.transpileSource(
    'double add(double a, double b) {\n  return a + b;\n}\n\nvoid main() {\n  double total = add(7, 8);\n  print("dart_arithmetic");\n  print(total);\n}\n',
    {
      sourceLanguage: "dart",
      targetLanguage: "python"
    }
  );
  assertIncludes(dartToPython.code, "def add", "dart->python");
  assertIncludes(dartToPython.code, 'print("dart_arithmetic")', "dart->python");

  const csharpToLuascript = bridge.transpileSource(
    'using System;\npublic class Program { public static void Main() { int[] values = new int[] { 2, 4, 6 }; Console.WriteLine(values[0] + values[2]); } }\n',
    {
      sourceLanguage: "csharp",
      targetLanguage: "luascript"
    }
  );
  assertIncludes(csharpToLuascript.code, "return value[key];", "csharp->luascript zero-based helper");
  assertExcludes(csharpToLuascript.code, "return value[key + 1];", "csharp->luascript zero-based helper");

  const luascriptToLua = bridge.transpileSource(
    'meta profile portable_v1;\nlet values = [1, 2];\nconsole.log(values.length);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "lua"
    }
  );
  assertIncludes(luascriptToLua.code, "local values = {1, 2}", "luascript->lua");
  assertIncludes(luascriptToLua.code, "print(", "luascript->lua");

  const luascriptToJavaScript = bridge.transpileSource(
    'meta profile portable_semantics_v1;\nlet total = 5;\nconsole.log(total);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "javascript"
    }
  );
  assertIncludes(luascriptToJavaScript.code, "let total = 5", "luascript->javascript");
  assertIncludes(luascriptToJavaScript.code, "console.log(total)", "luascript->javascript");

  const luascriptTemplateToJavaScript = bridge.transpileSource(
    "const label = 'P';\nconst total = 7;\nconsole.log(`ring3_template ${label} ${total}`);\n",
    {
      sourceLanguage: "luascript",
      targetLanguage: "javascript"
    }
  );
  assertIncludes(luascriptTemplateToJavaScript.code, "ring3_template ", "luascript template->javascript");
  assertIncludes(luascriptTemplateToJavaScript.code, "+", "luascript template->javascript");

  const luascriptPortableSemanticsToLua = bridge.transpileSource(
    'meta profile portable_semantics_v1;\nlet values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nlet second = values[1];\nlet third = values[2];\nlet listPart = values.slice(1, 3);\nlet listFirst = listPart[0];\nlet listPartLength = listPart.length;\nlet first = values[0];\nconsole.log("ring3_profile", char, wordLength, part, second, third, listFirst, listPartLength, first);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "lua"
    }
  );
  assertIncludes(luascriptPortableSemanticsToLua.code, "__ls_index", "luascript portable semantics->lua");
  assertIncludes(luascriptPortableSemanticsToLua.code, "__ls_set_index", "luascript portable semantics assignment->lua");
  assertIncludes(luascriptPortableSemanticsToLua.code, "__ls_length", "luascript portable semantics length->lua");
  assertIncludes(luascriptPortableSemanticsToLua.code, "__ls_slice", "luascript portable semantics slice->lua");

  const luascriptPortableSemanticsToPython = bridge.transpileSource(
    'meta profile portable_semantics_v1;\nlet values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nconsole.log("ring3_profile", char, wordLength, part);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "python"
    }
  );
  assertIncludes(luascriptPortableSemanticsToPython.code, "__ls_index", "luascript portable semantics->python");
  assertIncludes(luascriptPortableSemanticsToPython.code, "__ls_slice", "luascript portable semantics slice->python");
  assertIncludes(luascriptPortableSemanticsToPython.code, "len(", "luascript portable semantics length->python");

  const luascriptPortableTruthinessToLua = bridge.transpileSource(
    'meta profile portable_semantics_v1;\nfunction pair(name, score) {\n  return many(name, score + 1, "done");\n}\nlet emptyList = [];\nlet emptyObject = {};\nlet gate = 0;\nif (emptyList || "bad") {\n  gate = gate + 1;\n}\nif (emptyObject && "kept") {\n  gate = gate + 1;\n}\nlet message = "count=" + 3 + " flag=" + false + " empty=" + null;\nlet result = pair("Ada", 6);\nconsole.log("ring3_semantics", message, gate, result[0], result.length, result[1], result[2]);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "lua"
    }
  );
  assertIncludes(luascriptPortableTruthinessToLua.code, "__ls_truthy", "luascript portable truthiness->lua");
  assertIncludes(luascriptPortableTruthinessToLua.code, "__ls_add", "luascript portable string coercion->lua");
  assertIncludes(luascriptPortableTruthinessToLua.code, "__ls_many", "luascript portable multiple returns->lua");

  const luascriptPortableTruthinessToPython = bridge.transpileSource(
    'meta profile portable_semantics_v1;\nfunction pair(name, score) {\n  return many(name, score + 1, "done");\n}\nlet emptyList = [];\nlet emptyObject = {};\nlet gate = 0;\nif (emptyList || "bad") {\n  gate = gate + 1;\n}\nif (emptyObject && "kept") {\n  gate = gate + 1;\n}\nlet message = "count=" + 3 + " flag=" + false + " empty=" + null;\nlet result = pair("Ada", 6);\nconsole.log("ring3_semantics", message, gate, result[0], result.length, result[1], result[2]);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "python"
    }
  );
  assertIncludes(luascriptPortableTruthinessToPython.code, "__ls_truthy", "luascript portable truthiness->python");
  assertIncludes(luascriptPortableTruthinessToPython.code, "__ls_add", "luascript portable string coercion->python");
  assertIncludes(luascriptPortableTruthinessToPython.code, "return [", "luascript portable multiple returns->python");

  const luascriptDefaultSemanticsToLua = bridge.transpileSource(
    'let values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nfunction pair(name, score) {\n  return many(name, score + 1, "done");\n}\nlet result = pair("Ada", 6);\nconsole.log("ring3_default", char, wordLength, part, result[0], result.length, result[1], result[2]);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "lua"
    }
  );
  assertIncludes(luascriptDefaultSemanticsToLua.code, "__ls_index", "luascript default semantics->lua");
  assertIncludes(luascriptDefaultSemanticsToLua.code, "__ls_length", "luascript default semantics length->lua");
  assertIncludes(luascriptDefaultSemanticsToLua.code, "__ls_slice", "luascript default semantics slice->lua");
  assertIncludes(luascriptDefaultSemanticsToLua.code, "__ls_many", "luascript default semantics many->lua");

  const luascriptDefaultSemanticsToPython = bridge.transpileSource(
    'let values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nlet message = "count=" + 3 + " flag=" + false + " empty=" + null;\nconsole.log("ring3_default", char, wordLength, part, message);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "python"
    }
  );
  assertIncludes(luascriptDefaultSemanticsToPython.code, "__ls_index", "luascript default semantics->python");
  assertIncludes(luascriptDefaultSemanticsToPython.code, "__ls_slice", "luascript default semantics slice->python");
  assertIncludes(luascriptDefaultSemanticsToPython.code, "__ls_add", "luascript default semantics string coercion->python");

  const luascriptDefaultSemanticsToLuascript = bridge.transpileSource(
    'let values = [1, 2, 3];\nconsole.log(values[0], values.length, values.slice(1, 3)[0]);\n',
    {
      sourceLanguage: "luascript",
      targetLanguage: "luascript"
    }
  );
  assertExcludes(luascriptDefaultSemanticsToLuascript.code, "meta profile portable_semantics_v1;", "luascript default semantics emission");
  assertExcludes(luascriptDefaultSemanticsToLuascript.code, "meta {", "luascript default semantics emission");

}

function testHarnessesUseCoreBridge() {
  const bidirectionalHarness = fs.readFileSync(
    path.join(__dirname, "language_completion", "bidirectional_harness.js"),
    "utf8"
  );
  assertIncludes(bidirectionalHarness, "const bridge = new CoreLanguageBridge();", "bidirectional harness");
  assertExcludes(bidirectionalHarness, "new JSToIRCompiler()", "bidirectional harness");
  assertExcludes(bidirectionalHarness, "new IRToLuaGenerator()", "bidirectional harness");

  const luaInputHarness = fs.readFileSync(
    path.join(__dirname, "lua_input.test.js"),
    "utf8"
  );
  assertIncludes(luaInputHarness, "const bridge = new CoreLanguageBridge();", "lua input harness");
  assertExcludes(luaInputHarness, "new LuaToIRCompiler()", "lua input harness");
  assertExcludes(luaInputHarness, "new IRToLuaGenerator()", "lua input harness");
}

async function testUnifiedLuaScriptBridge() {
  const system = new UnifiedLuaScript({
    enableRuntime: false,
    enableAdvanced: false,
    enablePerformance: false,
    enableIDE: false
  });

  try {
    await system.initializationPromise;

    const pythonResult = await system.transpileSource("items = [1, 2]\nprint(len(items))\n", {
      sourceLanguage: "python",
      targetLanguage: "lua"
    });
    assertIncludes(pythonResult.code, "print(", "UnifiedLuaScript python->lua");
    assertIncludes(pythonResult.code, "__py_len(items)", "UnifiedLuaScript python->lua");

    const luaResult = await system.transpileSource("local total = 3\nprint(total)\n", {
      sourceLanguage: "lua",
      targetLanguage: "javascript"
    });
    assertIncludes(luaResult.code, "let total = 3", "UnifiedLuaScript lua->javascript");
    assertIncludes(luaResult.code, "console.log(total)", "UnifiedLuaScript lua->javascript");

    const luascriptResult = await system.transpileSource(
      "meta profile portable_v1;\nlet count = 2;\nconsole.log(count);\n",
      {
        sourceLanguage: "luascript",
        targetLanguage: "python"
      }
    );
    assertIncludes(luascriptResult.code, "count = 2", "UnifiedLuaScript luascript->python");
    assertIncludes(luascriptResult.code, "print(count)", "UnifiedLuaScript luascript->python");

    const luascriptPortableSemanticsResult = await system.transpileSource(
      'meta profile portable_semantics_v1;\nlet values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nconsole.log("ring3_profile", char, wordLength, part);\n',
      {
        sourceLanguage: "luascript",
        targetLanguage: "lua"
      }
    );
    assertIncludes(luascriptPortableSemanticsResult.code, "__ls_index", "UnifiedLuaScript luascript portable semantics->lua");
    assertIncludes(luascriptPortableSemanticsResult.code, "__ls_length", "UnifiedLuaScript luascript portable semantics length->lua");
    assertIncludes(luascriptPortableSemanticsResult.code, "__ls_slice", "UnifiedLuaScript luascript portable semantics slice->lua");

    const luascriptPortableTruthinessResult = await system.transpileSource(
      'meta profile portable_semantics_v1;\nfunction pair(name, score) {\n  return many(name, score + 1, "done");\n}\nlet emptyList = [];\nlet emptyObject = {};\nlet gate = 0;\nif (emptyList || "bad") {\n  gate = gate + 1;\n}\nif (emptyObject && "kept") {\n  gate = gate + 1;\n}\nlet message = "count=" + 3 + " flag=" + false + " empty=" + null;\nlet result = pair("Ada", 6);\nconsole.log("ring3_semantics", message, gate, result[0], result.length, result[1], result[2]);\n',
      {
        sourceLanguage: "luascript",
        targetLanguage: "lua"
      }
    );
    assertIncludes(luascriptPortableTruthinessResult.code, "__ls_truthy", "UnifiedLuaScript luascript portable truthiness->lua");
    assertIncludes(luascriptPortableTruthinessResult.code, "__ls_add", "UnifiedLuaScript luascript portable string coercion->lua");
    assertIncludes(luascriptPortableTruthinessResult.code, "__ls_many", "UnifiedLuaScript luascript portable multiple returns->lua");

    const luascriptDefaultSemanticsResult = await system.transpileSource(
      'let values = [5, 7, 9, 11];\nlet word = "abcd";\nvalues[1] = 8;\nvalues[0] = values[0] + 5;\nlet char = word[1];\nlet wordLength = word.length;\nlet part = word.slice(1, 3);\nfunction pair(name, score) {\n  return many(name, score + 1, "done");\n}\nlet result = pair("Ada", 6);\nconsole.log("ring3_default", char, wordLength, part, result[0], result.length, result[1], result[2]);\n',
      {
        sourceLanguage: "luascript",
        targetLanguage: "lua"
      }
    );
    assertIncludes(luascriptDefaultSemanticsResult.code, "__ls_index", "UnifiedLuaScript luascript default semantics->lua");
    assertIncludes(luascriptDefaultSemanticsResult.code, "__ls_length", "UnifiedLuaScript luascript default semantics length->lua");
    assertIncludes(luascriptDefaultSemanticsResult.code, "__ls_slice", "UnifiedLuaScript luascript default semantics slice->lua");
    assertIncludes(luascriptDefaultSemanticsResult.code, "__ls_many", "UnifiedLuaScript luascript default semantics many->lua");

    const rubyResult = await system.transpileSource(
      'def add(a, b)\n  return a + b\nend\n\ndef main\n  total = add(7, 5)\n  puts "ruby_arithmetic"\n  puts total\nend\n',
      {
        sourceLanguage: "ruby",
        targetLanguage: "lua"
      }
    );
    assertIncludes(rubyResult.code, 'print("ruby_arithmetic")', "UnifiedLuaScript ruby->lua");

    const phpResult = await system.transpileSource(
      "<?php\nfunction add($a, $b) {\n    return $a + $b;\n}\n\nfunction main() {\n    $total = add(4, 6);\n    echo \"php_arithmetic\";\n    echo $total;\n}\n?>\n",
      {
        sourceLanguage: "php",
        targetLanguage: "javascript"
      }
    );
    assertIncludes(phpResult.code, "function add", "UnifiedLuaScript php->javascript");
    assertIncludes(phpResult.code, 'console.log("php_arithmetic")', "UnifiedLuaScript php->javascript");

    const dartResult = await system.transpileSource(
      'double add(double a, double b) {\n  return a + b;\n}\n\nvoid main() {\n  double total = add(7, 8);\n  print("dart_arithmetic");\n  print(total);\n}\n',
      {
        sourceLanguage: "dart",
        targetLanguage: "python"
      }
    );
    assertIncludes(dartResult.code, "def add", "UnifiedLuaScript dart->python");
    assertIncludes(dartResult.code, 'print("dart_arithmetic")', "UnifiedLuaScript dart->python");
  } finally {
    system.shutdown();
  }
}

async function main() {
  testCoreLanguageBridge();
  testHarnessesUseCoreBridge();
  await testUnifiedLuaScriptBridge();
  console.log("Core language bridge tests passed");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
