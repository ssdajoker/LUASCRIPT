"use strict";

/**
 * Unified Type System Bridge
 * Maps language-specific types to canonical IR types
 * Supports: C, C++, C#, Objective-C, Python, JavaScript
 * 
 * Purpose: Provide consistent type semantics across all supported languages
 * through a centralized equivalence system
 */

class TypeSystemBridge {
  constructor(options = {}) {
    this.options = options;
    this.initializeTypeMappings();
    this.initializeConversionRules();
  }

  /**
   * Initialize language-to-IR type mappings
   */
  initializeTypeMappings() {
    // Primitive type equivalences
    this.primitiveEquivalences = {
      // Integers (with size variants)
      'int': { canonical: 'i32', sizeBytes: 4, signed: true, family: 'integer' },
      'uint': { canonical: 'u32', sizeBytes: 4, signed: false, family: 'integer' },
      'short': { canonical: 'i16', sizeBytes: 2, signed: true, family: 'integer' },
      'ushort': { canonical: 'u16', sizeBytes: 2, signed: false, family: 'integer' },
      'long': { canonical: 'i64', sizeBytes: 8, signed: true, family: 'integer' },
      'ulong': { canonical: 'u64', sizeBytes: 8, signed: false, family: 'integer' },
      'int8': { canonical: 'i8', sizeBytes: 1, signed: true, family: 'integer' },
      'uint8': { canonical: 'u8', sizeBytes: 1, signed: false, family: 'integer' },
      'int16': { canonical: 'i16', sizeBytes: 2, signed: true, family: 'integer' },
      'uint16': { canonical: 'u16', sizeBytes: 2, signed: false, family: 'integer' },
      'int32': { canonical: 'i32', sizeBytes: 4, signed: true, family: 'integer' },
      'uint32': { canonical: 'u32', sizeBytes: 4, signed: false, family: 'integer' },
      'int64': { canonical: 'i64', sizeBytes: 8, signed: true, family: 'integer' },
      'uint64': { canonical: 'u64', sizeBytes: 8, signed: false, family: 'integer' },
      'byte': { canonical: 'u8', sizeBytes: 1, signed: false, family: 'integer' },
      'sbyte': { canonical: 'i8', sizeBytes: 1, signed: true, family: 'integer' },

      // Floating point
      'float': { canonical: 'f32', sizeBytes: 4, family: 'float' },
      'double': { canonical: 'f64', sizeBytes: 8, family: 'float' },
      'decimal': { canonical: 'f128', sizeBytes: 16, family: 'float' },

      // Boolean
      'bool': { canonical: 'bool', sizeBytes: 1, family: 'boolean' },
      'boolean': { canonical: 'bool', sizeBytes: 1, family: 'boolean' },

      // Character
      'char': { canonical: 'i8', sizeBytes: 1, family: 'char' },
      'wchar': { canonical: 'i16', sizeBytes: 2, family: 'char' },

      // String (reference types)
      'string': { canonical: 'string', sizeBytes: null, family: 'string', refType: true },
      'cstring': { canonical: 'pointer<i8>', sizeBytes: null, family: 'string', refType: true },

      // Void
      'void': { canonical: 'void', sizeBytes: 0, family: 'void' },

      // Python-specific (mapped to equivalents)
      'Any': { canonical: 'any', sizeBytes: null, family: 'any' },
      'None': { canonical: 'void', sizeBytes: 0, family: 'void' },
      'NoneType': { canonical: 'void', sizeBytes: 0, family: 'void' },
    };

    // Language-specific type mappings
    this.languageMappings = {
      C: this.buildCTypeMap(),
      'C++': this.buildCppTypeMap(),
      'C#': this.buildCsharpTypeMap(),
      'Objective-C': this.buildObjCTypeMap(),
      Python: this.buildPythonTypeMap(),
      JavaScript: this.buildJavaScriptTypeMap(),
    };
  }

  buildCTypeMap() {
    return {
      'int': 'i32',
      'unsigned int': 'u32',
      'short': 'i16',
      'unsigned short': 'u16',
      'long': 'i64',
      'unsigned long': 'u64',
      'long long': 'i64',
      'unsigned long long': 'u64',
      'float': 'f32',
      'double': 'f64',
      'char': 'i8',
      'signed char': 'i8',
      'unsigned char': 'u8',
      '_Bool': 'bool',
      'void': 'void',
      'void *': 'pointer<void>',
    };
  }

