"use strict";

/**
 * FFI & Calling Conventions Mapper
 * Maps language-specific calling conventions to canonical IR
 * 
 * Purpose: Handle FFI, calling conventions (cdecl, stdcall, fastcall, etc.)
 * and C++ ABI compatibility for all supported languages
 */

class CallingConventionMapper {
  constructor(platform = "x64") {
    this.platform = platform;
    this.initializeConventions();
    this.initializeABIs();
    this.initializeParameterPassing();
  }

  /**
   * Initialize calling convention definitions
   */
  initializeConventions() {
    this.conventions = {
      // System V AMD64 ABI (Linux, BSD, modern Unix)
      "sysv-amd64": {
        name: "System V AMD64 ABI",
        platform: "x64",
        registers: {
          integerArgs: ["rdi", "rsi", "rdx", "rcx", "r8", "r9"],
          floatArgs: ["xmm0", "xmm1", "xmm2", "xmm3", "xmm4", "xmm5", "xmm6", "xmm7"],
          returnInt: "rax",
          returnFloat: "rdx:rax", // for long double
          callerSaved: ["rax", "rcx", "rdx", "rsi", "rdi", "r8", "r9", "r10", "r11"],
          calleeSaved: ["rbx", "rsp", "rbp", "r12", "r13", "r14", "r15"],
        },
        stackAlignment: 16,
        passStructsInRegs: true,
        aggregatePassingLimit: 64, // bytes
      },

      // Microsoft x64 calling convention (Windows, MSVC)
      "msvc-x64": {
        name: "Microsoft x64",
        platform: "x64",
        registers: {
          integerArgs: ["rcx", "rdx", "r8", "r9"],
          floatArgs: ["xmm0", "xmm1", "xmm2", "xmm3"],
          returnInt: "rax",
          returnFloat: "xmm0:xmm1",
          callerSaved: ["rax", "rcx", "rdx", "r8", "r9", "r10", "r11"],
          calleeSaved: ["rbx", "rsp", "rbp", "rsi", "rdi", "r12", "r13", "r14", "r15"],
        },
        stackAlignment: 16,
        passStructsInRegs: false,
        aggregatePassingLimit: 0, // structs passed by reference
      },

      // x86-32 cdecl (C declaration, default for C)
      "cdecl": {
        name: "C Declaration (cdecl)",
        platform: "x86",
        registers: {
          integerArgs: [],           // Stack-based
          floatArgs: [],
          returnInt: "eax",
          returnFloat: "st0",
          callerSaved: ["eax", "ecx", "edx"],
          calleeSaved: ["ebx", "esp", "ebp", "esi", "edi"],
        },
        stackAlignment: 4,
        passStructsInRegs: false,
        parameterOrder: "rtl",        // Right-to-left (stack)
        returnClearsStack: false,     // Caller clears
      },

      // x86-32 stdcall (Windows API)
      "stdcall": {
        name: "Standard Call (stdcall)",
        platform: "x86",
        registers: {
          integerArgs: [],           // Stack-based
          floatArgs: [],
          returnInt: "eax",
          returnFloat: "st0",
          callerSaved: ["eax", "ecx", "edx"],
          calleeSaved: ["ebx", "esp", "ebp", "esi", "edi"],
        },
        stackAlignment: 4,
        passStructsInRegs: false,
        parameterOrder: "rtl",
        returnClearsStack: true,      // Callee clears (important)
      },

      // x86-32 fastcall (Microsoft)
      "fastcall": {
        name: "Fast Call (fastcall)",
        platform: "x86",
        registers: {
          integerArgs: ["ecx", "edx"],
          floatArgs: [],
          returnInt: "eax",
          returnFloat: "st0",
          callerSaved: ["eax", "ecx", "edx"],
          calleeSaved: ["ebx", "esp", "ebp", "esi", "edi"],
        },
        stackAlignment: 4,
        passStructsInRegs: false,
        parameterOrder: "rtl",        // Remaining params on stack
        returnClearsStack: true,
      },

      // ARM 32-bit EABI
      "arm-eabi": {
        name: "ARM EABI",
        platform: "arm32",
        registers: {
          integerArgs: ["r0", "r1", "r2", "r3"],
          floatArgs: ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7"],
          returnInt: "r0",
          returnFloat: "d0:d1",
          callerSaved: ["r0", "r1", "r2", "r3", "r12", "r14"],
          calleeSaved: ["r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11", "sp", "lr", "pc"],
        },
        stackAlignment: 8,
        passStructsInRegs: true,
        aggregatePassingLimit: 128, // bytes
      },

      // ARM 64-bit ABI
      "arm-aarch64": {
        name: "ARM AArch64 ABI",
        platform: "arm64",
        registers: {
          integerArgs: ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7"],
          floatArgs: ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7"],
          returnInt: "x0:x1",
          returnFloat: "d0:d1",
          callerSaved: ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x16", "x17"],
          calleeSaved: ["x19", "x20", "x21", "x22", "x23", "x24", "x25", "x26", "x27", "x28", "sp", "lr", "pc"],
        },
        stackAlignment: 16,
        passStructsInRegs: true,
        aggregatePassingLimit: 128,
      },
    };
  }

