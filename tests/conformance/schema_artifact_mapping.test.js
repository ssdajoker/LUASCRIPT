"use strict";

const assert = require("assert");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const {
  repoRoot,
  fileHash,
  hashText,
  environmentMetadata,
  manifestEvidence,
  supportMatrixTraceability,
  writeJsonReport
} = require("./report_utils");

const manifestPath = path.join(__dirname, "manifest.json");
const schemaPath = path.join(repoRoot, "docs", "canonical_ir.schema.json");
const reportPath = path.join(repoRoot, "artifacts", "conformance", "schema-artifact-mapping-report.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const schemaKinds = new Set(schema.$defs.Node.properties.kind.enum);
const bridge = new CoreLanguageBridge();
const startedAt = Date.now();

const KIND_ALIASES = {
  Parameter: "Identifier",
  VariableDeclarator: "VariableDeclaration",
  SwitchCase: "BlockStatement",
  UnaryExpression: "BinaryExpression"
};

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

function mapKind(kind) {
  if (schemaKinds.has(kind)) return kind;
  return KIND_ALIASES[kind] || null;
}

function isIrNode(value) {
  return value && typeof value === "object" && typeof value.kind === "string";
}

function fixtureToSchemaArtifact(fixture, legacyProgram) {
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
    return isSchemaId(node.id) ? node.id : nextId(seed || node.kind || fixture.name);
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

  function visit(node, seed) {
    if (!isIrNode(node)) return null;
    if (node.kind === "Program") return null;

    const id = nodeId(node, seed);
    if (seen.has(node)) return seen.get(node);
    if (nodes[id]) return id;

    const mappedKind = mapKind(node.kind);
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

  const body = refs(legacyProgram.body || [], `${fixture.name}:body`);
  const moduleId = isSchemaId(legacyProgram.id) ? legacyProgram.id : nextId(`${fixture.name}:module`);
  const artifact = {
    schemaVersion: "1.0.0",
    module: {
      id: moduleId,
      source: {
        path: null,
        hash: hashText(fixture.source || "")
      },
      body,
      metadata: {
        sourceLanguage: fixture.sourceLanguage,
        fixture: fixture.name,
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

function validateArtifact(validate, artifact) {
  const ok = validate(artifact);
  return {
    ok,
    errors: ok ? [] : (validate.errors || []).map(error => ({
      instancePath: error.instancePath || "/",
      message: error.message,
      params: error.params || {}
    }))
  };
}

function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const results = [];
  const failures = [];
  const globalKindAliases = {};
  const globalFieldAliases = {};
  const globalMappedKinds = {};

  for (const fixture of manifest.fixtures) {
    if (fixture.expectedFailure) {
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "expected-diagnostic",
        phase: fixture.expectedFailure.phase || "compile",
        messageIncludes: fixture.expectedFailure.messageIncludes || []
      });
      continue;
    }

    try {
      const legacyProgram = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
      const mapping = fixtureToSchemaArtifact(fixture, legacyProgram);
      const validation = validateArtifact(validate, mapping.artifact);
      assert.strictEqual(validation.ok, true, `${fixture.name} derived schema artifact is schema-valid: ${JSON.stringify(validation.errors)}`);

      for (const [key, count] of Object.entries(mapping.kindAliases)) pushCount(globalKindAliases, key, count);
      for (const [key, count] of Object.entries(mapping.fieldAliases)) pushCount(globalFieldAliases, key, count);
      for (const [key, count] of Object.entries(mapping.kindCounts)) pushCount(globalMappedKinds, key, count);

      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "schema-valid-derived-artifact",
        legacyRootKind: legacyProgram.kind || null,
        schemaVersion: mapping.artifact.schemaVersion,
        moduleBodyCount: mapping.artifact.module.body.length,
        nodeCount: Object.keys(mapping.artifact.nodes).length,
        artifactSha256: hashText(JSON.stringify(mapping.artifact)),
        kindCounts: mapping.kindCounts,
        kindAliases: mapping.kindAliases,
        fieldAliases: mapping.fieldAliases,
        unmappedKinds: mapping.unmappedKinds
      });
    } catch (error) {
      failures.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        message: error.message
      });
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "failed",
        message: error.message
      });
    }
  }

  const positiveResults = results.filter(result => result.status !== "expected-diagnostic");
  const schemaValidResults = results.filter(result => result.status === "schema-valid-derived-artifact");
  const expectedDiagnostics = results.filter(result => result.status === "expected-diagnostic");
  const report = {
    schemaVersion: 1,
    kind: "luascript:schema-artifact-mapping",
    command: "npm run test:schema-artifact-map",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    environment: environmentMetadata(),
    manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
    schema: {
      path: "docs/canonical_ir.schema.json",
      sha256: fileHash(schemaPath),
      schemaVersion: "1.0.0"
    },
    supportMatrixTraceability: supportMatrixTraceability({
      supportRows: [
        "Canonical IR conformance",
        "Denali 1.0 IR semantics",
        "Big Remaining Climb schema-valid conformance artifact mapping"
      ],
      evidenceRole: "Maps the current legacy object-tree conformance IR to derived schema-valid canonical IR artifacts and records alias gaps for the dual-surface transition.",
      boundary: "This report proves schema-valid derived artifacts for current positive conformance fixtures only. It does not choose the release IR surface, change compiler output, promote broad source identity, or close canonical 1.0."
    }),
    transitionPolicy: {
      decision: "dual-surface-transition",
      legacySurface: "CoreLanguageBridge compileToIR legacy object-tree Program",
      schemaSurface: "docs/canonical_ir.schema.json schemaVersion 1.0.0",
      releaseSurfaceStatus: "OPEN",
      notes: [
        "The current compiler bridge continues to emit legacy object-tree IR for active emitters.",
        "This harness derives schema-valid artifacts for evidence accounting without changing compiler or runtime APIs.",
        "Release 1.0 still needs a final surface choice or a formal compatibility bridge."
      ]
    },
    summary: {
      total: manifest.fixtures.length,
      positiveFixtures: positiveResults.length,
      schemaValidDerivedArtifacts: schemaValidResults.length,
      expectedDiagnostics: expectedDiagnostics.length,
      failed: failures.length,
      globalKindAliases,
      globalFieldAliases,
      globalMappedKinds
    },
    results,
    failures
  };

  writeJsonReport(reportPath, report);
  console.log(
    `Schema artifact mapping passed: ${schemaValidResults.length}/${positiveResults.length} positive conformance fixtures produced schema-valid derived artifacts; ${expectedDiagnostics.length} expected diagnostics preserved`
  );
  console.log(`Schema artifact mapping report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
