"use strict";

/**
 * Python FFI (Foreign Function Interface) Binding Generator
 * 
 * Generates C-compatible bindings for Python code to enable:
 * - Calling C functions from Python
 * - Calling Python functions from C
 * - Type marshalling between C and Python
 * - Memory management across language boundaries
 * 
 * Phase E Component: Security & Interoperability
 */

class PythonFFIGenerator {
  constructor(options = {}) {
    this.options = {
      targetLanguage: options.targetLanguage || "c",
      useCTypes: options.useCTypes !== false,
      generateHeaders: options.generateHeaders !== false,
      generateWrappers: options.generateWrappers !== false,
      safetyChecks: options.safetyChecks !== false,
      nullTerminatedStrings: options.nullTerminatedStrings !== false,
      errorHandling: options.errorHandling || "exceptions", // exceptions, return_codes, both
      ...options,
    };

    this.bindings = [];
    this.types = new Map();
    this.functions = [];
    this.structs = [];
    this.errors = [];
  }

  /**
   * Analyze IR and generate FFI bindings
   */
  generateBindings(ir) {
    this.reset();

    try {
      this._analyzeIR(ir);
      this._inferTypes();
      this._generateCTypes();
      this._generateWrappers();
      this._generateHeaders();

      return {
        success: true,
        bindings: this.bindings,
        functions: this.functions,
        structs: this.structs,
        headers: this._getHeaderCode(),
        wrappers: this._getWrapperCode(),
        stats: this._getStats(),
      };
    } catch (error) {
      this.errors.push({
        type: "GENERATION_ERROR",
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        errors: this.errors,
      };
    }
  }

  /**
   * Analyze IR for FFI-compatible patterns
   */
  _analyzeIR(node) {
    if (!node) return;

    switch (node.type) {
    case "FunctionDef":
      this._analyzeFunctionDef(node);
      break;

    case "ClassDef":
      this._analyzeClassDef(node);
      break;

    case "Assign":
      this._analyzeAssign(node);
      break;

    case "Call":
      this._analyzeCall(node);
      break;
    }

    // Recurse through children
    if (node.body) {
      if (Array.isArray(node.body)) {
        node.body.forEach(child => this._analyzeIR(child));
      } else {
        this._analyzeIR(node.body);
      }
    }

    if (node.orelse) {
      if (Array.isArray(node.orelse)) {
        node.orelse.forEach(child => this._analyzeIR(child));
      } else {
        this._analyzeIR(node.orelse);
      }
    }
  }

  /**
   * Analyze function definition for FFI binding
   */
  _analyzeFunctionDef(node) {
    const func = {
      name: node.name,
      pythonName: node.name,
      cName: this._pythonToCName(node.name),
      parameters: [],
      returnType: "PyObject*", // Default
      decorators: node.decorator_list || [],
      isExported: this._hasExportDecorator(node),
      isCallback: this._hasCallbackDecorator(node),
      docstring: this._extractDocstring(node),
    };

    // Analyze parameters
    if (node.args && node.args.args) {
      node.args.args.forEach(arg => {
        func.parameters.push({
          name: arg.arg,
          pythonType: arg.annotation ? this._extractType(arg.annotation) : "Any",
          cType: this._pythonTypeToCType(arg.annotation),
          isPointer: this._requiresPointer(arg.annotation),
        });
      });
    }

    // Analyze return type
    if (node.returns) {
      func.returnType = this._pythonTypeToCType(node.returns);
    }

    this.functions.push(func);
  }

  /**
   * Analyze class definition for struct generation
   */
  _analyzeClassDef(node) {
    const struct = {
      name: node.name,
      pythonName: node.name,
      cName: this._pythonToCName(node.name),
      fields: [],
      methods: [],
      isExported: this._hasExportDecorator(node),
    };

    // Analyze class body for fields and methods
    if (node.body) {
      node.body.forEach(item => {
        if (item.type === "FunctionDef") {
          if (item.name === "__init__") {
            // Extract fields from __init__
            this._extractFieldsFromInit(item, struct);
          } else if (!item.name.startsWith("_")) {
            // Public method
            struct.methods.push({
              name: item.name,
              cName: `${struct.cName}_${this._pythonToCName(item.name)}`,
            });
          }
        } else if (item.type === "AnnAssign") {
          // Type-annotated field
          struct.fields.push({
            name: item.target.id,
            pythonType: this._extractType(item.annotation),
            cType: this._pythonTypeToCType(item.annotation),
          });
        }
      });
    }

    if (struct.isExported) {
      this.structs.push(struct);
    }
  }

  /**
   * Analyze assignment for module-level exports
   */
  _analyzeAssign(node) {
    // Track module-level variables that might be exported
    if (node.targets && node.targets[0] && node.targets[0].id) {
      const varName = node.targets[0].id;
      if (varName.startsWith("EXPORT_") || varName === "__all__") {
        // Track for export
        this.types.set(varName, {
          type: "module_export",
          value: node.value,
        });
      }
    }
  }

  /**
   * Analyze function calls for ctypes usage
   */
  _analyzeCall(node) {
    if (node.func && node.func.attr) {
      const attr = node.func.attr;
      
      // Detect ctypes.CDLL, ctypes.windll, etc.
      if (attr === "CDLL" || attr === "WinDLL" || attr === "OleDLL") {
        this.bindings.push({
          type: "library_load",
          library: this._extractStringValue(node.args[0]),
          mode: attr,
        });
      }

      // Detect ctypes function declarations
      if (attr === "CFUNCTYPE" || attr === "WINFUNCTYPE") {
        this.bindings.push({
          type: "function_type",
          callback: true,
          convention: attr === "CFUNCTYPE" ? "cdecl" : "stdcall",
        });
      }
    }
  }

  /**
   * Infer types from usage patterns
   */
  _inferTypes() {
    this.functions.forEach(func => {
      func.parameters.forEach(param => {
        if (param.pythonType === "Any") {
          // Try to infer from usage
          param.pythonType = "object";
          param.cType = "PyObject*";
        }
      });
    });
  }

  /**
   * Generate ctypes-compatible type definitions
   */
  _generateCTypes() {
    // Generate for each function
    this.functions.forEach(func => {
      if (func.isExported) {
        const ctype = {
          name: func.name,
          restype: func.returnType,
          argtypes: func.parameters.map(p => p.cType),
          pythonBinding: this._generatePythonCTypesBinding(func),
        };

        this.bindings.push({
          type: "function",
          function: func,
          ctype: ctype,
        });
      }
    });

    // Generate for each struct
    this.structs.forEach(struct => {
      const ctype = {
        name: struct.name,
        fields: struct.fields.map(f => [f.name, f.cType]),
        pythonBinding: this._generatePythonStructBinding(struct),
      };

      this.bindings.push({
        type: "struct",
        struct: struct,
        ctype: ctype,
      });
    });
  }

  /**
   * Generate wrapper functions with safety checks
   */
  _generateWrappers() {
    if (!this.options.generateWrappers) return;

    this.functions.forEach(func => {
      if (func.isExported) {
        const wrapper = this._generateFunctionWrapper(func);
        func.wrapper = wrapper;
      }
    });
  }

  /**
   * Generate C header code
   */
  _generateHeaders() {
    if (!this.options.generateHeaders) return;
  }

  /**
   * Generate function wrapper with safety checks
   */
  _generateFunctionWrapper(func) {
    const lines = [];
    const wrapperName = `${func.cName}_wrapper`;

    // Wrapper signature
    lines.push(`static ${func.returnType} ${wrapperName}(`);
    
    const paramList = func.parameters.map(p => `${p.cType} ${p.name}`).join(", ");
    lines.push(`    ${paramList || "void"}`);
    lines.push(") {");

    // Safety checks
    if (this.options.safetyChecks) {
      func.parameters.forEach(param => {
        if (param.isPointer) {
          lines.push(`    if (${param.name} == NULL) {`);
          if (this.options.errorHandling === "exceptions" || this.options.errorHandling === "both") {
            lines.push(`        PyErr_SetString(PyExc_ValueError, "Null pointer: ${param.name}");`);
          }
          if (this.options.errorHandling === "return_codes" || this.options.errorHandling === "both") {
            lines.push("        return NULL;");
          }
          lines.push("    }");
        }
      });
    }

    // Call original function
    const argList = func.parameters.map(p => p.name).join(", ");
    lines.push(`    return ${func.cName}(${argList});`);
    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate Python ctypes binding
   */
  _generatePythonCTypesBinding(func) {
    const lines = [];

    lines.push(`# Binding for ${func.pythonName}`);
    lines.push(`lib.${func.cName}.restype = ${this._cTypeToPythonCType(func.returnType)}`);
    
    if (func.parameters.length > 0) {
      const argtypes = func.parameters.map(p => this._cTypeToPythonCType(p.cType)).join(", ");
      lines.push(`lib.${func.cName}.argtypes = [${argtypes}]`);
    }

    lines.push("");
    lines.push(`def ${func.pythonName}(${func.parameters.map(p => p.name).join(", ")}):`);
    lines.push(`    """${func.docstring || "FFI wrapper for " + func.cName}"""`);
    
    const callArgs = func.parameters.map(p => p.name).join(", ");
    lines.push(`    return lib.${func.cName}(${callArgs})`);

    return lines.join("\n");
  }

  /**
   * Generate Python struct binding
   */
  _generatePythonStructBinding(struct) {
    const lines = [];

    lines.push(`class ${struct.pythonName}(ctypes.Structure):`);
    lines.push(`    """FFI binding for C struct ${struct.cName}"""`);
    lines.push("    _fields_ = [");
    
    struct.fields.forEach(field => {
      lines.push(`        ("${field.name}", ${this._cTypeToPythonCType(field.cType)}),`);
    });
    
    lines.push("    ]");

    return lines.join("\n");
  }

  /**
   * Get generated header code
   */
  _getHeaderCode() {
    const lines = [];

    lines.push("#ifndef PYTHON_FFI_BINDINGS_H");
    lines.push("#define PYTHON_FFI_BINDINGS_H");
    lines.push("");
    lines.push("#include <Python.h>");
    lines.push("");

    // Struct declarations
    this.structs.forEach(struct => {
      lines.push(`typedef struct ${struct.cName} {`);
      struct.fields.forEach(field => {
        lines.push(`    ${field.cType} ${field.name};`);
      });
      lines.push(`} ${struct.cName};`);
      lines.push("");
    });

    // Function declarations
    this.functions.forEach(func => {
      if (func.isExported) {
        const paramList = func.parameters.map(p => `${p.cType} ${p.name}`).join(", ");
        lines.push(`${func.returnType} ${func.cName}(${paramList || "void"});`);
      }
    });

    lines.push("");
    lines.push("#endif // PYTHON_FFI_BINDINGS_H");

    return lines.join("\n");
  }

  /**
   * Get generated wrapper code
   */
  _getWrapperCode() {
    const lines = [];

    this.functions.forEach(func => {
      if (func.wrapper) {
        lines.push(func.wrapper);
        lines.push("");
      }
    });

    return lines.join("\n");
  }

  /**
   * Get generation statistics
   */
  _getStats() {
    return {
      functionsGenerated: this.functions.filter(f => f.isExported).length,
      structsGenerated: this.structs.length,
      bindingsGenerated: this.bindings.length,
      wrappersGenerated: this.functions.filter(f => f.wrapper).length,
      errorsDetected: this.errors.length,
    };
  }

  /**
   * Convert Python name to C-compatible name
   */
  _pythonToCName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  /**
   * Convert Python type annotation to C type
   */
  _pythonTypeToCType(annotation) {
    if (!annotation) return "PyObject*";

    const typeMap = {
      "int": "long",
      "float": "double",
      "str": "const char*",
      "bool": "int",
      "bytes": "const char*",
      "list": "PyObject*",
      "dict": "PyObject*",
      "tuple": "PyObject*",
      "set": "PyObject*",
      "None": "void",
      "Any": "PyObject*",
    };

    const typeName = this._extractType(annotation);
    return typeMap[typeName] || "PyObject*";
  }

  /**
   * Convert C type to Python ctypes
   */
  _cTypeToPythonCType(cType) {
    const typeMap = {
      "long": "ctypes.c_long",
      "int": "ctypes.c_int",
      "short": "ctypes.c_short",
      "char": "ctypes.c_char",
      "double": "ctypes.c_double",
      "float": "ctypes.c_float",
      "const char*": "ctypes.c_char_p",
      "char*": "ctypes.c_char_p",
      "void": "None",
      "PyObject*": "ctypes.py_object",
    };

    return typeMap[cType] || "ctypes.c_void_p";
  }

  /**
   * Extract type from annotation node
   */
  _extractType(annotation) {
    if (!annotation) return "Any";
    if (annotation.id) return annotation.id;
    if (annotation.value && annotation.value.id) return annotation.value.id;
    return "Any";
  }

  /**
   * Check if parameter requires pointer type
   */
  _requiresPointer(annotation) {
    const type = this._extractType(annotation);
    return ["str", "bytes", "list", "dict", "tuple", "set"].includes(type);
  }

  /**
   * Check if function has export decorator
   */
  _hasExportDecorator(node) {
    if (!node.decorator_list) return false;
    return node.decorator_list.some(dec => 
      (dec.id && dec.id === "export") || 
      (dec.func && dec.func.id === "export")
    );
  }

  /**
   * Check if function has callback decorator
   */
  _hasCallbackDecorator(node) {
    if (!node.decorator_list) return false;
    return node.decorator_list.some(dec => 
      (dec.id && dec.id === "callback") || 
      (dec.func && dec.func.id === "callback")
    );
  }

  /**
   * Extract docstring from function
   */
  _extractDocstring(node) {
    if (node.body && node.body.length > 0) {
      const first = node.body[0];
      if (first.type === "Expr" && first.value.type === "Str") {
        return first.value.s;
      }
    }
    return "";
  }

  /**
   * Extract fields from __init__ method
   */
  _extractFieldsFromInit(initNode, struct) {
    if (!initNode.body) return;

    initNode.body.forEach(stmt => {
      if (stmt.type === "Assign" && stmt.targets[0].value && stmt.targets[0].value.id === "self") {
        const fieldName = stmt.targets[0].attr;
        struct.fields.push({
          name: fieldName,
          pythonType: "Any",
          cType: "PyObject*",
        });
      }
    });
  }

  /**
   * Extract string value from node
   */
  _extractStringValue(node) {
    if (!node) return "";
    if (node.type === "Str") return node.s;
    if (node.type === "Constant" && typeof node.value === "string") return node.value;
    return "";
  }

  /**
   * Reset generator state
   */
  reset() {
    this.bindings = [];
    this.types = new Map();
    this.functions = [];
    this.structs = [];
    this.errors = [];
  }
}

module.exports = { PythonFFIGenerator };
