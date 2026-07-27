"use strict";

/**
 * Legacy universal multi-language transpiler facade.
 *
 * This file now routes only through the active core language bridge. It is not
 * a proof of broad all-pairs support and it must fail explicitly for languages
 * or target pairs that do not have current core routing.
 */

const { CoreLanguageBridge } = require("./compilers");

const ACTIVE_LANGUAGE_FAMILIES = {
  javascript: "C-Family",
  typescript: "C-Family",
  luascript: "Canonical",
  lua: "Lua",
  python: "Script",
  ruby: "Script",
  php: "C-Family",
  dart: "C-Family",
  csharp: "C-Family",
  c: "C-Family",
  cpp: "C-Family",
  java: "C-Family",
  go: "C-Family",
  rust: "Systems",
  kotlin: "C-Family",
  elm: "Functional",
  gleam: "Functional"
};

const ADVISORY_ONLY_LANGUAGES = {
  groovy: "Legacy experiment only",
  v: "Legacy experiment only",
  perl: "Legacy experiment only",
  bash: "Legacy experiment only",
  fortran: "Legacy experiment only",
  pascal: "Legacy experiment only",
  html: "Not a core canonical source language",
  css: "Not a core canonical source language"
};

class UniversalMultiLanguageTranspiler {
  constructor(options = {}) {
    this.bridge = new CoreLanguageBridge(options.bridge || {});
    this.sourceLanguages = new Set(this.bridge.getSupportedSourceLanguages());
    this.targetLanguages = new Set(this.bridge.getSupportedTargetLanguages());
    this.languages = this.buildLanguageRegistry();
    this.bridgeMatrix = this.generateBridgeMatrix();
  }

  buildLanguageRegistry() {
    const registry = {};

    for (const [language, family] of Object.entries(ACTIVE_LANGUAGE_FAMILIES)) {
      registry[language] = {
        family,
        mode: "core-bridge",
        sourceSupported: this.sourceLanguages.has(language),
        targetSupported: this.targetLanguages.has(language),
        advisory: false
      };
    }

    for (const [language, note] of Object.entries(ADVISORY_ONLY_LANGUAGES)) {
      registry[language] = {
        family: "Advisory",
        mode: "unqualified",
        sourceSupported: false,
        targetSupported: false,
        advisory: true,
        note
      };
    }

    return registry;
  }

  generateBridgeMatrix() {
    const matrix = {};
    const languages = Object.keys(this.languages);

    for (const from of languages) {
      matrix[from] = {};
      for (const to of languages) {
        matrix[from][to] = this.isLanguagePairSupported(from, to) ? "core-bridge" : "unsupported";
      }
    }

    return matrix;
  }

  getSupportedPairs() {
    const pairs = [];
    for (const from of Object.keys(this.languages)) {
      for (const to of Object.keys(this.languages)) {
        if (this.isLanguagePairSupported(from, to)) {
          pairs.push({ from, to });
        }
      }
    }
    return pairs;
  }

  getCapabilityStats() {
    const languages = Object.keys(this.languages);
    const possiblePairs = languages.length * languages.length;
    const supportedPairs = this.getSupportedPairs().length;

    return {
      languages,
      totalLanguages: languages.length,
      possiblePairs,
      supportedPairs,
      completeness: `${((supportedPairs / possiblePairs) * 100).toFixed(1)}%`,
      families: this.getLanguageFamilies(),
      roundTripSupport: false,
      transitiveTranslation: false,
      supportMode: "core-bridge-only"
    };
  }

  getLanguageFamilies() {
    const families = {};
    for (const [language, config] of Object.entries(this.languages)) {
      if (!families[config.family]) {
        families[config.family] = [];
      }
      families[config.family].push(language);
    }
    return families;
  }

  validateLanguages(source, target) {
    if (!this.languages[source]) {
      throw new Error(`Unsupported source language: ${source}`);
    }
    if (!this.languages[target]) {
      throw new Error(`Unsupported target language: ${target}`);
    }
    if (!this.isLanguagePairSupported(source, target)) {
      const sourceStatus = this.languages[source];
      const targetStatus = this.languages[target];
      if (sourceStatus && sourceStatus.advisory) {
        throw new Error(`Source language ${source} is advisory-only in transpiler_universal.js`);
      }
      if (targetStatus && targetStatus.advisory) {
        throw new Error(`Target language ${target} is advisory-only in transpiler_universal.js`);
      }
      throw new Error(`Language pair ${source} -> ${target} is not core-integrated`);
    }
    return true;
  }

