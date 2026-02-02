"use strict";

/**
 * Syntax Family Classifier
 * Documents language families, syntax rules, and feature sets
 * 
 * Language Families:
 * - C-Family: C, C++, C#, Objective-C, C--
 * - Dynamic Script: JavaScript, Lua, Python
 * - Functional: (Future: Haskell, ML, etc.)
 * - Legacy: (Future: COBOL, Fortran, etc.)
 * 
 * Purpose: Classify languages by syntax patterns to enable shared parsing/lowering logic
 */

/**
 * Language Family Definitions
 */
const LanguageFamilies = {
  C_FAMILY: "c-family",
  DYNAMIC_SCRIPT: "dynamic-script",
  FUNCTIONAL: "functional",
  LEGACY: "legacy",
  OTHER: "other"
};

/**
 * Operator Precedence Levels (higher = higher precedence)
 */
const OperatorPrecedence = {
  // Level 1 (Highest) - Postfix
  POSTFIX: 15,              // x++, x--, ()[], ->., etc.
  
  // Level 2 - Prefix/Unary
  UNARY: 14,                // ++x, --x, +x, -x, !, ~, *, &, sizeof
  
  // Level 3 - Multiplication
  MULTIPLICATIVE: 13,       // *, /, %
  
  // Level 4 - Addition
  ADDITIVE: 12,             // +, -
  
  // Level 5 - Bitwise Shift
  SHIFT: 11,                // <<, >>
  
  // Level 6 - Relational
  RELATIONAL: 10,           // <, <=, >, >=
  
  // Level 7 - Equality
  EQUALITY: 9,              // ==, !=
  
  // Level 8 - Bitwise AND
  BITWISE_AND: 8,           // &
  
  // Level 9 - Bitwise XOR
  BITWISE_XOR: 7,           // ^
  
  // Level 10 - Bitwise OR
  BITWISE_OR: 6,            // |
  
  // Level 11 - Logical AND
  LOGICAL_AND: 5,           // &&
  
  // Level 12 - Logical OR
  LOGICAL_OR: 4,            // ||
  
  // Level 13 - Ternary/Conditional
  CONDITIONAL: 3,           // ?:
  
  // Level 14 - Assignment
  ASSIGNMENT: 2,            // =, +=, -=, *=, /=, etc.
  
  // Level 15 (Lowest) - Comma
  COMMA: 1                  // ,
};

/**
 * Scoping Rule Types
 */
const ScopingRules = {
  LEXICAL: "lexical",       // C, C++, JavaScript, Python
  DYNAMIC: "dynamic",       // Lua (default), early Lisp
  BLOCK: "block",           // C-style { } blocks
  FUNCTION: "function",     // Python function scope
  CLASS: "class",           // C++, C#, Python classes
  MODULE: "module",         // Python, JavaScript modules
  GLOBAL: "global"          // Top-level scope
};

/**
 * Language Feature Sets
 */
const LanguageFeatures = {
  // Type System
  STATIC_TYPING: "static-typing",
  DYNAMIC_TYPING: "dynamic-typing",
  TYPE_INFERENCE: "type-inference",
  GENERICS: "generics",
  TEMPLATES: "templates",
  
  // OOP
  CLASSES: "classes",
  INHERITANCE: "inheritance",
  POLYMORPHISM: "polymorphism",
  INTERFACES: "interfaces",
  PROTOCOLS: "protocols",
  
  // Memory Management
  MANUAL_MEMORY: "manual-memory",
  GARBAGE_COLLECTION: "garbage-collection",
  REFERENCE_COUNTING: "reference-counting",
  RAII: "raii",
  
  // Functional
  FIRST_CLASS_FUNCTIONS: "first-class-functions",
  CLOSURES: "closures",
  LAMBDAS: "lambdas",
  HIGHER_ORDER: "higher-order",
  
  // Concurrency
  THREADS: "threads",
  ASYNC_AWAIT: "async-await",
  COROUTINES: "coroutines",
  GENERATORS: "generators",
  
  // Other
  MACROS: "macros",
  PREPROCESSOR: "preprocessor",
  OPERATOR_OVERLOAD: "operator-overloading",
  MULTIPLE_DISPATCH: "multiple-dispatch",
  METAPROGRAMMING: "metaprogramming"
};

