"use strict";

/**
 * Syntax Family Classifier
 * Documents language families and feature sets
 * 
 * Purpose: Classify languages into families and provide capability matrix
 * for parser/lowerer/emitter configuration
 */

class LanguageTraits {
  constructor() {
    this.initializeLanguageFamilies();
    this.initializeCapabilityMatrix();
    this.initializeOperatorPrecedence();
    this.initializeKeywords();
    this.initializeScopeRules();
  }

  /**
   * Initialize language family definitions
   */
  initializeLanguageFamilies() {
    this.families = {
      'C-Family': {
        description: 'Imperative, compiled, static typing, manual memory',
        members: ['C', 'C++', 'C#', 'Objective-C', 'C--'],
        characteristics: {
          imperative: true,
          static: true,
          compiled: true,
          manualMemory: true,
          bracedBlocks: true,
          semicolonRequired: true,
        },
        sharedTraits: {
          functionPointers: true,
          macros: true,
          structs: true,
          unions: true,
          enums: true,
        },
      },
      'Dynamic Script': {
        description: 'Dynamic, interpreted, weak typing, garbage collected',
        members: ['Python', 'JavaScript', 'Ruby', 'Lua'],
        characteristics: {
          imperative: true,
          dynamic: true,
          interpreted: true,
          garbageCollected: true,
          indentationSignificant: false, // except Python
          weakTyping: true,
        },
        sharedTraits: {
          hoisting: true,
          firstClassFunctions: true,
          closures: true,
          prototypalOrDuckTyping: true,
        },
      },
      'Functional': {
        description: 'Immutable data, pure functions, pattern matching',
        members: ['OCaml', 'Haskell', 'Elm', 'Gleam', 'F#'],
        characteristics: {
          functional: true,
          immutable: true,
          patternMatching: true,
          typeInference: true,
          staticTyping: true,
        },
        sharedTraits: {
          algebraicDataTypes: true,
          patternMatching: true,
          noMutableState: true,
          recursion: true,
        },
      },
      'JVM-Based': {
        description: 'Bytecode compiled, JVM runtime, static typing',
        members: ['Java', 'Kotlin', 'Scala'],
        characteristics: {
          bytecodeCompiled: true,
          jvmRuntime: true,
          staticTyping: true,
          objectOriented: true,
          garbageCollected: true,
        },
        sharedTraits: {
          classesRequired: true,
          packageSystem: true,
          interfaces: true,
          generics: true,
        },
      },
    };
  }

