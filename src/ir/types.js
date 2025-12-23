
/**
 * LUASCRIPT IR Type System
 * 
 * Defines the type system for the canonical Intermediate Representation.
 * Supports primitive types, compound types, and custom type definitions.
 */

/**
 * Type Categories
 */
const TypeCategory = {
  PRIMITIVE: "primitive",
  ARRAY: "array",
  OBJECT: "object",
  FUNCTION: "function",
  UNION: "union",
  OPTIONAL: "optional",
  VOID: "void",
  ANY: "any",
  CUSTOM: "custom"
};

/**
 * Primitive Types
 */
const PrimitiveType = {
  NUMBER: "number",
  STRING: "string",
  BOOLEAN: "boolean",
  NULL: "null",
  UNDEFINED: "undefined"
};

/**
 * Base Type class
 */
class Type {
  constructor(category, options = {}) {
    this.category = category;
    this.nullable = options.nullable || false;
    this.metadata = options.metadata || {};
  }

  equals(other) {
    return this.category === other.category;
  }

  isCompatibleWith(other) {
    if (this.category === TypeCategory.ANY || other.category === TypeCategory.ANY) {
      return true;
    }
    return this.equals(other);
  }

  toJSON() {
    return {
      category: this.category,
      nullable: this.nullable,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    switch (json.category) {
    case TypeCategory.PRIMITIVE:
      return new TPrimitive(json.primitiveType, json);
    case TypeCategory.ARRAY:
      return new TArray(Type.fromJSON(json.elementType), json);
    case TypeCategory.OBJECT: {
      const properties = {};
      for (const [key, value] of Object.entries(json.properties || {})) {
        properties[key] = Type.fromJSON(value);
      }
      return new TObject(properties, json);
    }
    case TypeCategory.FUNCTION:
      return new TFunction(
        json.parameters.map(Type.fromJSON),
        Type.fromJSON(json.returnType),
        json
      );
    case TypeCategory.UNION:
      return new TUnion(json.types.map(Type.fromJSON), json);
    case TypeCategory.OPTIONAL:
      return new TOptional(Type.fromJSON(json.baseType), json);
    case TypeCategory.VOID:
      return new TVoid(json);
    case TypeCategory.ANY:
      return new TAny(json);
    case TypeCategory.CUSTOM:
      return new TCustom(json.name, json);
    default:
      throw new Error(`Unknown type category: ${json.category}`);
    }
  }
}

/**
 * Primitive Type
 */
class TPrimitive extends Type {
  constructor(primitiveType, options = {}) {
    super(TypeCategory.PRIMITIVE, options);
    this.primitiveType = primitiveType;
  }

  equals(other) {
    return super.equals(other) && this.primitiveType === other.primitiveType;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      primitiveType: this.primitiveType
    };
  }

  toString() {
    return this.primitiveType;
  }
}

/**
 * Array Type
 */
class TArray extends Type {
  constructor(elementType, options = {}) {
    super(TypeCategory.ARRAY, options);
    this.elementType = elementType;
  }

  equals(other) {
    return super.equals(other) && this.elementType.equals(other.elementType);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      elementType: this.elementType.toJSON()
    };
  }

  toString() {
    return `Array<${this.elementType.toString()}>`;
  }
}

/**
 * Object Type
 */
class TObject extends Type {
  constructor(properties = {}, options = {}) {
    super(TypeCategory.OBJECT, options);
    this.properties = properties; // Map of property names to Types
  }

  equals(other) {
    if (!super.equals(other)) return false;
        
    const thisKeys = Object.keys(this.properties).sort();
    const otherKeys = Object.keys(other.properties).sort();
        
    if (thisKeys.length !== otherKeys.length) return false;
        
    for (let i = 0; i < thisKeys.length; i++) {
      if (thisKeys[i] !== otherKeys[i]) return false;
      if (!this.properties[thisKeys[i]].equals(other.properties[otherKeys[i]])) {
        return false;
      }
    }
        
    return true;
  }

