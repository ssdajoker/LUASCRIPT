"use strict";

const crypto = require("crypto");

const KIND_ALIASES = Object.freeze({
  Parameter: "Identifier",
  VariableDeclarator: "VariableDeclaration",
  SwitchCase: "BlockStatement",
  UnaryExpression: "BinaryExpression"
});

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
  return new Set(Array.isArray(kinds) ? kinds : Array.from(DEFAULT_SCHEMA_KINDS));
}

function mapKind(kind, schemaKinds = DEFAULT_SCHEMA_KINDS) {
  if (schemaKinds.has(kind)) return kind;
  return KIND_ALIASES[kind] || null;
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
      artifactSurface: "canonical-ir-schema-v1-derived"
    }
  };
}

function legacyProgramToSchemaArtifact(legacyProgram, options = {}) {
  const fixtureName = options.fixtureName || options.name || "anonymous_fixture";
  const schemaKinds = options.schemaKinds || DEFAULT_SCHEMA_KINDS;
  const nodes = {};
  const seen = new Map();
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
    if (typeof value === "string") return isSchemaId(value) ? value : null;
    if (isIrNode(value)) return visit(value, seed);
    return null;
  }

  function refs(values, seed) {
    return (values || []).map((value, index) => ref(value, `${seed}:${index}`)).filter(Boolean);
  }

  function visit(node, seed) {
    if (!isIrNode(node)) return null;
    if (node.kind === "Program") return null;

    const id = nodeId(node, seed);
    if (seen.has(node)) return seen.get(node);
    if (nodes[id]) return id;

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
      pushCount(fieldAliases, "varKind->declarationKind");
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
      pushCount(fieldAliases, "parameters->params");
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
      pushCount(fieldAliases, "value->argument");
      out.argument = ref(node.argument || node.value, `${id}:argument`);
      break;
    case "IfStatement":
      pushCount(fieldAliases, "condition->test");
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.consequent = ref(node.consequent, `${id}:consequent`);
      out.alternate = ref(node.alternate, `${id}:alternate`);
      break;
    case "ForStatement":
      pushCount(fieldAliases, "condition->test");
      out.init = ref(node.init, `${id}:init`);
      out.test = ref(node.test || node.condition, `${id}:test`);
      out.update = ref(node.update, `${id}:update`);
      out.body = ref(node.body, `${id}:body`);
      break;
    case "WhileStatement":
    case "DoWhileStatement":
      pushCount(fieldAliases, "condition->test");
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
      pushCount(fieldAliases, "operand->argument");
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
      out.test = ref(node.test, `${id}:test`);
      out.consequent = ref(node.consequent, `${id}:consequent`);
      out.alternate = ref(node.alternate, `${id}:alternate`);
      break;
    case "CallExpression":
      pushCount(fieldAliases, "args->arguments");
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
    schemaVersion: "1.0.0",
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
        transitionPolicy: "dual-surface-derived-artifact"
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
  schemaKindsFromSchema,
  legacyProgramToSchemaArtifact,
  fixtureToSchemaArtifact,
  validateSchemaArtifactCompatibility,
  hashText
};