  /**
   * Initialize language capability matrix
   */
  initializeCapabilityMatrix() {
    this.capabilities = {
      C: {
        functions: true,
        classes: false,
        inheritance: false,
        polymorphism: false,
        generics: false,
        firstClassFunctions: false,
        closures: false,
        async: false,
        exceptions: false,
        macros: true,
        typeAnnotations: true,
        decorators: false,
        contextManagers: false,
        comprehensions: false,
        typeInference: false,
        patternMatching: false,
        lambdas: false,
        variadic: true,
        overloading: false,
      },
      'C++': {
        functions: true,
        classes: true,
        inheritance: true,
        polymorphism: true,
        generics: true,
        firstClassFunctions: true,
        closures: true,
        async: false,
        exceptions: true,
        macros: true,
        typeAnnotations: true,
        decorators: false,
        contextManagers: false,
        comprehensions: false,
        typeInference: true,
        patternMatching: false,
        lambdas: true,
        variadic: true,
        overloading: true,
      },
      'C#': {
        functions: true,
        classes: true,
        inheritance: true,
        polymorphism: true,
        generics: true,
        firstClassFunctions: true,
        closures: true,
        async: true,
        exceptions: true,
        macros: false,
        typeAnnotations: true,
        decorators: true,
        contextManagers: true,
        comprehensions: false,
        typeInference: true,
        patternMatching: true,
        lambdas: true,
        variadic: true,
        overloading: true,
      },
      'Objective-C': {
        functions: true,
        classes: true,
        inheritance: true,
        polymorphism: true,
        generics: true,
        firstClassFunctions: false,
        closures: true,
        async: true,
        exceptions: true,
        macros: true,
        typeAnnotations: true,
        decorators: false,
        contextManagers: false,
        comprehensions: false,
        typeInference: false,
        patternMatching: false,
        lambdas: true,
        variadic: true,
        overloading: false,
      },
      'C--': {
        functions: true,
        classes: false,
        inheritance: false,
        polymorphism: false,
        generics: false,
        firstClassFunctions: false,
        closures: false,
        async: false,
        exceptions: false,
        macros: false,
        typeAnnotations: true,
        decorators: false,
        contextManagers: false,
        comprehensions: false,
        typeInference: false,
        patternMatching: false,
        lambdas: false,
        variadic: false,
        overloading: false,
      },
      Python: {
        functions: true,
        classes: true,
        inheritance: true,
        polymorphism: true,
        generics: false,
        firstClassFunctions: true,
        closures: true,
        async: true,
        exceptions: true,
        macros: false,
        typeAnnotations: true,
        decorators: true,
        contextManagers: true,
        comprehensions: true,
        typeInference: false,
        patternMatching: false,
        lambdas: true,
        variadic: true,
        overloading: false,
      },
      JavaScript: {
        functions: true,
        classes: true,
        inheritance: true,
        polymorphism: true,
        generics: false,
        firstClassFunctions: true,
        closures: true,
        async: true,
        exceptions: true,
        macros: false,
        typeAnnotations: false,
        decorators: true,
        contextManagers: false,
        comprehensions: true,
        typeInference: false,
        patternMatching: false,
        lambdas: true,
        variadic: true,
        overloading: false,
      },
      OCaml: {
        functions: true,
        classes: true,
        inheritance: false,
        polymorphism: false,
        generics: true,
        firstClassFunctions: true,
        closures: true,
        async: false,
        exceptions: true,
        macros: false,
        typeAnnotations: true,
        decorators: false,
        contextManagers: false,
        comprehensions: false,
        typeInference: true,
        patternMatching: true,
        lambdas: true,
        variadic: false,
        overloading: false,
      },
    };
  }

  /**
   * Initialize operator precedence per language family
   */
  initializeOperatorPrecedence() {
    // C-family precedence (C, C++, C#, Objective-C, C--)
    this.precedence = {
      'C-Family': {
        '()': 14,         // Function call, array subscript
        '.': 14,          // Member access
        '->': 14,         // Pointer member access
        '++': 13,         // Postfix increment
        '--': 13,         // Postfix decrement
        '!': 12,          // Logical NOT
        '~': 12,          // Bitwise NOT
        '+': 12,          // Unary plus
        '-': 12,          // Unary minus
        '++': 12,         // Prefix increment
        '--': 12,         // Prefix decrement
        '*': 12,          // Dereference, multiply
        '&': 12,          // Address-of, bitwise AND
        'sizeof': 12,     // Sizeof
        'type': 12,       // Type cast
        '*': 11,          // Multiplication
        '/': 11,          // Division
        '%': 11,          // Modulo
        '+': 10,          // Addition
        '-': 10,          // Subtraction
        '<<': 9,          // Left shift
        '>>': 9,          // Right shift
        '<': 8,           // Less than
        '>': 8,           // Greater than
        '<=': 8,          // Less than or equal
        '>=': 8,          // Greater than or equal
        '==': 7,          // Equal
        '!=': 7,          // Not equal
        '&': 6,           // Bitwise AND
        '^': 5,           // Bitwise XOR
        '|': 4,           // Bitwise OR
        '&&': 3,          // Logical AND
        '||': 2,          // Logical OR
        '?:': 1,          // Ternary conditional
        '=': 0,           // Assignment operators
        '+=': 0,
        '-=': 0,
        '*=': 0,
        '/=': 0,
        ',': -1,          // Comma operator
      },
      'Dynamic Script': {
        '()': 14,         // Function call
        '[]': 13,         // Array subscript
        '.': 13,          // Member access
        '!': 12,          // Logical NOT
        '~': 12,          // Bitwise NOT
        '+': 12,          // Unary plus
        '-': 12,          // Unary minus
        '*': 11,          // Multiplication
        '/': 11,          // Division
        '%': 11,          // Modulo
        '+': 10,          // Addition
        '-': 10,          // Subtraction
        '<<': 9,          // Left shift
        '>>': 9,          // Right shift
        '<': 8,           // Less than
        '>': 8,           // Greater than
        '==': 7,          // Equal (loose)
        '!=': 7,          // Not equal (loose)
        '===': 7,         // Equal (strict, JS only)
        '!==': 7,         // Not equal (strict, JS only)
        '&': 6,           // Bitwise AND
        '^': 5,           // Bitwise XOR
        '|': 4,           // Bitwise OR
        '&&': 3,          // Logical AND
        '||': 2,          // Logical OR
        '?:': 1,          // Ternary conditional
        '=': 0,           // Assignment
        '+=': 0,
        '-=': 0,
        '**': 13,         // Exponentiation (JS)
      },
      'Functional': {
        'apply': 14,      // Function application
        '|': 13,          // Pipe
        '^': 12,          // Exponentiation
        '*': 11,          // Multiplication
        '/': 11,          // Division
        '%': 11,          // Modulo
        '+': 10,          // Addition
        '-': 10,          // Subtraction
        '::': 9,          // Cons (list construction)
        '==': 8,          // Equal
        '<': 8,           // Less than
        '>': 8,           // Greater than
        '&&': 3,          // Logical AND
        '||': 2,          // Logical OR
        ',': 0,           // Tuple construction
      },
    };
  }