  toJSON() {
    const properties = {};
    for (const [key, value] of Object.entries(this.properties)) {
      properties[key] = value.toJSON();
    }
        
    return {
      ...super.toJSON(),
      properties
    };
  }

  toString() {
    const props = Object.entries(this.properties)
      .map(([key, type]) => `${key}: ${type.toString()}`)
      .join(", ");
    return `{ ${props} }`;
  }
}

/**
 * Function Type
 */
class TFunction extends Type {
  constructor(parameters, returnType, options = {}) {
    super(TypeCategory.FUNCTION, options);
    this.parameters = parameters; // Array of Types
    this.returnType = returnType;
  }

  equals(other) {
    if (!super.equals(other)) return false;
    if (this.parameters.length !== other.parameters.length) return false;
        
    for (let i = 0; i < this.parameters.length; i++) {
      if (!this.parameters[i].equals(other.parameters[i])) return false;
    }
        
    return this.returnType.equals(other.returnType);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      parameters: this.parameters.map(p => p.toJSON()),
      returnType: this.returnType.toJSON()
    };
  }

  toString() {
    const params = this.parameters.map(p => p.toString()).join(", ");
    return `(${params}) => ${this.returnType.toString()}`;
  }
}

/**
 * Union Type
 */
class TUnion extends Type {
  constructor(types, options = {}) {
    super(TypeCategory.UNION, options);
    this.types = types; // Array of Types
  }

  equals(other) {
    if (!super.equals(other)) return false;
    if (this.types.length !== other.types.length) return false;
        
    // Check if all types are present (order doesn't matter)
    for (const type of this.types) {
      if (!other.types.some(t => t.equals(type))) return false;
    }
        
    return true;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      types: this.types.map(t => t.toJSON())
    };
  }

  toString() {
    return this.types.map(t => t.toString()).join(" | ");
  }
}

/**
 * Optional Type
 */
class TOptional extends Type {
  constructor(baseType, options = {}) {
    super(TypeCategory.OPTIONAL, options);
    this.baseType = baseType;
  }

  equals(other) {
    return super.equals(other) && this.baseType.equals(other.baseType);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      baseType: this.baseType.toJSON()
    };
  }

  toString() {
    return `${this.baseType.toString()}?`;
  }
}

/**
 * Void Type
 */
class TVoid extends Type {
  constructor(options = {}) {
    super(TypeCategory.VOID, options);
  }

  toString() {
    return "void";
  }
}

/**
 * Any Type
 */
class TAny extends Type {
  constructor(options = {}) {
    super(TypeCategory.ANY, options);
  }

  equals() {
    return true; // Any is compatible with all types
  }

  toString() {
    return "any";
  }
}

/**
 * Custom Type
 */
class TCustom extends Type {
  constructor(name, options = {}) {
    super(TypeCategory.CUSTOM, options);
    this.name = name;
  }

  equals(other) {
    return super.equals(other) && this.name === other.name;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name
    };
  }

  toString() {
    return this.name;
  }
}

/**
 * Type Factory - convenience functions for creating types
 */
const Types = {
  number: () => new TPrimitive(PrimitiveType.NUMBER),
  string: () => new TPrimitive(PrimitiveType.STRING),
  boolean: () => new TPrimitive(PrimitiveType.BOOLEAN),
  null: () => new TPrimitive(PrimitiveType.NULL),
  undefined: () => new TPrimitive(PrimitiveType.UNDEFINED),
  array: (elementType) => new TArray(elementType),
  object: (properties) => new TObject(properties),
  function: (parameters, returnType) => new TFunction(parameters, returnType),
  union: (...types) => new TUnion(types),
  optional: (baseType) => new TOptional(baseType),
  void: () => new TVoid(),
  any: () => new TAny(),
  custom: (name) => new TCustom(name)
};

module.exports = {
  TypeCategory,
  PrimitiveType,
  Type,
  TPrimitive,
  TArray,
  TObject,
  TFunction,
  TUnion,
  TOptional,
  TVoid,
  TAny,
  TCustom,
  Types
};
