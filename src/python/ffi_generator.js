"use strict";

const { PythonFFIGenerator } = require("../optimizers/python/phase_e/python_ffi_generator");

class FFIGenerator extends PythonFFIGenerator {
  generate(_lang, cDef) {
    return `# ctypes binding\nimport ctypes\n# ${cDef}`;
  }
}

module.exports = { FFIGenerator };
