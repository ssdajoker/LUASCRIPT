"use strict";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const KIND_ALIAS_POLICIES = {
  "Parameter->Identifier": {
    sourceKind: "Parameter",
    targetKind: "Identifier",
    encoding: "parameter name is retained as Identifier.binding",
    semanticDelta: "parameter position is carried by the owning function params list",
    reversible: false
  },
  "VariableDeclarator->VariableDeclaration": {
    sourceKind: "VariableDeclarator",
    targetKind: "VariableDeclaration",
    encoding: "one legacy declarator becomes one declaration envelope",
    semanticDelta: "declaration grouping is not reconstructed",
    reversible: false
  },
  "SwitchCase->BlockStatement": {
    sourceKind: "SwitchCase",
    targetKind: "BlockStatement",
    encoding: "case test and consequent statements are retained on a block-shaped node",
    semanticDelta: "the target schema has no dedicated SwitchCase authoring kind",
    reversible: false
  },
  "UnaryExpression->BinaryExpression": {
    sourceKind: "UnaryExpression",
    targetKind: "BinaryExpression",
    encoding: "operator is prefixed with unary: and operand is stored as argument",
    semanticDelta: "compatibility encoding only; not a canonical BinaryExpression authoring form",
    reversible: false
  }
};

const FIELD_ALIAS_POLICIES = {
  "varKind->declarationKind": {
    sourceField: "varKind",
    targetField: "declarationKind",
    appliesTo: ["VariableDeclarator"],
    semanticDelta: "missing legacy varKind defaults to let"
  },
  "parameters->params": {
    sourceField: "parameters",
    targetField: "params",
    appliesTo: ["FunctionDeclaration"],
    semanticDelta: "ordered parameter references are retained"
  },
  "value->argument": {
    sourceField: "value",
    targetField: "argument",
    appliesTo: ["ReturnStatement"],
    semanticDelta: "field rename only for the supported return slice"
  },
  "condition->test": {
    sourceField: "condition",
    targetField: "test",
    appliesTo: ["IfStatement", "ForStatement", "WhileStatement", "DoWhileStatement", "ConditionalExpression"],
    semanticDelta: "field rename only for supported control-flow nodes"
  },
  "operand->argument": {
    sourceField: "operand",
    targetField: "argument",
    appliesTo: ["UnaryExpression"],
    semanticDelta: "used with the declared UnaryExpression compatibility encoding"
  },
  "args->arguments": {
    sourceField: "args",
    targetField: "arguments",
    appliesTo: ["CallExpression"],
    semanticDelta: "ordered call argument references are retained"
  }
};

const RELEASE_IR_SURFACE_CONTRACT = {
  contractVersion: "1.0.0-rc.1",
  decision: "versioned-one-way-dual-surface-transition",
  status: "DENALI_RC_INTERNAL",
  direction: "legacy-to-canonical",
  surfaces: {
    operational: {
      id: "legacy-object-tree-program",
      version: "v0",
      rootKind: "Program",
      role: "compiler-and-emitter-operational",
      publicApiStatus: "INTERNAL_ONLY"
    },
    canonical: {
      id: "canonical-ir-schema",
      version: "1.0.0",
      schemaPath: "docs/canonical_ir.schema.json",
      pinnedSchemaPath: "docs/schema/1.0.0/canonical_ir.schema.json",
      majorAliasPath: "docs/schema/1.x/canonical_ir.schema.json",
      role: "release-evidence-and-serialization",
      publicApiStatus: "SUPPORT_REFERENCE_NOT_ROOT_EXPORT"
    }
  },
  bridge: {
    implementation: "src/ir/schema_artifact_bridge.js",
    conversion: "one-way-derived-artifact",
    reverseConversion: "NOT_PROVIDED_OR_CLAIMED",
    semanticEquivalence: "NOT_CLAIMED",
    sourcePreservation: "NOT_CLAIMED",
    determinism: "REQUIRED_FOR_IDENTICAL_INPUT_AND_OPTIONS"
  },
  compatibility: {
    latestAndPinnedSchemaParity: "REQUIRED_EXCEPT_SCHEMA_ID",
    latestAndPinnedValidation: "REQUIRED",
    exactAliasRegistry: "REQUIRED",
    kindAliases: KIND_ALIAS_POLICIES,
    fieldAliases: FIELD_ALIAS_POLICIES,
    artifactMetadataMarker: "versioned-dual-surface-denali-rc"
  },
  migration: {
    operationalConsumers: "Continue consuming CoreLanguageBridge legacy Program IR in LUASCRIPT 1.x.",
    artifactConsumers: "Derive and validate canonical artifacts through legacyProgramToSchemaArtifact.",
    reverseMigration: "No automatic canonical-to-legacy conversion exists or is promised.",
    unsupportedKinds: "Fail closed; add an explicit mapped kind or declared alias before promotion."
  },
  deprecation: {
    legacySurface: "SUPPORTED_THROUGH_LUASCRIPT_1_X",
    removalEarliestPackageMajor: "2.0.0",
    prerequisites: [
      "canonical artifact consumer and emitter coverage for every promoted node",
      "migration tooling and release notes",
      "compatibility evidence for all supported language slices",
      "explicit operator authorization for a breaking release"
    ]
  },
  releaseBoundaries: [
    "does not change CoreLanguageBridge compileToIR output",
    "does not expose an IR bridge from the package root",
    "does not provide or claim reverse conversion",
    "does not prove semantic equivalence or source preservation",
    "does not bump, tag, publish, or release the package"
  ]
};

deepFreeze(KIND_ALIAS_POLICIES);
deepFreeze(FIELD_ALIAS_POLICIES);
deepFreeze(RELEASE_IR_SURFACE_CONTRACT);

const KIND_ALIASES = Object.freeze(Object.fromEntries(
  Object.values(KIND_ALIAS_POLICIES).map(policy => [policy.sourceKind, policy.targetKind])
));

module.exports = {
  KIND_ALIASES,
  KIND_ALIAS_POLICIES,
  FIELD_ALIAS_POLICIES,
  RELEASE_IR_SURFACE_CONTRACT
};
