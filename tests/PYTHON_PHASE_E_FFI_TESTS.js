"use strict";

/**
 * Python Phase E - FFI Generator Tests
 * Comprehensive tests for Python ↔ C binding generation
 */

const assert = require("assert");
const { PythonFFIGenerator } = require("../src/optimizers/python/phase_e/python_ffi_generator.js");

describe("Python Phase E - FFI Binding Generator", () => {
  let generator;

  beforeEach(() => {
    generator = new PythonFFIGenerator({
      targetLanguage: "c",
      generateHeaders: true,
      generateWrappers: true,
      safetyChecks: true,
    });
  });

  const buildIR = (body) => ({
    type: "Module",
    body,
    orelse: [],
  });

  const exportDecorator = [{ id: "export" }];

  describe("Function Export Detection", () => {
    it("generates bindings for exported functions", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "add",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "a", annotation: { id: "int" } }] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.success === true, "Generation should succeed");
      assert(result.functions.length === 1, "Should detect 1 function");
      assert(result.bindings.length > 0, "Bindings should be generated");
      assert(result.stats.bindingsGenerated > 0, "Stats should show bindings");
    });

    it("skips non-exported functions", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "internal",
          decorator_list: [],
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions.length === 1, "Function analyzed");
      assert(result.bindings.length === 0, "No bindings should be generated");
    });
  });

  describe("Type Mapping", () => {
    it("maps Python int to C long", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "identity",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "value", annotation: { id: "int" } }] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      const func = result.functions[0];
      assert(func.parameters[0].cType === "long", "int should map to long");
      assert(func.returnType === "long", "return type should be long");
    });

    it("maps Python float to C double", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "scale",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "value", annotation: { id: "float" } }] },
          returns: { id: "float" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      const func = result.functions[0];
      assert(func.parameters[0].cType === "double", "float should map to double");
      assert(func.returnType === "double", "return type should be double");
    });

    it("maps Python str to const char*", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "greet",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "name", annotation: { id: "str" } }] },
          returns: { id: "str" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      const func = result.functions[0];
      assert(func.parameters[0].cType === "const char*", "str should map to const char*");
      assert(func.parameters[0].isPointer === true, "str should be treated as pointer");
    });

    it("maps Python bool to C int", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "flag",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "enabled", annotation: { id: "bool" } }] },
          returns: { id: "bool" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      const func = result.functions[0];
      assert(func.parameters[0].cType === "int", "bool should map to int");
      assert(func.returnType === "int", "return bool should map to int");
    });

    it("falls back to PyObject* for unknown types", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "opaque",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "payload", annotation: { id: "Custom" } }] },
          returns: { id: "Custom" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      const func = result.functions[0];
      assert(func.parameters[0].cType === "PyObject*", "unknown types map to PyObject*");
      assert(func.returnType === "PyObject*", "unknown return type maps to PyObject*");
    });
  });

  describe("Struct Generation", () => {
    it("generates structs from exported classes", () => {
      const ir = buildIR([
        {
          type: "ClassDef",
          name: "Point",
          decorator_list: exportDecorator,
          body: [
            {
              type: "AnnAssign",
              target: { id: "x" },
              annotation: { id: "float" },
            },
            {
              type: "AnnAssign",
              target: { id: "y" },
              annotation: { id: "float" },
            },
          ],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.structs.length === 1, "Should generate 1 struct");
      assert(result.structs[0].fields.length === 2, "Struct should have 2 fields");
      assert(result.headers.includes("typedef struct"), "Header should include struct definition");
    });

    it("extracts fields from __init__ assignments", () => {
      const ir = buildIR([
        {
          type: "ClassDef",
          name: "Box",
          decorator_list: exportDecorator,
          body: [
            {
              type: "FunctionDef",
              name: "__init__",
              decorator_list: [],
              args: { args: [{ arg: "self" }, { arg: "value" }] },
              body: [
                {
                  type: "Assign",
                  targets: [{ value: { id: "self" }, attr: "value" }],
                  value: { type: "Name", id: "value" },
                },
              ],
            },
          ],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.structs.length === 1, "Struct should be generated");
      assert(result.structs[0].fields.length === 1, "Should extract field from __init__");
      assert(result.structs[0].fields[0].name === "value", "Field name should be 'value'");
    });
  });

  describe("Wrapper Generation", () => {
    it("generates safety checks for pointer parameters", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "print_name",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "name", annotation: { id: "str" } }] },
          returns: { id: "None" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.wrappers.includes("Null pointer"), "Wrapper should include null pointer check");
      assert(result.wrappers.includes("PyErr_SetString"), "Wrapper should set Python error");
    });
  });

  describe("Ctypes Binding Output", () => {
    it("generates ctypes binding code", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "multiply",
          decorator_list: exportDecorator,
          args: { args: [{ arg: "a", annotation: { id: "int" } }, { arg: "b", annotation: { id: "int" } }] },
          returns: { id: "int" },
          body: [
            { type: "Expr", value: { type: "Str", s: "Multiply values" } },
          ],
        },
      ]);

      const result = generator.generateBindings(ir);
      const binding = result.bindings.find(b => b.type === "function");
      assert(binding.ctype.pythonBinding.includes("restype"), "Binding should set restype");
      assert(binding.ctype.pythonBinding.includes("argtypes"), "Binding should set argtypes");
      assert(binding.ctype.pythonBinding.includes("def multiply"), "Binding should include wrapper function");
    });
  });

  describe("Multiple Parameters", () => {
    it("handles functions with no parameters", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "get_random",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].parameters.length === 0, "Should have 0 parameters");
    });

    it("handles functions with many parameters", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "sum_all",
          decorator_list: exportDecorator,
          args: { args: [
            { arg: "a", annotation: { id: "int" } },
            { arg: "b", annotation: { id: "int" } },
            { arg: "c", annotation: { id: "int" } },
            { arg: "d", annotation: { id: "int" } },
            { arg: "e", annotation: { id: "int" } },
          ]},
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].parameters.length === 5, "Should have 5 parameters");
    });

    it("handles mixed parameter types", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "process",
          decorator_list: exportDecorator,
          args: { args: [
            { arg: "count", annotation: { id: "int" } },
            { arg: "ratio", annotation: { id: "float" } },
            { arg: "name", annotation: { id: "str" } },
            { arg: "enabled", annotation: { id: "bool" } },
          ]},
          returns: { id: "str" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].parameters.length === 4, "Should have 4 parameters");
      assert(result.functions[0].parameters[0].cType === "long", "First param should be long");
      assert(result.functions[0].parameters[1].cType === "double", "Second param should be double");
      assert(result.functions[0].parameters[2].cType === "const char*", "Third param should be const char*");
      assert(result.functions[0].parameters[3].cType === "int", "Fourth param should be int");
    });
  });

  describe("Return Type Handling", () => {
    it("handles void return type", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "no_return",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "None" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].returnType === "void", "None should map to void");
    });

    it("handles list return type", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "get_list",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "list" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].returnType === "PyObject*", "list should map to PyObject*");
    });

    it("handles dict return type", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "get_dict",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "dict" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].returnType === "PyObject*", "dict should map to PyObject*");
    });

    it("handles tuple return type", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "get_tuple",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "tuple" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].returnType === "PyObject*", "tuple should map to PyObject*");
    });

    it("handles bytes return type", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "get_bytes",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "bytes" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].returnType === "const char*", "bytes should map to const char*");
    });
  });

  describe("Header Generation", () => {
    it("includes necessary headers", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "test",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.headers.includes("#ifndef"), "Header should include guard");
      assert(result.headers.includes("#define"), "Header should include define");
      assert(result.headers.includes("#include <Python.h>"), "Header should include Python.h");
      assert(result.headers.includes("#endif"), "Header should include endif");
    });

    it("declares all exported functions in header", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "func1",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
        {
          type: "FunctionDef",
          name: "func2",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "float" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.headers.includes("func1"), "Header should declare func1");
      assert(result.headers.includes("func2"), "Header should declare func2");
    });
  });

  describe("C Name Conversion", () => {
    it("converts Python snake_case to C names", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "my_function_name",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].cName === "my_function_name", "Snake case should remain");
    });

    it("removes special characters from names", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "test-func",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.functions[0].cName === "test_func", "Special chars should convert to underscore");
    });
  });

  describe("Statistics", () => {
    it("tracks functions generated", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "f1",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
        {
          type: "FunctionDef",
          name: "f2",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.stats.functionsGenerated === 2, "Should track 2 functions");
    });

    it("tracks structs generated", () => {
      const ir = buildIR([
        {
          type: "ClassDef",
          name: "Point",
          decorator_list: exportDecorator,
          body: [
            { type: "AnnAssign", target: { id: "x" }, annotation: { id: "float" } },
          ],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.stats.structsGenerated === 1, "Should track 1 struct");
    });

    it("tracks total bindings", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "f",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.stats.bindingsGenerated > 0, "Should track bindings");
    });
  });

  describe("Error Handling", () => {
    it("handles null IR gracefully", () => {
      const result = generator.generateBindings(null);
      assert(result.success === false || result.functions.length === 0, "Should handle null IR");
    });

    it("handles empty module", () => {
      const ir = buildIR([]);
      const result = generator.generateBindings(ir);
      assert(result.success === true, "Should handle empty module");
      assert(result.functions.length === 0, "Should have no functions");
    });

    it("handles malformed nodes", () => {
      const ir = buildIR([
        { type: "Unknown", data: "invalid" },
      ]);

      const result = generator.generateBindings(ir);
      assert(result.success === true, "Should skip invalid nodes");
    });
  });

  describe("Reset Functionality", () => {
    it("clears previous bindings on reset", () => {
      const ir = buildIR([
        {
          type: "FunctionDef",
          name: "test",
          decorator_list: exportDecorator,
          args: { args: [] },
          returns: { id: "int" },
          body: [],
        },
      ]);

      generator.generateBindings(ir);
      generator.reset();
      
      const result = generator.generateBindings(buildIR([]));
      assert(result.bindings.length === 0, "Bindings should be cleared after reset");
    });
  });
});
