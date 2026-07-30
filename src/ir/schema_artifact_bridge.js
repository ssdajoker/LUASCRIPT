"use strict";

const crypto = require("crypto");
const {
  KIND_ALIASES,
  KIND_ALIAS_POLICIES,
  FIELD_ALIAS_POLICIES,
  RELEASE_IR_SURFACE_CONTRACT
} = require("./release_ir_surface_contract");

const DEFAULT_SCHEMA_KINDS = new Set([
  "Identifier",
  "Literal",
  "BinaryExpression",
  "LogicalExpression",
  "AssignmentExpression",
  "UpdateExpression",
  "ConditionalExpression",
  "CallExpression",
  "MemberExpression",
  "NewExpression",
  "ArrayExpression",
  "ObjectExpression",
  "TemplateLiteral",
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "VariableDeclaration",
  "BlockStatement",
  "ExpressionStatement",
  "ReturnStatement",
  "IfStatement",
  "SwitchStatement",
  "ForStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "BreakStatement",
  "ContinueStatement",
  "ThrowStatement",
  "TryStatement",
  "ImportDeclaration",
  "ExportDeclaration",
  "ClassDeclaration",
  "ClassBody",
  "MethodDefinition",
  "Property",
  "ObjectPattern",
  "ArrayPattern",
  "RestElement",
  "AssignmentPattern",
  "ProgramComment"
]);

const NODE_REF_FIELDS = new Set([
  "init",
  "body",
  "expression",
  "argument",
  "test",
  "consequent",
  "alternate",
  "update",
  "discriminant",
  "left",
  "right",
  "callee",
  "object",
  "property",
  "key",
  "valueRef"
]);

const NODE_REF_LIST_FIELDS = new Set([
  "params",
  "statements",
  "cases",
  "arguments",
  "elements",
  "properties"
]);

function hashText(value) {
  return crypto
    .createHash("sha256")
    .update(String(value || ""), "utf8")
    .digest("hex");
}

function toBalancedDigits(value) {
  const alphabet = ["T", "0", "1"];
  let current = Math.max(1, value);
  let output = "";
  while (current > 0) {
    output = alphabet[current % 3] + output;
    current = Math.floor(current / 3);
  }
  return output || "0";
}

function fallbackId(seed, counter) {
  const hash = hashText(`${seed}:${counter}`).slice(0, 10);
  const numeric = Number.parseInt(hash, 16);
  return `node_${toBalancedDigits(numeric)}`;
}

function isSchemaId(value) {
  return typeof value === "string" && /^[^_]+_[T01]+$/.test(value);
}

function sanitize(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value !== "object") return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return String(value);
  }
}

function locationToSpan(loc) {
  if (!loc || !loc.start || !loc.end) return null;
  const hasOffsets = Number.isFinite(loc.start.offset) && Number.isFinite(loc.end.offset);
  if (!Number.isFinite(loc.start.line) || !Number.isFinite(loc.start.column)) return null;
  if (!Number.isFinite(loc.end.line) || !Number.isFinite(loc.end.column)) return null;
  if (!hasOffsets) return null;
  return {
    start: {
      line: loc.start.line,
      column: loc.start.column,
      offset: loc.start.offset
    },
    end: {
      line: loc.end.line,
      column: loc.end.column,
      offset: loc.end.offset
    }
  };
}