  /**
   * Initialize reserved keywords per language
   */
  initializeKeywords() {
    this.keywords = {
      C: [
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
        'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
        'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
        'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
        'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary'
      ],
      'C++': [
        'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
        'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t',
        'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
        'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype',
        'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
        'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
        'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept',
        'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected',
        'public', 'register', 'reinterpret_cast', 'requires', 'return', 'short',
        'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct',
        'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try',
        'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual',
        'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
      ],
      Python: [
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
        'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
        'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
        'while', 'with', 'yield'
      ],
      JavaScript: [
        'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case',
        'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default',
        'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends',
        'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if',
        'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let',
        'long', 'native', 'new', 'null', 'package', 'private', 'protected',
        'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized',
        'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var',
        'void', 'volatile', 'while', 'with', 'yield'
      ],
    };
  }

  /**
   * Initialize scoping rules per language family
   */
  initializeScopeRules() {
    this.scopeRules = {
      'C-Family': {
        blockScoped: true,
        functionScoped: false,
        globalScope: true,
        lexicalScoping: true,
        shadowing: true,
        hoisting: false,
      },
      'Dynamic Script': {
        blockScoped: false,
        functionScoped: true,
        globalScope: true,
        lexicalScoping: true,
        shadowing: true,
        hoisting: true,
      },
      'Functional': {
        blockScoped: false,
        functionScoped: true,
        globalScope: true,
        lexicalScoping: true,
        shadowing: false,
        hoisting: false,
      },
    };
  }

  /**
   * Get language family
   */
  getFamily(language) {
    for (const [familyName, family] of Object.entries(this.families)) {
      if (family.members.includes(language)) {
        return { name: familyName, ...family };
      }
    }
    return null;
  }

  /**
   * Get capability for language
   */
  hasCapability(language, capability) {
    return this.capabilities[language]?.[capability] || false;
  }

  /**
   * Get operator precedence for language
   */
  getOperatorPrecedence(language, operator) {
    const family = this.getFamily(language);
    if (!family) return null;
    return this.precedence[family.name]?.[operator] || null;
  }

  /**
   * Check if identifier is reserved in language
   */
  isReserved(language, identifier) {
    return (this.keywords[language] || []).includes(identifier);
  }

  /**
   * Get scope rules for language
   */
  getScopeRules(language) {
    const family = this.getFamily(language);
    if (!family) return null;
    return this.scopeRules[family.name];
  }

  /**
   * Get capability matrix for language
   */
  getCapabilities(language) {
    return this.capabilities[language] || {};
  }

  /**
   * Verify language is supported
   */
  isSupported(language) {
    return language in this.capabilities;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.capabilities);
  }
}

module.exports = LanguageTraits;
