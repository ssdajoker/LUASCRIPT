/**
 * F# PHASE C PARSER - TIER 3 IMPLEMENTATION
 * Parses F# Phase C features into AST:
 * - Computation expressions
 * - Active patterns
 * - Discriminated unions + records
 * - Units of measure
 * - Type providers (simulated)
 * - Pattern matching + guards
 * - Tier 2 semantic validation hooks (nested CE, exhaustiveness, measures)
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");
const { ForensicDebugTools, DEBUG_MODES } = require("../forensic_debug_tools");

class FSharpPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "FSharp",
      ...config
    });

    this.forensic = config.forensicDebugTools || new ForensicDebugTools(
      config.forensicMode || DEBUG_MODES.PRODUCTION,
      config.forensicOptions || {}
    );

    this.parserMetrics = {
      computationsParsed: 0,
      activePatternsParsed: 0,
      unionsParsed: 0,
      recordsParsed: 0,
      recordExpressionsParsed: 0,
      typeProvidersParsed: 0,
      matchExpressionsParsed: 0,
      measuresParsed: 0
    };

    this.diagnostics = { errors: [], warnings: [] };
    this.measureDefinitions = new Set();
    this.measureUses = [];
    this.pendingMeasureAnnotation = false;
    this.activePatternRegistry = [];
    this.unionRegistry = [];
  }

  parse(tokens) {
    this.tokens = tokens || [];
    this.position = 0;
    this.diagnostics = { errors: [], warnings: [] };
    this.measureDefinitions = new Set();
    this.measureUses = [];
    this.pendingMeasureAnnotation = false;
    this.activePatternRegistry = [];
    this.unionRegistry = [];

    const ast = {
      kind: "program",
      language: "FSharp",
      computations: [],
      activePatterns: [],
      unions: [],
      records: [],
      recordExpressions: [],
      typeProviders: [],
      measures: [],
      matchExpressions: [],
      metadata: {
        hasMeasures: false,
        diagnostics: this.diagnostics,
        measures: {
          defined: [],
          used: []
        },
        activePatternOverlaps: [],
        exhaustivenessWarnings: []
      }
    };

    if (!this.tokens.length) return ast;

    let iterations = 0;
    const maxIterations = Math.max(this.tokens.length * 4, 1000);

    const loopId = "fsharp_parse_main";
    this.forensic.monitorLoop(loopId, maxIterations);

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      this.forensic.logIteration(loopId);
      const current = this.peek();
      if (!current) break;

      if (current.type === "CE_BUILDER") {
        const node = this.parseComputationExpression();
        if (node) {
          ast.computations.push(node);
          this.parserMetrics.computationsParsed++;
        }
        continue;
      }

      if (current.type === "ACTIVE_PATTERN_START") {
        const node = this.parseActivePattern();
        if (node) {
          ast.activePatterns.push(node);
          this.parserMetrics.activePatternsParsed++;
        }
        continue;
      }

      if (current.type === "TYPE_KEYWORD") {
        const node = this.parseTypeDefinition();
        if (node) {
          if (node.kind === "discriminated_union") {
            ast.unions.push(node);
            this.parserMetrics.unionsParsed++;
          } else if (node.kind === "record_type") {
            ast.records.push(node);
            this.parserMetrics.recordsParsed++;
          } else if (node.kind === "type_provider") {
            ast.typeProviders.push(node);
            this.parserMetrics.typeProvidersParsed++;
          }
        }
        continue;
      }

      if (current.type === "MATCH_KEYWORD") {
        const node = this.parseMatchExpression();
        if (node) {
          ast.matchExpressions.push(node);
          this.parserMetrics.matchExpressionsParsed++;
        }
        continue;
      }

      if (current.type === "SYMBOL" && current.value === "{") {
        const node = this.parseRecordExpression();
        if (node) {
          ast.recordExpressions.push(node);
          this.parserMetrics.recordExpressionsParsed++;
        }
        continue;
      }

      if (current.type === "MEASURE_ANNOTATION" || current.type === "MEASURE_TYPE") {
        ast.metadata.hasMeasures = true;
        this.parserMetrics.measuresParsed++;
        if (current.type === "MEASURE_ANNOTATION") {
          this.pendingMeasureAnnotation = true;
          this.advance();
        } else {
          const measureName = current.value.replace(/[<>]/g, "");
          if (measureName) {
            this.measureUses.push(measureName);
            if (!this.measureDefinitions.has(measureName)) {
              this.recordWarning("MEASURE_UNDECLARED", `Measure '${measureName}' used before declaration`, {
                measure: measureName
              });
            }
          }
          this.advance();
        }
        continue;
      }

      this.advance();
    }

    this.forensic.completeLoop(loopId);

    if (iterations >= maxIterations) {
      throw new Error("Parse iteration limit reached");
    }

    ast.metadata.measures.defined = Array.from(this.measureDefinitions);
    ast.metadata.measures.used = [...this.measureUses];

    return ast;
  }

  parseComputationExpression() {
    const builderToken = this.advance();
    const builder = builderToken.value;

    const steps = [];
    if (this.check("SYMBOL", "{")) this.advance();

    let iterations = 0;
    const maxIterations = 500;
    const loopId = `fsharp_parse_ce_${this.position}`;
    this.forensic.monitorLoop(loopId, maxIterations);

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      this.forensic.logIteration(loopId);
      const token = this.peek();
      if (!token) break;

      if (token.type === "SYMBOL" && token.value === "}") {
        this.advance();
        break;
      }

      if (token.type === "CE_LET_BANG" || token.type === "CE_DO_BANG" || token.type === "CE_USE_BANG") {
        const kind = token.type === "CE_LET_BANG" ? "let_bang" : (token.type === "CE_DO_BANG" ? "do_bang" : "use_bang");
        this.advance();
        const name = this.check("IDENTIFIER") ? this.advance().value : null;
        if (this.check("EQUALS")) this.advance();
        const expr = this.collectExpressionWithNested(["CE_LET_BANG", "CE_DO_BANG", "CE_USE_BANG", "CE_RETURN", "CE_RETURN_BANG", "CE_YIELD", "CE_YIELD_BANG", "SYMBOL"]);
        steps.push({ kind, name, expr });
        continue;
      }

      if (token.type === "CE_RETURN" || token.type === "CE_RETURN_BANG" || token.type === "CE_YIELD" || token.type === "CE_YIELD_BANG") {
        const kind = token.type === "CE_RETURN" ? "return" : token.type === "CE_RETURN_BANG" ? "return_bang" : token.type === "CE_YIELD" ? "yield" : "yield_bang";
        this.advance();
        const expr = this.collectExpressionWithNested(["CE_LET_BANG", "CE_DO_BANG", "CE_USE_BANG", "CE_RETURN", "CE_RETURN_BANG", "CE_YIELD", "CE_YIELD_BANG", "SYMBOL"]);
        steps.push({ kind, expr });
        continue;
      }

      this.advance();
    }

    this.forensic.completeLoop(loopId);

    return {
      kind: "computation_expression",
      builder,
      steps
    };
  }

  parseActivePattern() {
    this.expect("ACTIVE_PATTERN_START");
    const cases = [];

    while (!this.isAtEnd() && !this.check("ACTIVE_PATTERN_END")) {
      if (this.check("PIPE")) {
        this.advance();
        continue;
      }
      if (this.check("IDENTIFIER") || this.check("CONSTRUCTOR")) {
        cases.push(this.advance().value);
        continue;
      }
      this.advance();
    }

    this.expect("ACTIVE_PATTERN_END");

    const parameter = this.check("IDENTIFIER") ? this.advance().value : null;

    const node = {
      kind: "active_pattern",
      cases,
      parameter
    };

    this.validateActivePatternOverlap(node);
    return node;
  }

  parseTypeDefinition() {
    this.expect("TYPE_KEYWORD");
    const nameToken = this.check("IDENTIFIER") || this.check("CONSTRUCTOR") ? this.advance() : { value: "Anonymous" };

    if (this.pendingMeasureAnnotation) {
      const measureName = nameToken.value;
      if (this.measureDefinitions.has(measureName)) {
        this.recordWarning("MEASURE_REDECLARED", `Measure '${measureName}' redeclared`, { measure: measureName });
      } else {
        this.measureDefinitions.add(measureName);
      }
      this.pendingMeasureAnnotation = false;
      return {
        kind: "measure_type",
        name: measureName
      };
    }

    if (this.check("EQUALS")) this.advance();

    if (this.check("TYPE_PROVIDER")) {
      const providerToken = this.advance();
      const providerArgs = this.collectProviderArgs(providerToken.value);
      if (providerArgs.error) {
        this.recordError("TYPE_PROVIDER_MISSING_CLOSE", providerArgs.error, {
          provider: providerToken.value
        });
      }
      return {
        kind: "type_provider",
        name: nameToken.value,
        provider: providerToken.value,
        arguments: providerArgs.args,
        error: providerArgs.error
      };
    }

    if (this.check("SYMBOL", "{")) {
      const fields = this.parseRecordFields();
      return {
        kind: "record_type",
        name: nameToken.value,
        fields
      };
    }

    const cases = [];
    let iterations = 0;
    const maxIterations = 500;
    const loopId = `fsharp_parse_union_${nameToken.value}`;
    this.forensic.monitorLoop(loopId, maxIterations);

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      this.forensic.logIteration(loopId);

      if (this.check("TYPE_KEYWORD") || this.check("LET_KEYWORD") || this.check("MATCH_KEYWORD") || this.check("ACTIVE_PATTERN_START") || this.check("CE_BUILDER")) break;

      if (this.check("PIPE")) {
        this.advance();
        continue;
      }

      if (this.check("CONSTRUCTOR") || this.check("IDENTIFIER")) {
        const caseName = this.advance().value;
        const caseFields = [];
        while (!this.isAtEnd() && !this.check("PIPE") && !this.check("TYPE_KEYWORD") && !this.check("MATCH_KEYWORD")) {
          if (this.check("OF_KEYWORD") || this.check("COLON") || this.check("IDENTIFIER") || this.check("CONSTRUCTOR") || this.check("SYMBOL", "*")) {
            caseFields.push(this.advance().value);
          } else {
            if (this.check("SYMBOL", "{")) break;
            this.advance();
          }
          if (this.check("SYMBOL", "}")) break;
        }
        cases.push({ name: caseName, fields: caseFields.filter(Boolean) });
        continue;
      }

      this.advance();
    }

    this.forensic.completeLoop(loopId);

    const node = {
      kind: "discriminated_union",
      name: nameToken.value,
      cases
    };

    this.unionRegistry.push(node);
    return node;
  }

  parseRecordFields() {
    this.expect("SYMBOL", "{");
    const fields = [];

    while (!this.isAtEnd() && !this.check("SYMBOL", "}")) {
      if (this.check("IDENTIFIER") || this.check("CONSTRUCTOR")) {
        const name = this.advance().value;
        if (this.check("COLON")) this.advance();
        const fieldType = this.collectExpression(["SYMBOL"]);
        fields.push({ name, fieldType });
        continue;
      }
      this.advance();
    }

    this.expect("SYMBOL", "}");
    return fields;
  }

  parseRecordExpression() {
    this.expect("SYMBOL", "{");
    const fields = [];

    while (!this.isAtEnd() && !this.check("SYMBOL", "}")) {
      if (this.check("IDENTIFIER") || this.check("CONSTRUCTOR")) {
        const name = this.advance().value;
        if (this.check("EQUALS")) this.advance();
        const value = this.collectExpression(["SYMBOL"]);
        fields.push({ name, value });
        continue;
      }
      this.advance();
    }

    this.expect("SYMBOL", "}");
    return {
      kind: "record_expression",
      fields
    };
  }

  parseMatchExpression() {
    this.expect("MATCH_KEYWORD");
    const scrutinee = this.check("IDENTIFIER") ? this.advance().value : this.collectExpression(["WITH_KEYWORD"]);

    if (this.check("WITH_KEYWORD")) this.advance();

    const cases = [];
    let iterations = 0;
    const maxIterations = 500;

    const loopId = `fsharp_parse_match_${this.position}`;
    this.forensic.monitorLoop(loopId, maxIterations);

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      this.forensic.logIteration(loopId);

      if (this.check("PIPE")) {
        this.advance();
      }

      if (this.check("IDENTIFIER") || this.check("CONSTRUCTOR") || this.check("SYMBOL", "_")) {
        const pattern = this.advance().value;
        let guard = null;
        if (this.check("WHEN_KEYWORD")) {
          this.advance();
          guard = this.collectExpression(["ARROW"]);
        }
        if (this.check("ARROW")) this.advance();
        const body = this.collectExpression(["PIPE", "TYPE_KEYWORD", "LET_KEYWORD"]);
        cases.push({ pattern, guard, body });
        continue;
      }

      if (this.check("TYPE_KEYWORD") || this.check("LET_KEYWORD")) break;
      this.advance();
    }

    this.forensic.completeLoop(loopId);

    const node = {
      kind: "match_expression",
      scrutinee,
      cases
    };

    this.checkMatchExhaustiveness(node);
    return node;
  }

  collectProviderArgs(providerName) {
    if (!this.check("SYMBOL", "<")) return { args: "", error: null };
    this.advance();
    const parts = [];
    while (!this.isAtEnd() && !this.check("SYMBOL", ">")) {
      parts.push(this.advance().value);
    }
    if (!this.check("SYMBOL", ">")) {
      return {
        args: parts.join(" ").trim(),
        error: `Type provider '${providerName || "Unknown"}' missing closing '>'`
      };
    }
    this.advance();
    return { args: parts.join(" ").trim(), error: null };
  }

  collectExpression(stopTypes) {
    const parts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      const token = this.peek();
      if (!token) break;

      if (stopTypes.includes(token.type) || (token.type === "SYMBOL" && stopTypes.includes("SYMBOL"))) {
        break;
      }

      if (token.type === "SYMBOL" && (token.value === ";" || token.value === "}")) {
        break;
      }

      parts.push(this.advance().value);
    }

    return parts.join(" ").trim();
  }

  collectExpressionWithNested(stopTypes) {
    const parts = [];
    const rawParts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      const token = this.peek();
      if (!token) break;

      if (stopTypes.includes(token.type) || (token.type === "SYMBOL" && stopTypes.includes("SYMBOL"))) {
        break;
      }

      if (token.type === "SYMBOL" && (token.value === ";" || token.value === "}")) {
        break;
      }

      if (token.type === "CE_BUILDER") {
        const nested = this.parseComputationExpression();
        parts.push(nested);
        rawParts.push(`__ce(${nested.builder})`);
        continue;
      }

      const value = this.advance().value;
      parts.push(value);
      rawParts.push(value);
    }

    const raw = rawParts.join(" ").trim();
    const hasNested = parts.some(p => typeof p === "object" && p && p.kind === "computation_expression");
    if (!hasNested) return raw;
    return {
      kind: "expression",
      raw,
      parts
    };
  }

  validateActivePatternOverlap(node) {
    const cases = node.cases || [];
    const normalized = cases.map(c => c.trim()).filter(Boolean);
    const hasPartial = normalized.includes("_");

    const duplicates = normalized.filter((c, idx) => normalized.indexOf(c) !== idx);
    if (duplicates.length > 0) {
      this.recordWarning("ACTIVE_PATTERN_DUPLICATE_CASE", `Active pattern has duplicate cases: ${[...new Set(duplicates)].join(", ")}`);
    }

    if (normalized.filter(c => c === "_").length > 1) {
      this.recordWarning("ACTIVE_PATTERN_MULTIPLE_WILDCARDS", "Active pattern defines multiple wildcard (_) cases");
    }

    for (const existing of this.activePatternRegistry) {
      const overlap = normalized.filter(c => c !== "_" && existing.cases.includes(c));
      if (overlap.length > 0 && (hasPartial || existing.partial)) {
        this.recordWarning("ACTIVE_PATTERN_OVERLAP", `Overlapping partial active patterns for cases: ${overlap.join(", ")}`);
      }
    }

    this.activePatternRegistry.push({ cases: normalized, partial: hasPartial });
  }

  checkMatchExhaustiveness(node) {
    const patterns = (node.cases || []).map(c => c.pattern).filter(Boolean);
    if (patterns.includes("_")) return;

    for (const union of this.unionRegistry) {
      const unionCases = (union.cases || []).map(c => c.name).filter(Boolean);
      const matched = patterns.filter(p => unionCases.includes(p));
      if (matched.length === 0) continue;

      const missing = unionCases.filter(c => !patterns.includes(c));
      if (missing.length > 0) {
        const message = `Match expression missing cases for union '${union.name}': ${missing.join(", ")}`;
        this.recordWarning("DU_EXHAUSTIVENESS", message, {
          union: union.name,
          missing
        });
      }
    }
  }

  recordError(code, message, details = {}) {
    this.diagnostics.errors.push({ code, message, ...details });
  }

  recordWarning(code, message, details = {}) {
    this.diagnostics.warnings.push({ code, message, ...details });
  }

  // Helpers
  peek() {
    return this.tokens[this.position];
  }

  advance() {
    return this.tokens[this.position++];
  }

  check(type, value) {
    const token = this.peek();
    if (!token) return false;
    if (value !== undefined) return token.type === type && token.value === value;
    return token.type === type;
  }

  expect(type, value) {
    if (this.check(type, value)) return this.advance();
    return null;
  }

  isAtEnd() {
    return this.position >= this.tokens.length;
  }

  getMetrics() {
    return { ...this.parserMetrics };
  }
}

module.exports = FSharpPhaseC_Parser;