function pushCount(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function schemaKindsFromSchema(schema) {
  const kinds = schema &&
    schema.$defs &&
    schema.$defs.Node &&
    schema.$defs.Node.properties &&
    schema.$defs.Node.properties.kind &&
    schema.$defs.Node.properties.kind.enum;
  if (!Array.isArray(kinds) || kinds.length === 0) {
    throw new Error("Canonical IR schema must declare a non-empty $defs.Node.properties.kind.enum");
  }
  return new Set(kinds);
}

function mapKind(kind, schemaKinds = DEFAULT_SCHEMA_KINDS) {
  if (schemaKinds.has(kind)) return kind;
  const aliasTarget = KIND_ALIASES[kind];
  return aliasTarget && schemaKinds.has(aliasTarget) ? aliasTarget : null;
}

function isIrNode(value) {
  return value && typeof value === "object" && typeof value.kind === "string";
}

function addMeta(out, node, mappedKind) {
  const originalKind = node.kind;
  const sourceMetadata = sanitize(node.metadata || {});
  out.meta = {
    sourceMetadata,
    schemaArtifactMapping: {
      originalKind,
      mappedKind,
      sourceSurface: "legacy-object-tree",
      sourceSurfaceVersion: RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.version,
      artifactSurface: "canonical-ir-schema-v1-derived",
      artifactSurfaceVersion: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version,
      releaseIrContractVersion: RELEASE_IR_SURFACE_CONTRACT.contractVersion
    }
  };
}

function pushDeclaredFieldAlias(map, aliasId) {
  if (!Object.prototype.hasOwnProperty.call(FIELD_ALIAS_POLICIES, aliasId)) {
    throw new Error(`Undeclared release IR field alias: ${aliasId}`);
  }
  pushCount(map, aliasId);
}

function legacyProgramToSchemaArtifact(legacyProgram, options = {}) {
  const fixtureName = options.fixtureName || options.name || "anonymous_fixture";
  const schemaKinds = options.schemaKinds || DEFAULT_SCHEMA_KINDS;
  if (!isIrNode(legacyProgram) ||
      legacyProgram.kind !== RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.rootKind) {
    throw new Error(
      `Release IR mapping requires operational root ${RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.rootKind}`
    );
  }
  if (!Array.isArray(legacyProgram.body)) {
    throw new Error("Release IR operational Program.body must be an array");
  }
  const nodes = {};
  const seen = new Map();
  const sourceNodeOwners = new Map();
  const kindCounts = {};
  const kindAliases = {};
  const fieldAliases = {};
  const unmappedKinds = {};
  let generatedIdCounter = 0;

  function nextId(seed) {
    generatedIdCounter += 1;
    return fallbackId(seed, generatedIdCounter);
  }

  function nodeId(node, seed) {
    return isSchemaId(node.id) ? node.id : nextId(seed || node.kind || fixtureName);
  }

  function ref(value, seed) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      if (isSchemaId(value)) return value;
      throw new Error(`Release IR node reference at ${seed} is not a schema id`);
    }
    if (isIrNode(value)) return visit(value, seed);
    throw new Error(`Release IR child at ${seed} is not an IR node or schema id`);
  }

  function refs(values, seed) {
    if (values === null || values === undefined) return [];
    if (!Array.isArray(values)) {
      throw new Error(`Release IR child list at ${seed} must be an array`);
    }
    return values.map((value, index) => {
      if (value === null || value === undefined) {
        throw new Error(`Release IR child list at ${seed}:${index} contains a null entry`);
      }
      const mappedRef = ref(value, `${seed}:${index}`);
      if (mappedRef === null) {
        throw new Error(`Release IR child list at ${seed}:${index} did not produce a node ref`);
      }
      return mappedRef;
    });
  }

  function visit(node, seed) {
    if (!isIrNode(node)) {
      throw new Error(`Release IR child at ${seed} is not an IR node`);
    }
    if (node.kind === "Program") {
      throw new Error(`Nested Program node is invalid at ${seed}`);
    }

    if (seen.has(node)) return seen.get(node);
    const id = nodeId(node, seed);
    if (sourceNodeOwners.has(id) && sourceNodeOwners.get(id) !== node) {
      throw new Error(`Duplicate release IR source node id: ${id}`);
    }
    sourceNodeOwners.set(id, node);

    const mappedKind = mapKind(node.kind, schemaKinds);
    if (!mappedKind) {
      pushCount(unmappedKinds, node.kind);
      return null;
    }

    if (mappedKind !== node.kind) {
      pushCount(kindAliases, `${node.kind}->${mappedKind}`);
    }

    const out = {
      id,
      kind: mappedKind
    };
    seen.set(node, id);
    nodes[id] = out;
    pushCount(kindCounts, mappedKind);
    addMeta(out, node, mappedKind);

    const span = locationToSpan(node.loc || node.span);
    if (span) out.span = span;
    if (typeof node.name === "string") out.name = node.name;
    if (typeof node.operator === "string") out.operator = node.operator;
    if (typeof node.prefix === "boolean") out.prefix = node.prefix;
    if (typeof node.async === "boolean") out.async = node.async;
    if (typeof node.generator === "boolean") out.generator = node.generator;

    switch (node.kind) {
    case "Identifier":
    case "Parameter":
      if (typeof node.name === "string") out.binding = node.name;
      break;
    case "Literal":
      out.value = sanitize(node.value);
      out.raw = node.raw === undefined ? null : String(node.raw);
      out.literalKind = node.literalKind || (node.type && node.type.primitiveType) || typeof node.value;
      break;
    case "VariableDeclarator":
      pushDeclaredFieldAlias(fieldAliases, "varKind->declarationKind");
      out.declarationKind = node.varKind || "let";
      out.declarations = [{
        id,
        pattern: null,
        init: ref(node.init, `${id}:init`),
        kind: node.varKind || "let",
        name: node.name || null,
        sourceNodeId: node.id || null
      }];
      break;
    case "FunctionDeclaration":
      pushDeclaredFieldAlias(fieldAliases, "parameters->params");
      out.params = refs(node.parameters || node.params, `${id}:params`);
      out.body = ref(node.body, `${id}:body`);
      out.returnType = sanitize(node.returnType);
      break;
    case "BlockStatement":
      out.statements = refs(node.statements || node.body, `${id}:statements`);
      if (node.test) out.test = ref(node.test, `${id}:test`);
      break;
    case "ExpressionStatement":
      out.expression = ref(node.expression, `${id}:expression`);
      break;
    case "ReturnStatement":
      pushDeclaredFieldAlias(fieldAliases, "value->argument");
      out.argument = ref(node.argument || node.value, `${id}:argument`);
      break;
    case "IfStatement":
      pushDeclaredFieldAlias(fieldAliases, "condition->test");
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.consequent = ref(node.consequent, `${id}:consequent`);
      out.alternate = ref(node.alternate, `${id}:alternate`);
      break;
    case "ForStatement":
      pushDeclaredFieldAlias(fieldAliases, "condition->test");
      out.init = ref(node.init, `${id}:init`);
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.update = ref(node.update, `${id}:update`);
      out.body = ref(node.body, `${id}:body`);
      break;
    case "WhileStatement":
    case "DoWhileStatement":
      pushDeclaredFieldAlias(fieldAliases, "condition->test");
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.body = ref(node.body, `${id}:body`);
      break;
    case "SwitchStatement":
      out.discriminant = ref(node.discriminant, `${id}:discriminant`);
      out.cases = refs(node.cases, `${id}:cases`);
      break;
    case "SwitchCase":
      out.test = ref(node.test, `${id}:test`);
      out.statements = refs(node.consequent || node.statements || [], `${id}:consequent`);
      break;
    case "BinaryExpression":
    case "LogicalExpression":
      out.left = ref(node.left, `${id}:left`);
      out.right = ref(node.right, `${id}:right`);
      break;
    case "UnaryExpression":
      pushDeclaredFieldAlias(fieldAliases, "operand->argument");
      out.operator = `unary:${node.operator || ""}`;
      out.argument = ref(node.argument || node.operand, `${id}:argument`);
      break;
    case "AssignmentExpression":
      out.left = ref(node.left, `${id}:left`);
      out.right = ref(node.right, `${id}:right`);
      break;
    case "UpdateExpression":
      out.argument = ref(node.argument, `${id}:argument`);
      break;
    case "ConditionalExpression":
      if (node.condition && !node.test) {
        pushDeclaredFieldAlias(fieldAliases, "condition->test");
      }
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.consequent = ref(node.consequent, `${id}:consequent`);
      out.alternate = ref(node.alternate, `${id}:alternate`);
      break;
    case "CallExpression":
      pushDeclaredFieldAlias(fieldAliases, "args->arguments");
      out.callee = ref(node.callee, `${id}:callee`);
      out.arguments = refs(node.args || node.arguments, `${id}:args`);
      out.optional = Boolean(node.optional);
      break;
    case "MemberExpression":
      out.object = ref(node.object, `${id}:object`);
      out.property = ref(node.property, `${id}:property`);
      out.computed = Boolean(node.computed);
      out.optional = Boolean(node.optional);
      break;
    case "ArrayExpression":
      out.elements = refs(node.elements, `${id}:elements`);
      break;
    case "ObjectExpression":
      out.properties = refs(node.properties, `${id}:properties`);
      break;
    case "Property":
      out.key = ref(node.key, `${id}:key`);
      out.valueRef = ref(node.value, `${id}:value`);
      break;
    case "BreakStatement":
    case "ContinueStatement":
      break;
    default:
      for (const [key, value] of Object.entries(node)) {
        if (["id", "kind", "loc", "span", "metadata", "type"].includes(key)) continue;
        if (Array.isArray(value) && value.every(isIrNode)) {
          out[key] = refs(value, `${id}:${key}`);
        } else if (isIrNode(value)) {
          out[key] = ref(value, `${id}:${key}`);
        }
      }
      break;
    }

    return id;
  }

  const body = refs(legacyProgram.body || [], `${fixtureName}:body`);
  const moduleId = isSchemaId(legacyProgram.id) ? legacyProgram.id : nextId(`${fixtureName}:module`);
  const artifact = {
    schemaVersion: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version,
    module: {
      id: moduleId,
      source: {
        path: options.sourcePath || null,
        hash: hashText(options.source || "")
      },
      body,
      metadata: {
        sourceLanguage: options.sourceLanguage || null,
        fixture: fixtureName,
        legacyRootKind: legacyProgram.kind || null,
        transitionPolicy: RELEASE_IR_SURFACE_CONTRACT.decision,
        transitionMarker: RELEASE_IR_SURFACE_CONTRACT.compatibility.artifactMetadataMarker,
        releaseIrContractVersion: RELEASE_IR_SURFACE_CONTRACT.contractVersion,
        sourceSurface: `${RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.id}/${RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.version}`,
        targetSurface: `${RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.id}/${RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version}`
      }
    },
    nodes
  };

  return {
    artifact,
    kindCounts,
    kindAliases,
    fieldAliases,
    unmappedKinds
  };
}