  buildCppTypeMap() {
    const cMap = this.buildCTypeMap();
    return {
      ...cMap,
      'bool': 'bool',
      'std::string': 'string',
      'std::vector': 'array',
      'std::map': 'map',
      'std::pair': 'tuple',
    };
  }

  buildCsharpTypeMap() {
    return {
      'int': 'i32',
      'uint': 'u32',
      'short': 'i16',
      'ushort': 'u16',
      'long': 'i64',
      'ulong': 'u64',
      'float': 'f32',
      'double': 'f64',
      'byte': 'u8',
      'sbyte': 'i8',
      'char': 'i16',
      'bool': 'bool',
      'void': 'void',
      'string': 'string',
      'object': 'any',
      'decimal': 'f128',
    };
  }

  buildObjCTypeMap() {
    const cMap = this.buildCTypeMap();
    return {
      ...cMap,
      'id': 'any',
      'Class': 'type',
      'SEL': 'pointer<i8>',
      'NSString *': 'string',
      'NSArray *': 'array',
      'NSDictionary *': 'map',
      'BOOL': 'bool',
    };
  }

  buildPythonTypeMap() {
    return {
      'int': 'i64',
      'float': 'f64',
      'bool': 'bool',
      'str': 'string',
      'bytes': 'array<u8>',
      'list': 'array',
      'dict': 'map',
      'tuple': 'tuple',
      'set': 'set',
      'frozenset': 'set',
      'None': 'void',
      'Any': 'any',
      'object': 'any',
    };
  }

  buildJavaScriptTypeMap() {
    return {
      'number': 'f64',
      'string': 'string',
      'boolean': 'bool',
      'object': 'map',
      'array': 'array',
      'function': 'function',
      'undefined': 'void',
      'null': 'void',
      'any': 'any',
    };
  }

  /**
   * Initialize implicit conversion rules
   */
  initializeConversionRules() {
    this.conversions = {
      // Widening conversions (always safe)
      'i8': ['i16', 'i32', 'i64', 'f32', 'f64'],
      'i16': ['i32', 'i64', 'f32', 'f64'],
      'i32': ['i64', 'f64'],
      'i64': ['f64'],
      'u8': ['u16', 'u32', 'u64', 'f32', 'f64'],
      'u16': ['u32', 'u64', 'f32', 'f64'],
      'u32': ['u64', 'f64'],
      'u64': ['f64'],
      'f32': ['f64'],
      'bool': ['i32', 'f64'],
    };
  }

  /**
   * Map a language-specific type to canonical IR type
   * @param {string} languageType - Type in source language syntax
   * @param {string} language - Source language name
   * @returns {object} Canonical type descriptor
   */
  mapType(languageType, language) {
    // Handle pointer/array syntax
    const stripped = languageType.replace(/[\*\[\]&]/g, '');
    const isPointer = languageType.includes('*');
    const isReference = languageType.includes('&');
    const isArray = languageType.includes('[');

    const mapping = this.languageMappings[language] || {};
    const canonical = mapping[stripped] || mapping[languageType];

    if (!canonical) {
      // Default: treat as user-defined type
      return {
        canonical: `type<${languageType}>`,
        language,
        category: 'user-defined',
        isPointer,
        isReference,
        isArray,
      };
    }

    return {
      canonical,
      language,
      category: 'primitive',
      isPointer,
      isReference,
      isArray,
      ...this.primitiveEquivalences[canonical],
    };
  }

  /**
   * Check if type A can implicitly convert to type B
   * @param {string} fromType - Source canonical type
   * @param {string} toType - Target canonical type
   * @returns {boolean} Whether conversion is allowed
   */
  canConvert(fromType, toType) {
    if (fromType === toType) return true;
    const allowed = this.conversions[fromType] || [];
    return allowed.includes(toType);
  }