  /**
   * Initialize C++ ABI definitions
   */
  initializeABIs() {
    this.abis = {
      "itanium": {
        name: "Itanium C++ ABI",
        platforms: ["x64", "arm64", "x86"],
        nameMangling: "itanium",
        vTableLayout: "standard",
        rtti: true,
        exceptions: true,
        nameDecorationFormat: "_Z...",
      },
      "msvc": {
        name: "Microsoft C++ ABI",
        platforms: ["x64", "x86", "arm64"],
        nameMangling: "microsoft",
        vTableLayout: "microsoft",
        rtti: true,
        exceptions: "structured",
        nameDecorationFormat: "?...",
      },
      "objc": {
        name: "Objective-C ABI",
        platforms: ["x64", "arm64"],
        nameMangling: "objc",
        messageDispatching: "runtime",
        selectors: true,
        methodLookup: "hashtable",
      },
    };
  }

  /**
   * Initialize parameter passing strategies
   */
  initializeParameterPassing() {
    this.parameterStrategies = {
      // Direct register passing (most efficient)
      register: {
        name: "Register Passing",
        usesRegisters: true,
        stackBased: false,
        maxSize: 64, // bits
      },
      // Stack passing (for overflow or convenience)
      stack: {
        name: "Stack Passing",
        usesRegisters: false,
        stackBased: true,
        maxSize: null, // unlimited
      },
      // Register + stack hybrid
      hybrid: {
        name: "Register + Stack Hybrid",
        usesRegisters: true,
        stackBased: true,
        maxSize: 512, // bits in registers, rest on stack
      },
      // Aggregate by reference
      byReference: {
        name: "Aggregate By Reference",
        usesRegisters: false,
        stackBased: false,
        passReference: true,
        maxSize: 128, // bytes - above this, must use reference
      },
    };
  }

  /**
   * Get calling convention for language + platform
   */
  getCallingConvention(language, platform = this.platform) {
    const defaults = {
      C: "cdecl",            // x86
      "C++": "cdecl",
      "C#": "stdcall",       // Windows-oriented
      "Objective-C": "sysv-amd64",
      "C--": "sysv-amd64",
      Python: "sysv-amd64",
    };

    // Platform overrides
    if (platform === "x64" || platform === "amd64") {
      if (language === "C#" || language === "C++") {
        return this.conventions["msvc-x64"] || this.conventions["sysv-amd64"];
      }
      return this.conventions["sysv-amd64"];
    }
    if (platform === "arm64" || platform === "aarch64") {
      return this.conventions["arm-aarch64"];
    }
    if (platform === "arm" || platform === "arm32") {
      return this.conventions["arm-eabi"];
    }

    const defaultConv = defaults[language] || "cdecl";
    return this.conventions[defaultConv];
  }

  /**
   * Get C++ ABI for language + platform
   */
  getCppABI(language, platform = this.platform) {
    if (language === "C#") return this.abis.msvc;
    if (language === "Objective-C") return this.abis.objc;
    
    // Default to Itanium for C/C++ on most platforms
    return this.abis.itanium;
  }

  /**
   * Calculate parameter passing strategy
   * @param {object} parameter - Parameter descriptor { type, size }
   * @param {string} convention - Calling convention name
   * @returns {object} Passing strategy
   */
  calculateParameterPassing(parameter, convention) {
    const conv = this.conventions[convention];
    if (!conv) throw new Error(`Unknown calling convention: ${convention}`);

    const paramSize = parameter.size || 64; // bits
    const isAggregate = parameter.aggregate || false;
    const isFloatingPoint = parameter.type === "float" || parameter.type === "double";

    // Aggregates larger than limit passed by reference
    if (isAggregate && conv.aggregatePassingLimit && paramSize > conv.aggregatePassingLimit) {
      return {
        strategy: "byReference",
        mechanism: "stack",
        passPointer: true,
      };
    }

    // Floating point uses dedicated registers
    if (isFloatingPoint && conv.registers.floatArgs.length > 0) {
      return {
        strategy: "register",
        mechanism: "fpuRegister",
        register: conv.registers.floatArgs[0],
      };
    }

    // Integer parameters
    if (conv.registers.integerArgs.length > 0) {
      return {
        strategy: "register",
        mechanism: "integerRegister",
        register: conv.registers.integerArgs[0],
      };
    }

    // Fall back to stack
    return {
      strategy: "stack",
      mechanism: "stack",
      offset: 0, // Relative to frame pointer
    };
  }