function collectReleaseNodeShapeFailures(artifact) {
  const failures = [];

  function requireField(nodeId, node, field, predicate, expectation) {
    if (!Object.prototype.hasOwnProperty.call(node, field) || !predicate(node[field])) {
      failures.push(`${nodeId}.${field} must be ${expectation}`);
    }
  }

  function refOrNull(value) {
    return value === null || isSchemaId(value);
  }

  function refList(value) {
    return Array.isArray(value) && value.every(isSchemaId);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.length > 0;
  }

  for (const [nodeId, node] of Object.entries(artifact.nodes || {})) {
    const mappingMeta = node.meta && node.meta.schemaArtifactMapping;
    const originalKind = mappingMeta && mappingMeta.originalKind;
    const aliasPolicy = Object.values(KIND_ALIAS_POLICIES)
      .find(policy => policy.sourceKind === originalKind);
    const expectedMappedKind = aliasPolicy ? aliasPolicy.targetKind : originalKind;

    if (!nonEmptyString(originalKind)) {
      failures.push(`${nodeId} must declare a non-empty original kind`);
    }
    if (node.kind !== expectedMappedKind) {
      failures.push(
        `${nodeId}.kind must be ${String(expectedMappedKind)} for original kind ${String(originalKind)}`
      );
    }
    if (!mappingMeta || mappingMeta.mappedKind !== expectedMappedKind) {
      failures.push(
        `${nodeId}.meta.schemaArtifactMapping.mappedKind must be ${String(expectedMappedKind)}`
      );
    }

    switch (originalKind) {
    case "Identifier":
    case "Parameter":
      requireField(nodeId, node, "binding", value => typeof value === "string", "a binding string");
      break;
    case "Literal":
      requireField(nodeId, node, "value", () => true, "present");
      requireField(nodeId, node, "literalKind", value => typeof value === "string", "a literal kind string");
      break;
    case "VariableDeclarator":
      requireField(nodeId, node, "declarationKind", nonEmptyString, "a non-empty declaration kind string");
      requireField(nodeId, node, "declarations", value =>
        Array.isArray(value) &&
        value.length === 1 &&
        value.every(declaration =>
          declaration &&
          declaration.id === nodeId &&
          refOrNull(declaration.pattern) &&
          refOrNull(declaration.init) &&
          (isSchemaId(declaration.pattern) || nonEmptyString(declaration.name))),
      "one declaration envelope with a binding name or pattern and resolvable refs");
      break;
    case "FunctionDeclaration":
      requireField(nodeId, node, "params", refList, "a node-ref list");
      requireField(nodeId, node, "body", isSchemaId, "a node ref");
      break;
    case "BlockStatement":
      requireField(nodeId, node, "statements", refList, "a node-ref list");
      break;
    case "ExpressionStatement":
      requireField(nodeId, node, "expression", isSchemaId, "a node ref");
      break;
    case "ReturnStatement":
      requireField(nodeId, node, "argument", refOrNull, "a node ref or null");
      break;
    case "IfStatement":
      requireField(nodeId, node, "test", isSchemaId, "a node ref");
      requireField(nodeId, node, "consequent", isSchemaId, "a node ref");
      requireField(nodeId, node, "alternate", refOrNull, "a node ref or null");
      break;
    case "ForStatement":
      requireField(nodeId, node, "init", refOrNull, "a node ref or null");
      requireField(nodeId, node, "test", refOrNull, "a node ref or null");
      requireField(nodeId, node, "update", refOrNull, "a node ref or null");
      requireField(nodeId, node, "body", isSchemaId, "a node ref");
      break;
    case "WhileStatement":
    case "DoWhileStatement":
      requireField(nodeId, node, "test", isSchemaId, "a node ref");
      requireField(nodeId, node, "body", isSchemaId, "a node ref");
      break;
    case "SwitchStatement":
      requireField(nodeId, node, "discriminant", isSchemaId, "a node ref");
      requireField(nodeId, node, "cases", refList, "a node-ref list");
      break;
    case "SwitchCase":
      requireField(nodeId, node, "test", refOrNull, "a node ref or null");
      requireField(nodeId, node, "statements", refList, "a node-ref list");
      break;
    case "BinaryExpression":
    case "LogicalExpression":
      requireField(nodeId, node, "operator", nonEmptyString, "a non-empty operator string");
      requireField(nodeId, node, "left", isSchemaId, "a node ref");
      requireField(nodeId, node, "right", isSchemaId, "a node ref");
      break;
    case "UnaryExpression":
      requireField(nodeId, node, "operator", value =>
        typeof value === "string" &&
        value.startsWith("unary:") &&
        value.length > "unary:".length,
      "a unary-prefixed non-empty operator");
      requireField(nodeId, node, "argument", isSchemaId, "a node ref");
      break;
    case "AssignmentExpression":
      requireField(nodeId, node, "operator", nonEmptyString, "a non-empty operator string");
      requireField(nodeId, node, "left", isSchemaId, "a node ref");
      requireField(nodeId, node, "right", isSchemaId, "a node ref");
      break;
    case "ConditionalExpression":
      requireField(nodeId, node, "test", isSchemaId, "a node ref");
      requireField(nodeId, node, "consequent", isSchemaId, "a node ref");
      requireField(nodeId, node, "alternate", isSchemaId, "a node ref");
      break;
    case "CallExpression":
      requireField(nodeId, node, "callee", isSchemaId, "a node ref");
      requireField(nodeId, node, "arguments", refList, "a node-ref list");
      break;
    case "MemberExpression":
      requireField(nodeId, node, "object", isSchemaId, "a node ref");
      requireField(nodeId, node, "property", isSchemaId, "a node ref");
      break;
    case "ArrayExpression":
      requireField(nodeId, node, "elements", refList, "a node-ref list");
      break;
    case "ObjectExpression":
      requireField(nodeId, node, "properties", refList, "a node-ref list");
      break;
    case "Property":
      requireField(nodeId, node, "key", isSchemaId, "a node ref");
      requireField(nodeId, node, "valueRef", isSchemaId, "a node ref");
      break;
    case "BreakStatement":
    case "ContinueStatement":
      break;
    default:
      failures.push(`${nodeId} has no Denali RC release-shape policy for original kind ${String(originalKind)}`);
      break;
    }
  }

  return failures;
}