  /**
   * Get conversion cost (0 = no conversion, 1 = implicit, 2+ = explicit required)
   * @param {string} fromType - Source canonical type
   * @param {string} toType - Target canonical type
   * @returns {number} Conversion cost
   */
  conversionCost(fromType, toType) {
    if (fromType === toType) return 0;
    if (this.canConvert(fromType, toType)) return 1;
    return 2; // Requires explicit cast
  }

  /**
   * Get function signature in canonical form
   * @param {object} signature - Function signature descriptor
   * @param {string} language - Source language
   * @returns {object} Canonical signature
   */
  canonicalizeSignature(signature, language) {
    return {
      name: signature.name,
      returnType: this.mapType(signature.returnType, language).canonical,
      parameters: (signature.parameters || []).map(param => ({
        name: param.name,
        type: this.mapType(param.type, language).canonical,
        optional: param.optional || false,
      })),
      variadic: signature.variadic || false,
    };
  }

  /**
   * Get struct/class layout in canonical form
   * @param {object} structDef - Structure definition
   * @param {string} language - Source language
   * @returns {object} Canonical structure
   */
  canonicalizeStructure(structDef, language) {
    const fields = (structDef.fields || []).map(field => ({
      name: field.name,
      type: this.mapType(field.type, language).canonical,
      offset: field.offset || null,
      size: field.size || null,
      alignment: field.alignment || null,
    }));

    return {
      name: structDef.name,
      fields,
      size: structDef.size || null,
      alignment: structDef.alignment || null,
      isUnion: structDef.isUnion || false,
      isPacked: structDef.isPacked || false,
    };
  }

  /**
   * Get generic type in canonical form
   * @param {object} generic - Generic type descriptor
   * @param {string} language - Source language
   * @returns {object} Canonical generic
   */
  canonicalizeGeneric(generic, language) {
    return {
      name: generic.name,
      typeParams: generic.typeParams || [],
      constraints: generic.constraints || {},
      instantiations: (generic.instantiations || []).map(inst => ({
        typeArgs: inst.typeArgs.map(arg => this.mapType(arg, language).canonical),
        specialized: inst.specialized,
      })),
    };
  }

  /**
   * Get protocol/interface in canonical form
   * @param {object} protocol - Protocol definition
   * @param {string} language - Source language
   * @returns {object} Canonical protocol
   */
  canonicalizeProtocol(protocol, language) {
    return {
      name: protocol.name,
      methods: (protocol.methods || []).map(method =>
        this.canonicalizeSignature(method, language)
      ),
      properties: (protocol.properties || []).map(prop => ({
        name: prop.name,
        type: this.mapType(prop.type, language).canonical,
        readonly: prop.readonly || false,
      })),
      extends: protocol.extends || [],
    };
  }

  /**
   * Get optional/nullable type in canonical form
   * @param {string} baseType - Base canonical type
   * @returns {object} Optional type descriptor
   */
  getOptionalType(baseType) {
    return {
      canonical: `optional<${baseType}>`,
      baseType,
      isOptional: true,
    };
  }

  /**
   * Get union type in canonical form
   * @param {string[]} memberTypes - Member canonical types
   * @returns {object} Union type descriptor
   */
  getUnionType(memberTypes) {
    return {
      canonical: `union<${memberTypes.join(',')}>`,
      memberTypes,
      isUnion: true,
    };
  }

  /**
   * Verify type annotation is valid in target language
   * @param {object} annotation - Type annotation
   * @param {string} language - Target language
   * @returns {object} Validation result { valid: boolean, errors: string[] }
   */
  validateAnnotation(annotation, language) {
    const errors = [];
    const mapping = this.languageMappings[language];

    if (!mapping) {
      errors.push(`Unknown language: ${language}`);
    }

    // Validate base type exists in language
    if (mapping && !mapping[annotation.baseType]) {
      errors.push(`Type ${annotation.baseType} not available in ${language}`);
    }

    // Validate generic constraints if applicable
    if (annotation.typeParams) {
      for (const param of annotation.typeParams) {
        if (param.constraint && mapping && !mapping[param.constraint]) {
          errors.push(`Constraint type ${param.constraint} not available in ${language}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      annotation,
      language,
    };
  }
}

module.exports = TypeSystemBridge;