  /**
   * Calculate return value location
   * @param {object} returnType - Return type descriptor
   * @param {string} convention - Calling convention name
   * @returns {object} Return location
   */
  calculateReturnLocation(returnType, convention) {
    const conv = this.conventions[convention];
    if (!conv) throw new Error(`Unknown calling convention: ${convention}`);

    const isFloatingPoint = returnType.type === "float" || returnType.type === "double";
    const returnSize = returnType.size || 64; // bits

    // Void returns nowhere
    if (returnType.type === "void") {
      return { location: "none" };
    }

    // Floating point returns in FPU register
    if (isFloatingPoint) {
      return {
        location: "fpuRegister",
        register: conv.registers.returnFloat,
      };
    }

    // Large aggregates returned by reference (caller provides buffer)
    if (returnSize > 64) {
      return {
        location: "memory",
        mechanism: "pointerInRegister",
        register: conv.registers.integerArgs[0],
      };
    }

    // Integer/pointer return
    return {
      location: "integerRegister",
      register: conv.registers.returnInt,
    };
  }

  /**
   * Validate function signature against convention
   * @param {object} signature - Function signature
   * @param {string} convention - Calling convention
   * @returns {object} Validation result
   */
  validateSignature(signature, convention) {
    const errors = [];
    const warnings = [];
    const conv = this.conventions[convention];

    if (!conv) {
      errors.push(`Unknown calling convention: ${convention}`);
      return { valid: false, errors, warnings };
    }

    // Check parameter count against available registers
    const regCount = conv.registers.integerArgs.length + conv.registers.floatArgs.length;
    if (signature.parameters && signature.parameters.length > regCount + 10) {
      warnings.push(`Function has ${signature.parameters.length} parameters, mostly stack-passed`);
    }

    // Check for variadic parameter correctness
    if (signature.variadic) {
      if (!conv.registers.integerArgs || conv.registers.integerArgs.length === 0) {
        errors.push("Variadic functions not supported with this calling convention");
      }
    }

    // Validate struct passing if applicable
    for (const param of signature.parameters || []) {
      if (param.aggregate && param.size > (conv.aggregatePassingLimit || 0)) {
        if (!conv.passStructsInRegs) {
          // Expects passing by reference
          if (!param.byReference) {
            warnings.push(`Aggregate parameter ${param.name} should be passed by reference`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      convention: conv.name,
    };
  }

  /**
   * Get name mangling scheme for language
   * @param {string} language - Language name
   * @returns {string} Mangling scheme
   */
  getNameManglingScheme(language) {
    if (language === "C#") return "microsoft";
    if (language === "Objective-C") return "objc";
    if (language === "C" || language === "C--") return "none";
    return "itanium"; // Default for C++
  }

  /**
   * Demangle C++ name
   * @param {string} mangledName - Mangled name
   * @param {string} scheme - Mangling scheme
   * @returns {object} Demangled info or null
   */
  demangleName(mangledName, scheme = "itanium") {
    if (scheme === "itanium" && mangledName.startsWith("_Z")) {
      // Simplified itanium demangling
      return {
        scheme: "itanium",
        mangled: mangledName,
        // In real implementation, would parse components
        parsed: true,
      };
    }
    if (scheme === "microsoft" && mangledName.startsWith("?")) {
      return {
        scheme: "microsoft",
        mangled: mangledName,
        parsed: true,
      };
    }
    return null;
  }

  /**
   * Get FFI bridge code for calling external function
   * @param {object} functionSignature - External function signature
   * @param {string} sourceLanguage - Source language
   * @param {string} targetLanguage - Target language (usually C)
   * @returns {string} FFI bridge code snippet
   */
  generateFFIBridge(functionSignature, sourceLanguage, targetLanguage = "C") {
    const convention = this.getCallingConvention(targetLanguage);
    
    return {
      sourceLanguage,
      targetLanguage,
      callingConvention: convention.name,
      signature: functionSignature,
      bridgeStrategy: "wrapper",
      annotations: {
        extern: true,
        ffi: true,
        convention: convention.name,
      },
    };
  }
}

module.exports = CallingConventionMapper;