function validateReleaseIrSurfaceMapping(mapping) {
  const artifact = mapping.artifact || mapping;
  const metadata = artifact.module && artifact.module.metadata;
  const declaredKindAliases = new Set(Object.keys(KIND_ALIAS_POLICIES));
  const declaredFieldAliases = new Set(Object.keys(FIELD_ALIAS_POLICIES));
  const nodeShapeFailures = collectReleaseNodeShapeFailures(artifact);
  const checks = [
    {
      name: "release-contract-version-marked",
      passed: metadata && metadata.releaseIrContractVersion === RELEASE_IR_SURFACE_CONTRACT.contractVersion,
      detail: metadata && metadata.releaseIrContractVersion
    },
    {
      name: "release-transition-marked",
      passed: metadata &&
        metadata.transitionPolicy === RELEASE_IR_SURFACE_CONTRACT.decision &&
        metadata.transitionMarker === RELEASE_IR_SURFACE_CONTRACT.compatibility.artifactMetadataMarker,
      detail: metadata && {
        transitionPolicy: metadata.transitionPolicy,
        transitionMarker: metadata.transitionMarker
      }
    },
    {
      name: "release-surfaces-versioned",
      passed: metadata &&
        metadata.sourceSurface === `${RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.id}/${RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.version}` &&
        metadata.targetSurface === `${RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.id}/${RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version}`,
      detail: metadata && {
        sourceSurface: metadata.sourceSurface,
        targetSurface: metadata.targetSurface
      }
    },
    {
      name: "release-operational-root-kind",
      passed: metadata &&
        metadata.legacyRootKind === RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.rootKind,
      detail: metadata && metadata.legacyRootKind
    },
    {
      name: "release-aliases-declared",
      passed: Object.keys(mapping.kindAliases || {}).every(alias => declaredKindAliases.has(alias)) &&
        Object.keys(mapping.fieldAliases || {}).every(alias => declaredFieldAliases.has(alias)),
      detail: {
        kindAliases: Object.keys(mapping.kindAliases || {}),
        fieldAliases: Object.keys(mapping.fieldAliases || {})
      }
    },
    {
      name: "release-schema-version-aligned",
      passed: artifact.schemaVersion === RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version,
      detail: artifact.schemaVersion
    },
    {
      name: "release-original-kind-shapes",
      passed: nodeShapeFailures.length === 0,
      detail: nodeShapeFailures
    }
  ];

  return {
    ok: checks.every(check => check.passed),
    checks,
    failures: checks.filter(check => !check.passed)
  };
}