/**
 * Language Syntax Characteristics
 */
const LanguageTraits = {
  javascript: {
    family: LanguageFamilies.DYNAMIC_SCRIPT,
    features: [
      LanguageFeatures.DYNAMIC_TYPING,
      LanguageFeatures.FIRST_CLASS_FUNCTIONS,
      LanguageFeatures.CLOSURES,
      LanguageFeatures.CLASSES,
      LanguageFeatures.INHERITANCE,
      LanguageFeatures.ASYNC_AWAIT,
      LanguageFeatures.GENERATORS,
      LanguageFeatures.GARBAGE_COLLECTION,
      LanguageFeatures.LAMBDAS
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.FUNCTION, ScopingRules.BLOCK],
    operatorPrecedence: {
      ...OperatorPrecedence,
      // JavaScript-specific precedence
      EXPONENTIATION: 14  // **
    },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/"],
      caseInsensitive: false,
      requiresSemicolons: false,  // ASI
      supportsHoisting: true
    }
  },
  
  lua: {
    family: LanguageFamilies.DYNAMIC_SCRIPT,
    features: [
      LanguageFeatures.DYNAMIC_TYPING,
      LanguageFeatures.FIRST_CLASS_FUNCTIONS,
      LanguageFeatures.CLOSURES,
      LanguageFeatures.COROUTINES,
      LanguageFeatures.GARBAGE_COLLECTION,
      LanguageFeatures.METAPROGRAMMING
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.FUNCTION, ScopingRules.BLOCK],
    operatorPrecedence: {
      ...OperatorPrecedence,
      // Lua-specific precedence
      CONCATENATION: 12,  // ..
      LENGTH: 14          // #
    },
    syntax: {
      statementTerminator: null,
      blockDelimiters: { open: "do", close: "end" },
      commentStyles: ["--", "--[[...]]"],
      caseInsensitive: false,
      requiresSemicolons: false,
      supportsMetatables: true
    }
  },
  
  python: {
    family: LanguageFamilies.DYNAMIC_SCRIPT,
    features: [
      LanguageFeatures.DYNAMIC_TYPING,
      LanguageFeatures.TYPE_INFERENCE,
      LanguageFeatures.CLASSES,
      LanguageFeatures.INHERITANCE,
      LanguageFeatures.FIRST_CLASS_FUNCTIONS,
      LanguageFeatures.CLOSURES,
      LanguageFeatures.LAMBDAS,
      LanguageFeatures.GENERATORS,
      LanguageFeatures.ASYNC_AWAIT,
      LanguageFeatures.GARBAGE_COLLECTION,
      LanguageFeatures.MULTIPLE_DISPATCH,
      LanguageFeatures.METAPROGRAMMING
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.FUNCTION, ScopingRules.CLASS, ScopingRules.MODULE],
    operatorPrecedence: {
      ...OperatorPrecedence,
      // Python-specific precedence
      EXPONENTIATION: 14,  // **
      WALRUS: 2            // :=
    },
    syntax: {
      statementTerminator: "\\n",
      blockDelimiters: { open: ":", close: "dedent" },
      commentStyles: ["#", '"""...."""'],
      caseInsensitive: false,
      requiresSemicolons: false,
      indentationSignificant: true
    }
  },
  
  c: {
    family: LanguageFamilies.C_FAMILY,
    features: [
      LanguageFeatures.STATIC_TYPING,
      LanguageFeatures.MANUAL_MEMORY,
      LanguageFeatures.PREPROCESSOR,
      LanguageFeatures.MACROS
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.BLOCK, ScopingRules.FUNCTION],
    operatorPrecedence: { ...OperatorPrecedence },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/"],
      caseInsensitive: false,
      requiresSemicolons: true,
      supportsPointers: true
    }
  },
  
  cpp: {
    family: LanguageFamilies.C_FAMILY,
    features: [
      LanguageFeatures.STATIC_TYPING,
      LanguageFeatures.TYPE_INFERENCE,
      LanguageFeatures.TEMPLATES,
      LanguageFeatures.CLASSES,
      LanguageFeatures.INHERITANCE,
      LanguageFeatures.POLYMORPHISM,
      LanguageFeatures.OPERATOR_OVERLOAD,
      LanguageFeatures.MANUAL_MEMORY,
      LanguageFeatures.RAII,
      LanguageFeatures.LAMBDAS,
      LanguageFeatures.PREPROCESSOR,
      LanguageFeatures.MACROS
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.BLOCK, ScopingRules.CLASS, ScopingRules.FUNCTION],
    operatorPrecedence: {
      ...OperatorPrecedence,
      // C++-specific precedence
      SCOPE_RESOLUTION: 16  // ::
    },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/"],
      caseInsensitive: false,
      requiresSemicolons: true,
      supportsPointers: true,
      supportsReferences: true,
      supportsNamespaces: true
    }
  },
  
  csharp: {
    family: LanguageFamilies.C_FAMILY,
    features: [
      LanguageFeatures.STATIC_TYPING,
      LanguageFeatures.TYPE_INFERENCE,
      LanguageFeatures.GENERICS,
      LanguageFeatures.CLASSES,
      LanguageFeatures.INHERITANCE,
      LanguageFeatures.POLYMORPHISM,
      LanguageFeatures.INTERFACES,
      LanguageFeatures.GARBAGE_COLLECTION,
      LanguageFeatures.LAMBDAS,
      LanguageFeatures.ASYNC_AWAIT,
      LanguageFeatures.OPERATOR_OVERLOAD
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.BLOCK, ScopingRules.CLASS, ScopingRules.MODULE],
    operatorPrecedence: {
      ...OperatorPrecedence,
      // C#-specific precedence
      NULL_COALESCING: 3  // ??
    },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/", "///"],
      caseInsensitive: false,
      requiresSemicolons: true,
      supportsNamespaces: true,
      supportsProperties: true
    }
  },
  
  objc: {
    family: LanguageFamilies.C_FAMILY,
    features: [
      LanguageFeatures.STATIC_TYPING,
      LanguageFeatures.DYNAMIC_TYPING,
      LanguageFeatures.CLASSES,
      LanguageFeatures.INHERITANCE,
      LanguageFeatures.PROTOCOLS,
      LanguageFeatures.MANUAL_MEMORY,
      LanguageFeatures.REFERENCE_COUNTING,
      LanguageFeatures.PREPROCESSOR,
      LanguageFeatures.MACROS
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.BLOCK, ScopingRules.CLASS],
    operatorPrecedence: { ...OperatorPrecedence },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/"],
      caseInsensitive: false,
      requiresSemicolons: true,
      supportsPointers: true,
      supportsMessagePassing: true,
      supportsBlocks: true
    }
  },
  
  cmm: {
    family: LanguageFamilies.C_FAMILY,
    features: [
      LanguageFeatures.STATIC_TYPING,
      LanguageFeatures.MANUAL_MEMORY
    ],
    scopingRules: [ScopingRules.LEXICAL, ScopingRules.BLOCK, ScopingRules.FUNCTION],
    operatorPrecedence: { ...OperatorPrecedence },
    syntax: {
      statementTerminator: ";",
      blockDelimiters: { open: "{", close: "}" },
      commentStyles: ["//", "/*...*/"],
      caseInsensitive: false,
      requiresSemicolons: true,
      isIntermediateLanguage: true
    }
  }
};