  transpile(sourceCode, sourceLanguage, targetLanguage) {
    const startTime = Date.now();
    try {
      this.validateLanguages(sourceLanguage, targetLanguage);

      const result = this.bridge.transpileSource(sourceCode, {
        sourceLanguage,
        targetLanguage,
        filename: `main.${sourceLanguage}`
      });

      return {
        success: true,
        code: result.code,
        sourceLanguage,
        targetLanguage,
        duration: Date.now() - startTime,
        type: sourceLanguage === targetLanguage ? "passthrough" : "core-bridge",
        metrics: {
          inputSize: sourceCode.length,
          outputSize: result.code.length,
          compressionRatio: (result.code.length / Math.max(sourceCode.length, 1)).toFixed(2)
        },
        ir: result.ir || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sourceLanguage,
        targetLanguage,
        duration: Date.now() - startTime,
        type: "error"
      };
    }
  }

  parseToAST(_source, language) {
    if (!this.sourceLanguages.has(language)) {
      throw new Error(`No active source parser facade for ${language}`);
    }
    throw new Error("parseToAST is deprecated for the core bridge; use transpile() or bridge.compileToIR()");
  }

  createIRFromAST(_ast, language) {
    if (!this.sourceLanguages.has(language)) {
      throw new Error(`No active IR lowering facade for ${language}`);
    }
    throw new Error("createIRFromAST is deprecated for the core bridge; use bridge.compileToIR()");
  }

  emitFromIR(ir, language) {
    if (!this.targetLanguages.has(language)) {
      throw new Error(`No active target emitter facade for ${language}`);
    }
    return this.bridge.emitFromIR(ir, language, ir && ir.metadata && ir.metadata.sourceLanguage
      ? ir.metadata.sourceLanguage
      : "javascript");
  }

  roundtripTranslate(sourceCode, languagePath) {
    const results = [];
    let currentCode = sourceCode;

    for (let index = 0; index < languagePath.length - 1; index++) {
      const from = languagePath[index];
      const to = languagePath[index + 1];
      const result = this.transpile(currentCode, from, to);
      results.push(result);

      if (!result.success) {
        return {
          success: false,
          error: `Failed at ${from} -> ${to}: ${result.error}`,
          results,
          path: languagePath
        };
      }

      currentCode = result.code;
    }

    return {
      success: true,
      code: currentCode,
      path: languagePath,
      hops: Math.max(languagePath.length - 1, 0),
      results,
      integrityScore: this.calculateIntegrityScore(results)
    };
  }

  calculateIntegrityScore(results) {
    let score = 100;
    for (const result of results) {
      if (!result.metrics) continue;
      const ratio = Number.parseFloat(result.metrics.compressionRatio);
      if (!Number.isFinite(ratio)) continue;
      if (ratio > 2) score -= 10;
      if (ratio < 0.5) score -= 5;
    }
    return Math.max(score, 0);
  }

  getParserForLanguage(language) {
    if (!this.sourceLanguages.has(language)) {
      throw new Error(`No parser for language: ${language}`);
    }
    return null;
  }

  getEmitterForLanguage(language) {
    if (!this.targetLanguages.has(language)) {
      throw new Error(`No emitter for language: ${language}`);
    }
    return null;
  }

  getSupportedLanguages() {
    return Object.keys(this.languages).sort();
  }

  isLanguagePairSupported(source, target) {
    return this.sourceLanguages.has(source) && this.targetLanguages.has(target);
  }

  getLanguageFamily(language) {
    return this.languages[language]?.family || "Unknown";
  }

  generateStatusReport() {
    const stats = this.getCapabilityStats();

    return {
      name: "UNIVERSAL MULTI-LANGUAGE TRANSPILER (CORE BRIDGE FACADE)",
      timestamp: new Date().toISOString(),
      advisory: true,
      statistics: stats,
      configuration: {
        mode: "core-bridge-only",
        sourceOfTruth: [
          "docs/LANGUAGE_SUPPORT_MATRIX.md",
          "PROJECT_STATUS.md",
          "docs/LUASCRIPT_MEGA_PLAN.md"
        ]
      },
      deployment: {
        status: "ADVISORY",
        qualityGate: "Use language:*:bidirectional and clarity:languages"
      },
      capabilities: {
        supportedPairs: this.getSupportedPairs(),
        unsupportedLanguages: Object.keys(ADVISORY_ONLY_LANGUAGES)
      },
      supportMatrix: this.generateSupportMatrix()
    };
  }

  generateSupportMatrix() {
    return this.generateBridgeMatrix();
  }
}

module.exports = { UniversalMultiLanguageTranspiler };