function fixtureToSchemaArtifact(fixture, legacyProgram, options = {}) {
  return legacyProgramToSchemaArtifact(legacyProgram, {
    ...options,
    fixtureName: fixture.name,
    source: fixture.source,
    sourceLanguage: fixture.sourceLanguage
  });
}

function collectReferenceFailures(artifact) {
  const failures = [];
  const nodes = artifact.nodes || {};

  function checkRef(owner, field, value) {
    if (value === null || value === undefined) return;
    if (!isSchemaId(value)) {
      failures.push(`${owner}.${field} is not a schema node ref: ${String(value)}`);
      return;
    }
    if (!nodes[value]) {
      failures.push(`${owner}.${field} references missing node ${value}`);
    }
  }

  for (const bodyRef of artifact.module.body || []) {
    checkRef("module", "body", bodyRef);
  }

  for (const [nodeId, node] of Object.entries(nodes)) {
    for (const field of NODE_REF_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(node, field)) {
        checkRef(nodeId, field, node[field]);
      }
    }
    for (const field of NODE_REF_LIST_FIELDS) {
      if (Array.isArray(node[field])) {
        for (const value of node[field]) checkRef(nodeId, field, value);
      }
    }
    for (const declaration of node.declarations || []) {
      checkRef(`${nodeId}.declarations`, "pattern", declaration.pattern);
      checkRef(`${nodeId}.declarations`, "init", declaration.init);
    }
  }

  return failures;
}