/**
 * Syntax Family Classifier
 */
class SyntaxFamilyClassifier {
  constructor() {
    this.families = LanguageFamilies;
    this.traits = LanguageTraits;
    this.features = LanguageFeatures;
  }

  /**
   * Gets language family for a language
   * @param {string} language - Language name
   * @returns {string} Language family
   */
  getLanguageFamily(language) {
    const trait = this.traits[language.toLowerCase()];
    return trait ? trait.family : LanguageFamilies.OTHER;
  }

  /**
   * Gets all features for a language
   * @param {string} language - Language name
   * @returns {array} Array of feature names
   */
  getLanguageFeatures(language) {
    const trait = this.traits[language.toLowerCase()];
    return trait ? trait.features : [];
  }

  /**
   * Checks if language has a specific feature
   * @param {string} language - Language name
   * @param {string} feature - Feature name
   * @returns {boolean} True if feature is supported
   */
  hasFeature(language, feature) {
    const features = this.getLanguageFeatures(language);
    return features.includes(feature);
  }

  /**
   * Gets scoping rules for a language
   * @param {string} language - Language name
   * @returns {array} Array of scoping rule types
   */
  getScopingRules(language) {
    const trait = this.traits[language.toLowerCase()];
    return trait ? trait.scopingRules : [];
  }

