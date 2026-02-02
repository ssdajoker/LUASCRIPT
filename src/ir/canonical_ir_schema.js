// canonical_ir_schema.js
// Phase B: Canonical IR Schema and Type System Extensions
// Defines the canonical intermediate representation (IR) for all languages
// and provides type system extensions for advanced constraint solving.

/**
 * Canonical IR Node Types
 * - All language constructs are normalized to these node types.
 */
const IRNodeType = {
  Module: 'Module',
  Function: 'Function',
  Class: 'Class',
  Struct: 'Struct',
  Enum: 'Enum',
  Interface: 'Interface',
  Variable: 'Variable',
  Assignment: 'Assignment',
  Call: 'Call',
  Return: 'Return',
  If: 'If',
  While: 'While',
  For: 'For',
  Break: 'Break',
  Continue: 'Continue',
  Try: 'Try',
  Catch: 'Catch',
  Finally: 'Finally',
  Throw: 'Throw',
  Yield: 'Yield',
  Await: 'Await',
  Literal: 'Literal',
  BinaryOp: 'BinaryOp',
  UnaryOp: 'UnaryOp',
  MemberAccess: 'MemberAccess',
  IndexAccess: 'IndexAccess',
  TypeCast: 'TypeCast',
  TypeCheck: 'TypeCheck',
  Block: 'Block',
  Import: 'Import',
  Export: 'Export',
  Annotation: 'Annotation',
  Comment: 'Comment',
};

/**
 * Canonical Type System Extensions
 * - Adds support for generics, constraints, and advanced type features.
 */
const IRTypeKind = {
  Primitive: 'Primitive', // i32, f64, bool, string, void
  Pointer: 'Pointer',
  Array: 'Array',
  Map: 'Map',
  Tuple: 'Tuple',
  Optional: 'Optional',
  Union: 'Union',
  Generic: 'Generic',
  Constraint: 'Constraint',
  Function: 'Function',
  Struct: 'Struct',
  Enum: 'Enum',
  Interface: 'Interface',
};

/**
 * Canonical IR Node
 */
class IRNode {
  constructor(type, props = {}) {
    this.type = type;
    Object.assign(this, props);
  }
}

/**
 * Canonical IR Type
 */
class IRType {
  constructor(kind, props = {}) {
    this.kind = kind;
    Object.assign(this, props);
  }
}

/**
 * Example: Function IR Node
 */
// new IRNode(IRNodeType.Function, {
//   name: 'myFunc',
//   params: [ ... ],
//   returnType: new IRType(IRTypeKind.Primitive, { name: 'i32' }),
//   body: [ ... ]
// })

module.exports = {
  IRNodeType,
  IRTypeKind,
  IRNode,
  IRType,
};