function validateSchemaArtifactCompatibility(mapping) {
  const artifact = mapping.artifact || mapping;
  const nodes = artifact.nodes || {};
  const nodeIds = Object.keys(nodes);
  const referenceFailures = collectReferenceFailures(artifact);
  const unmappedKinds = mapping.unmappedKinds || {};
  const checks = [
    {
      name: "schema-version",
      passed: artifact.schemaVersion === "1.0.0",
      detail: artifact.schemaVersion
    },
    {
      name: "module-id-shape",
      passed: isSchemaId(artifact.module && artifact.module.id),
      detail: artifact.module && artifact.module.id
    },
    {
      name: "module-body-resolves",
      passed: referenceFailures.filter(failure => failure.startsWith("module.body")).length === 0,
      detail: artifact.module && artifact.module.body ? artifact.module.body.length : 0
    },
    {
      name: "node-ids-match-map-keys",
      passed: nodeIds.every(id => nodes[id] && nodes[id].id === id),
      detail: nodeIds.length
    },
    {
      name: "node-ids-are-schema-ids",
      passed: nodeIds.every(isSchemaId),
      detail: nodeIds.length
    },
    {
      name: "node-references-resolve",
      passed: referenceFailures.length === 0,
      detail: referenceFailures
    },
    {
      name: "no-unmapped-kinds",
      passed: Object.keys(unmappedKinds).length === 0,
      detail: unmappedKinds
    },
    {
      name: "source-surface-marked",
      passed: nodeIds.every(id => {
        const bridge = nodes[id].meta && nodes[id].meta.schemaArtifactMapping;
        return bridge &&
          bridge.sourceSurface === "legacy-object-tree" &&
          bridge.artifactSurface === "canonical-ir-schema-v1-derived";
      }),
      detail: nodeIds.length
    }
  ];

  return {
    ok: checks.every(check => check.passed),
    checks,
    failures: checks.filter(check => !check.passed)
  };
}

module.exports = {
  KIND_ALIASES,
  KIND_ALIAS_POLICIES,
  FIELD_ALIAS_POLICIES,
  RELEASE_IR_SURFACE_CONTRACT,
  schemaKindsFromSchema,
  legacyProgramToSchemaArtifact,
  fixtureToSchemaArtifact,
  validateSchemaArtifactCompatibility,
  validateReleaseIrSurfaceMapping,
  hashText
};