  /**
   * Gets operator precedence for a language
   * @param {string} language - Language name
   * @returns {object} Operator precedence table
   */
  getOperatorPrecedence(language) {
    const trait = this.traits[language.toLowerCase()];
    return trait ? trait.operatorPrecedence : OperatorPrecedence;
  }

  /**
   * Gets syntax characteristics for a language
   * @param {string} language - Language name
   * @returns {object} Syntax characteristics
   */
  getSyntaxCharacteristics(language) {
    const trait = this.traits[language.toLowerCase()];
    return trait ? trait.syntax : null;
  }

  /**
   * Gets all languages in a family
   * @param {string} family - Language family
   * @returns {array} Array of language names
   */
  getLanguagesInFamily(family) {
    return Object.keys(this.traits).filter(
      lang => this.traits[lang].family === family
    );
  }

  /**
   * Gets shared syntax rules for a language family
   * @param {string} family - Language family
   * @returns {object} Shared syntax rules
   */
  getFamilySyntaxRules(family) {
    const languages = this.getLanguagesInFamily(family);
    
    if (languages.length === 0) {
      return null;
    }
    
    // Find common features across all languages in family
    const allFeatures = languages.map(lang => this.getLanguageFeatures(lang));
    const commonFeatures = allFeatures[0].filter(feature =>
      allFeatures.every(features => features.includes(feature))
    );
    
    return {
      family,
      commonFeatures,
      memberLanguages: languages
    };
  }

  /**
   * Compares two languages for syntax similarity
   * @param {string} language1 - First language
   * @param {string} language2 - Second language
   * @returns {object} Similarity analysis
   */
  compareSyntax(language1, language2) {
    const features1 = new Set(this.getLanguageFeatures(language1));
    const features2 = new Set(this.getLanguageFeatures(language2));
    
    const commonFeatures = [...features1].filter(f => features2.has(f));
    const uniqueTo1 = [...features1].filter(f => !features2.has(f));
    const uniqueTo2 = [...features2].filter(f => !features1.has(f));
    
    const totalFeatures = new Set([...features1, ...features2]).size;
    const similarity = commonFeatures.length / totalFeatures;
    
    return {
      language1,
      language2,
      sameFamily: this.getLanguageFamily(language1) === this.getLanguageFamily(language2),
      similarity,
      commonFeatures,
      uniqueTo1,
      uniqueTo2
    };
  }

  /**
   * Gets all supported languages
   * @returns {array} Array of language names
   */
  getSupportedLanguages() {
    return Object.keys(this.traits);
  }

  /**
   * Gets complete trait information for a language
   * @param {string} language - Language name
   * @returns {object} Complete language traits
   */
  getLanguageTraits(language) {
    return this.traits[language.toLowerCase()] || null;
  }
}

module.exports = { 
  SyntaxFamilyClassifier, 
  LanguageFamilies, 
  LanguageFeatures, 
  ScopingRules, 
  OperatorPrecedence 
};
