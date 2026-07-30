"use strict";

const assert = require("assert");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");
const { CoreLanguageBridge } = require("../../src/compilers/core-language-bridge");
const {
  fixtureToSchemaArtifact,
  legacyProgramToSchemaArtifact,
  schemaKindsFromSchema,
  validateSchemaArtifactCompatibility,
  validateReleaseIrSurfaceMapping,
  KIND_ALIAS_POLICIES,
  FIELD_ALIAS_POLICIES,
  RELEASE_IR_SURFACE_CONTRACT
} = require("../../src/ir/schema_artifact_bridge");
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
const pinnedSchemaPath = path.join(repoRoot, "docs", "schema", "1.0.0", "canonical_ir.schema.json");
const majorAliasSchemaPath = path.join(repoRoot, "docs", "schema", "1.x", "canonical_ir.schema.json");
const reportPath = path.join(repoRoot, "artifacts", "conformance", "dual-surface-compatibility-bridge-report.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const pinnedSchema = JSON.parse(fs.readFileSync(pinnedSchemaPath, "utf8"));
const majorAliasSchema = JSON.parse(fs.readFileSync(majorAliasSchemaPath, "utf8"));
const schemaKinds = schemaKindsFromSchema(schema);
const bridge = new CoreLanguageBridge();
const startedAt = Date.now();

function pushCount(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function validateWithAjv(validate, artifact) {
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

function compileSchema(schemaDocument, referencedSchemas = []) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const referencedSchema of referencedSchemas) ajv.addSchema(referencedSchema);
  return ajv.compile(schemaDocument);
}

function semanticSchemaView(schemaDocument) {
  const view = JSON.parse(JSON.stringify(schemaDocument));
  delete view.$id;
  return view;
}

function countChecks(target, checks) {
  target.total += checks.length;
  target.passed += checks.filter(check => check.passed).length;
  target.failed += checks.filter(check => !check.passed).length;
}

function main() {
  const validate = compileSchema(schema);
  const validatePinned = compileSchema(pinnedSchema);
  const validateMajorAlias = compileSchema(majorAliasSchema, [pinnedSchema]);
  const results = [];
  const failures = [];
  const globalKindAliases = {};
  const globalFieldAliases = {};
  const globalMappedKinds = {};
  const invariantChecks = {
    total: 0,
    passed: 0,
    failed: 0
  };
  const contractMappingChecks = {
    total: 0,
    passed: 0,
    failed: 0
  };
  const determinismChecks = {
    total: 0,
    passed: 0,
    failed: 0
  };
  const releaseShapeSamples = {};
  const requiredNegativeShapeSamples = [
    "AssignmentExpression",
    "BinaryExpression",
    "DoWhileStatement",
    "Parameter",
    "VariableDeclarator",
    "SwitchCase",
    "UnaryExpression"
  ];
  const rootExports = require("../../src/unified_luascript");
  const contractStaticChecks = [
    {
      name: "contract-version",
      passed: RELEASE_IR_SURFACE_CONTRACT.contractVersion === "1.0.0",
      detail: RELEASE_IR_SURFACE_CONTRACT.contractVersion
    },
    {
      name: "chosen-one-way-transition",
      passed: RELEASE_IR_SURFACE_CONTRACT.decision === "versioned-one-way-dual-surface-transition" &&
        RELEASE_IR_SURFACE_CONTRACT.direction === "legacy-to-canonical",
      detail: {
        decision: RELEASE_IR_SURFACE_CONTRACT.decision,
        direction: RELEASE_IR_SURFACE_CONTRACT.direction
      }
    },
    {
      name: "surface-versions",
      passed: RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.version === "v0" &&
        RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version === "1.0.0" &&
        schema.properties.schemaVersion.const === "1.0.0" &&
        pinnedSchema.properties.schemaVersion.const === "1.0.0",
      detail: {
        operational: RELEASE_IR_SURFACE_CONTRACT.surfaces.operational.version,
        canonical: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version
      }
    },
    {
      name: "latest-pinned-schema-semantic-parity",
      passed: JSON.stringify(semanticSchemaView(schema)) === JSON.stringify(semanticSchemaView(pinnedSchema)),
      detail: {
        latest: fileHash(schemaPath),
        pinned: fileHash(pinnedSchemaPath),
        ignoredDifference: "$id"
      }
    },
    {
      name: "major-alias-target",
      passed: majorAliasSchema.$ref === "../1.0.0/canonical_ir.schema.json",
      detail: majorAliasSchema.$ref
    },
    {
      name: "exact-kind-alias-registry",
      passed: Object.keys(KIND_ALIAS_POLICIES).sort().join("|") === [
        "Parameter->Identifier",
        "SwitchCase->BlockStatement",
        "UnaryExpression->BinaryExpression",
        "VariableDeclarator->VariableDeclaration"
      ].sort().join("|"),
      detail: Object.keys(KIND_ALIAS_POLICIES).sort()
    },
    {
      name: "exact-field-alias-registry",
      passed: Object.keys(FIELD_ALIAS_POLICIES).sort().join("|") === [
        "args->arguments",
        "condition->test",
        "operand->argument",
        "parameters->params",
        "value->argument",
        "varKind->declarationKind"
      ].sort().join("|"),
      detail: Object.keys(FIELD_ALIAS_POLICIES).sort()
    },
    {
      name: "legacy-deprecation-horizon",
      passed: RELEASE_IR_SURFACE_CONTRACT.deprecation.legacySurface === "SUPPORTED_THROUGH_LUASCRIPT_1_X" &&
        RELEASE_IR_SURFACE_CONTRACT.deprecation.removalEarliestPackageMajor === "2.0.0" &&
        RELEASE_IR_SURFACE_CONTRACT.deprecation.prerequisites.length === 4,
      detail: RELEASE_IR_SURFACE_CONTRACT.deprecation
    },
    {
      name: "reverse-conversion-not-claimed",
      passed: RELEASE_IR_SURFACE_CONTRACT.bridge.reverseConversion === "NOT_PROVIDED_OR_CLAIMED" &&
        RELEASE_IR_SURFACE_CONTRACT.bridge.semanticEquivalence === "NOT_CLAIMED" &&
        RELEASE_IR_SURFACE_CONTRACT.bridge.sourcePreservation === "NOT_CLAIMED",
      detail: RELEASE_IR_SURFACE_CONTRACT.bridge
    },
    {
      name: "bridge-not-root-exported",
      passed: !Object.prototype.hasOwnProperty.call(rootExports, "legacyProgramToSchemaArtifact") &&
        !Object.prototype.hasOwnProperty.call(rootExports, "RELEASE_IR_SURFACE_CONTRACT"),
      detail: Object.keys(rootExports).sort()
    }
  ];
  const contractStaticSummary = {
    total: contractStaticChecks.length,
    passed: contractStaticChecks.filter(check => check.passed).length,
    failed: contractStaticChecks.filter(check => !check.passed).length
  };
  for (const check of contractStaticChecks.filter(check => !check.passed)) {
    failures.push({
      name: `release-ir-contract:${check.name}`,
      message: JSON.stringify(check.detail)
    });
  }

  for (const fixture of manifest.fixtures) {
    if (fixture.expectedFailure) {
      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "expected-diagnostic-preserved",
        phase: fixture.expectedFailure.phase || "compile",
        messageIncludes: fixture.expectedFailure.messageIncludes || []
      });
      continue;
    }

    try {
      const legacyProgram = bridge.compileToIR(fixture.source, fixture.sourceLanguage);
      const mapping = fixtureToSchemaArtifact(fixture, legacyProgram, { schemaKinds });
      const repeatedMapping = fixtureToSchemaArtifact(fixture, legacyProgram, { schemaKinds });
      const schemaValidation = validateWithAjv(validate, mapping.artifact);
      const pinnedSchemaValidation = validateWithAjv(validatePinned, mapping.artifact);
      const majorAliasSchemaValidation = validateWithAjv(validateMajorAlias, mapping.artifact);
      const compatibility = validateSchemaArtifactCompatibility(mapping);
      const releaseContract = validateReleaseIrSurfaceMapping(mapping);
      const deterministic = JSON.stringify(mapping.artifact) === JSON.stringify(repeatedMapping.artifact);

      for (const [nodeId, node] of Object.entries(mapping.artifact.nodes)) {
        const originalKind = node.meta &&
          node.meta.schemaArtifactMapping &&
          node.meta.schemaArtifactMapping.originalKind;
        if (requiredNegativeShapeSamples.includes(originalKind) && !releaseShapeSamples[originalKind]) {
          releaseShapeSamples[originalKind] = {
            mapping: JSON.parse(JSON.stringify(mapping)),
            nodeId
          };
        }
      }

      assert.strictEqual(schemaValidation.ok, true, `${fixture.name} bridge artifact is not schema-valid: ${JSON.stringify(schemaValidation.errors)}`);
      assert.strictEqual(pinnedSchemaValidation.ok, true, `${fixture.name} bridge artifact is not pinned-schema-valid: ${JSON.stringify(pinnedSchemaValidation.errors)}`);
      assert.strictEqual(majorAliasSchemaValidation.ok, true, `${fixture.name} bridge artifact is not 1.x-alias-valid: ${JSON.stringify(majorAliasSchemaValidation.errors)}`);
      assert.strictEqual(compatibility.ok, true, `${fixture.name} compatibility bridge invariants failed: ${JSON.stringify(compatibility.failures)}`);
      assert.strictEqual(releaseContract.ok, true, `${fixture.name} release IR contract checks failed: ${JSON.stringify(releaseContract.failures)}`);
      assert.strictEqual(deterministic, true, `${fixture.name} derived artifact is not deterministic for identical input and options`);

      for (const [key, count] of Object.entries(mapping.kindAliases)) pushCount(globalKindAliases, key, count);
      for (const [key, count] of Object.entries(mapping.fieldAliases)) pushCount(globalFieldAliases, key, count);
      for (const [key, count] of Object.entries(mapping.kindCounts)) pushCount(globalMappedKinds, key, count);
      countChecks(invariantChecks, compatibility.checks);
      countChecks(contractMappingChecks, releaseContract.checks);
      countChecks(determinismChecks, [{
        name: "identical-input-artifact-determinism",
        passed: deterministic
      }]);

      results.push({
        name: fixture.name,
        sourceLanguage: fixture.sourceLanguage,
        status: "bridge-compatible-derived-artifact",
        legacyRootKind: legacyProgram.kind || null,
        schemaVersion: mapping.artifact.schemaVersion,
        nodeCount: Object.keys(mapping.artifact.nodes).length,
        artifactSha256: hashText(JSON.stringify(mapping.artifact)),
        latestSchemaValid: schemaValidation.ok,
        pinnedSchemaValid: pinnedSchemaValidation.ok,
        majorAliasSchemaValid: majorAliasSchemaValidation.ok,
        deterministic,
        compatibilityChecks: compatibility.checks,
        releaseContractChecks: releaseContract.checks,
        kindAliases: mapping.kindAliases,
        fieldAliases: mapping.fieldAliases,
        mappedKinds: mapping.kindCounts
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

  const supplementalFixture = {
    name: "release_shape_do_while",
    sourceLanguage: "javascript",
    source: "let x = 0; do { x = x + 1; } while (x < 3);"
  };
  const supplementalLegacyProgram = bridge.compileToIR(
    supplementalFixture.source,
    supplementalFixture.sourceLanguage
  );
  const supplementalMapping = fixtureToSchemaArtifact(
    supplementalFixture,
    supplementalLegacyProgram,
    { schemaKinds }
  );
  const supplementalSchemaValidation = validateWithAjv(validate, supplementalMapping.artifact);
  const supplementalCompatibility = validateSchemaArtifactCompatibility(supplementalMapping);
  const supplementalReleaseContract = validateReleaseIrSurfaceMapping(supplementalMapping);
  const supplementalPositiveShapeChecks = [{
    name: "do-while-current-bridge-projection",
    passed: supplementalSchemaValidation.ok &&
      supplementalCompatibility.ok &&
      supplementalReleaseContract.ok,
    detail: {
      schema: supplementalSchemaValidation.errors,
      compatibility: supplementalCompatibility.failures,
      releaseContract: supplementalReleaseContract.failures
    }
  }];
  for (const [nodeId, node] of Object.entries(supplementalMapping.artifact.nodes)) {
    const originalKind = node.meta &&
      node.meta.schemaArtifactMapping &&
      node.meta.schemaArtifactMapping.originalKind;
    if (requiredNegativeShapeSamples.includes(originalKind) && !releaseShapeSamples[originalKind]) {
      releaseShapeSamples[originalKind] = {
        mapping: JSON.parse(JSON.stringify(supplementalMapping)),
        nodeId
      };
    }
  }
  const supplementalPositiveShapeSummary = {
    total: supplementalPositiveShapeChecks.length,
    passed: supplementalPositiveShapeChecks.filter(check => check.passed).length,
    failed: supplementalPositiveShapeChecks.filter(check => !check.passed).length
  };
  for (const check of supplementalPositiveShapeChecks.filter(check => !check.passed)) {
    failures.push({
      name: `release-ir-supplemental-shape:${check.name}`,
      message: JSON.stringify(check.detail)
    });
  }

  const negativeShapeCases = [
    {
      name: "binary-expression-missing-left",
      originalKind: "BinaryExpression",
      mutate(node) {
        delete node.left;
      }
    },
    {
      name: "binary-expression-empty-operator",
      originalKind: "BinaryExpression",
      mutate(node) {
        node.operator = "";
      }
    },
    {
      name: "assignment-expression-missing-operator",
      originalKind: "AssignmentExpression",
      mutate(node) {
        delete node.operator;
      }
    },
    {
      name: "do-while-statement-missing-body",
      originalKind: "DoWhileStatement",
      mutate(node) {
        delete node.body;
      }
    },
    {
      name: "parameter-missing-binding",
      originalKind: "Parameter",
      mutate(node) {
        delete node.binding;
      }
    },
    {
      name: "variable-declarator-missing-envelope",
      originalKind: "VariableDeclarator",
      mutate(node) {
        delete node.declarations;
      }
    },
    {
      name: "variable-declarator-missing-binding",
      originalKind: "VariableDeclarator",
      mutate(node) {
        delete node.name;
        delete node.declarations[0].name;
        node.declarations[0].pattern = null;
      }
    },
    {
      name: "switch-case-missing-statements",
      originalKind: "SwitchCase",
      mutate(node) {
        delete node.statements;
      }
    },
    {
      name: "unary-expression-loses-encoding",
      originalKind: "UnaryExpression",
      mutate(node) {
        node.operator = "unary:";
      }
    },
    {
      name: "mapped-node-kind-drift",
      originalKind: "BinaryExpression",
      mutate(node) {
        node.kind = "Literal";
      }
    },
    {
      name: "mapped-kind-metadata-drift",
      originalKind: "BinaryExpression",
      mutate(node) {
        node.meta.schemaArtifactMapping.mappedKind = "Literal";
      }
    },
    {
      name: "unknown-original-kind-fails-closed",
      originalKind: "BinaryExpression",
      mutate(node) {
        node.meta.schemaArtifactMapping.originalKind = "UnknownReleaseKind";
      }
    }
  ];
  const negativeShapeChecks = negativeShapeCases.map(testCase => {
    const sample = releaseShapeSamples[testCase.originalKind];
    if (!sample) {
      return {
        name: testCase.name,
        passed: false,
        detail: `missing sample for ${testCase.originalKind}`
      };
    }
    const malformedMapping = JSON.parse(JSON.stringify(sample.mapping));
    testCase.mutate(malformedMapping.artifact.nodes[sample.nodeId]);
    const validation = validateReleaseIrSurfaceMapping(malformedMapping);
    return {
      name: testCase.name,
      passed: !validation.ok &&
        validation.failures.some(failure => failure.name === "release-original-kind-shapes"),
      detail: validation.failures
    };
  });
  const negativeShapeSummary = {
    total: negativeShapeChecks.length,
    passed: negativeShapeChecks.filter(check => check.passed).length,
    failed: negativeShapeChecks.filter(check => !check.passed).length
  };
  for (const check of negativeShapeChecks.filter(check => !check.passed)) {
    failures.push({
      name: `release-ir-negative-shape:${check.name}`,
      message: JSON.stringify(check.detail)
    });
  }

  const sourceShapeRejectionCases = [
    {
      name: "non-program-operational-root",
      messageIncludes: "requires operational root Program",
      program: {
        kind: "BlockStatement",
        statements: []
      }
    },
    {
      name: "program-body-non-node-entry",
      messageIncludes: "is not an IR node or schema id",
      program: {
        kind: "Program",
        body: [123]
      }
    },
    {
      name: "program-body-null-entry",
      messageIncludes: "contains a null entry",
      program: {
        kind: "Program",
        body: [null]
      }
    },
    {
      name: "duplicate-explicit-source-node-id",
      messageIncludes: "Duplicate release IR source node id",
      program: {
        kind: "Program",
        body: [
          { id: "node_1", kind: "Literal", value: 1 },
          { id: "node_1", kind: "Literal", value: 2 }
        ]
      }
    },
    {
      name: "call-arguments-non-node-entry",
      messageIncludes: "is not an IR node or schema id",
      program: {
        kind: "Program",
        body: [{
          kind: "ExpressionStatement",
          expression: {
            kind: "CallExpression",
            callee: { kind: "Identifier", name: "f" },
            args: [123]
          }
        }]
      }
    }
  ];
  const sourceShapeRejectionChecks = sourceShapeRejectionCases.map(testCase => {
    try {
      legacyProgramToSchemaArtifact(testCase.program, {
        fixtureName: `negative_${testCase.name}`,
        schemaKinds
      });
      return {
        name: testCase.name,
        passed: false,
        detail: "mapping unexpectedly succeeded"
      };
    } catch (error) {
      return {
        name: testCase.name,
        passed: error.message.includes(testCase.messageIncludes),
        detail: error.message
      };
    }
  });
  const sourceShapeRejectionSummary = {
    total: sourceShapeRejectionChecks.length,
    passed: sourceShapeRejectionChecks.filter(check => check.passed).length,
    failed: sourceShapeRejectionChecks.filter(check => !check.passed).length
  };
  for (const check of sourceShapeRejectionChecks.filter(check => !check.passed)) {
    failures.push({
      name: `release-ir-source-shape:${check.name}`,
      message: check.detail
    });
  }

  const compatibleResults = results.filter(result => result.status === "bridge-compatible-derived-artifact");
  const expectedDiagnostics = results.filter(result => result.status === "expected-diagnostic-preserved");
  const positiveCount = manifest.fixtures.length - expectedDiagnostics.length;
  const report = {
    schemaVersion: 1,
    kind: "luascript:dual-surface-compatibility-bridge",
    command: "npm run test:ir-compatibility-bridge",
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    environment: environmentMetadata(),
    manifest: manifestEvidence(manifestPath, manifest, manifest.fixtures.map(fixture => fixture.name)),
    schema: {
      version: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.version,
      latest: {
        path: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.schemaPath,
        sha256: fileHash(schemaPath)
      },
      pinnedRc: {
        path: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.pinnedSchemaPath,
        sha256: fileHash(pinnedSchemaPath)
      },
      majorAlias: {
        path: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical.majorAliasPath,
        sha256: fileHash(majorAliasSchemaPath),
        ref: majorAliasSchema.$ref
      },
      latestAndPinnedSemanticParityExceptId: contractStaticChecks
        .find(check => check.name === "latest-pinned-schema-semantic-parity").passed
    },
    supportMatrixTraceability: supportMatrixTraceability({
      supportRows: [
        "Canonical IR conformance",
        "Dual-surface IR compatibility bridge",
        "Big Remaining Climb final release IR surface"
      ],
      evidenceRole: "Validates the chosen internal one-way transition from current legacy object-tree IR to versioned schema-valid canonical IR artifacts.",
      boundary: "This report chooses the versioned one-way dual-surface release-IR transition for Denali RC internals. It does not make the bridge public API, change compiler output, provide reverse conversion, prove semantic equivalence or source preservation, or release canonical 1.0."
    }),
    governingContract: {
      path: "docs/LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md",
      sha256: fileHash(path.join(repoRoot, "docs", "LUASCRIPT_RELEASE_IR_SURFACE_CONTRACT.md"))
    },
    implementationEvidence: [
      "src/ir/release_ir_surface_contract.js",
      "src/ir/schema_artifact_bridge.js",
      "tests/conformance/dual_surface_compatibility_bridge.test.js",
      "src/unified_luascript.js"
    ].map(relativePath => ({
      path: relativePath,
      sha256: fileHash(path.join(repoRoot, relativePath))
    })),
    releaseIrSurfaceContract: RELEASE_IR_SURFACE_CONTRACT,
    bridgePolicy: {
      contractVersion: RELEASE_IR_SURFACE_CONTRACT.contractVersion,
      decision: RELEASE_IR_SURFACE_CONTRACT.decision,
      direction: RELEASE_IR_SURFACE_CONTRACT.direction,
      implementation: RELEASE_IR_SURFACE_CONTRACT.bridge.implementation,
      legacySurface: RELEASE_IR_SURFACE_CONTRACT.surfaces.operational,
      schemaSurface: RELEASE_IR_SURFACE_CONTRACT.surfaces.canonical,
      publicApiStatus: "INTERNAL_ONLY",
      releaseSurfaceStatus: "CHOSEN_VERSIONED_ONE_WAY_DUAL_SURFACE",
      invariantFamilies: [
        "schema-version",
        "module-id-shape",
        "module-body-resolves",
        "node-ids-match-map-keys",
        "node-ids-are-schema-ids",
        "node-references-resolve",
        "no-unmapped-kinds",
        "source-surface-marked"
      ]
    },
    summary: {
      total: manifest.fixtures.length,
      positiveFixtures: positiveCount,
      bridgeCompatibleDerivedArtifacts: compatibleResults.length,
      schemaValidDerivedArtifacts: compatibleResults.length,
      expectedDiagnostics: expectedDiagnostics.length,
      failed: failures.length,
      invariantChecks,
      contractStaticChecks: contractStaticSummary,
      contractMappingChecks,
      determinismChecks,
      supplementalPositiveShapeChecks: supplementalPositiveShapeSummary,
      negativeShapeChecks: negativeShapeSummary,
      sourceShapeRejectionChecks: sourceShapeRejectionSummary,
      globalKindAliases,
      globalFieldAliases,
      globalMappedKinds
    },
    verificationDetails: {
      contractStaticChecks,
      supplementalPositiveShapeChecks,
      negativeShapeChecks,
      sourceShapeRejectionChecks
    },
    results,
    failures
  };

  writeJsonReport(reportPath, report);
  console.log(
    `Dual-surface compatibility bridge passed: ${compatibleResults.length}/${positiveCount} positive fixtures; ${invariantChecks.passed}/${invariantChecks.total} base invariants; ${contractStaticSummary.passed}/${contractStaticSummary.total} contract checks; ${contractMappingChecks.passed}/${contractMappingChecks.total} mapping-contract checks; ${determinismChecks.passed}/${determinismChecks.total} deterministic artifacts; ${supplementalPositiveShapeSummary.passed}/${supplementalPositiveShapeSummary.total} supplemental positive shape checks; ${negativeShapeSummary.passed}/${negativeShapeSummary.total} malformed-shape negatives; ${sourceShapeRejectionSummary.passed}/${sourceShapeRejectionSummary.total} malformed-source rejections; ${expectedDiagnostics.length} expected diagnostics preserved`
  );
  console.log(`Dual-surface compatibility bridge report: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
