
/**
 * LUASCRIPT Unified System
 * Legacy facade that wires active components into one interface.
 * Current readiness is defined by strict npm gates and docs/LANGUAGE_SUPPORT_MATRIX.md.
 */

const { CoreTranspiler } = require("./core_transpiler");
const { RuntimeSystem } = require("./runtime_system");
const { AdvancedFeatures } = require("./advanced_features");
const { PerformanceTools } = require("./performance_tools");
const { AgenticIDE } = require("./agentic_ide");
const { EventEmitter } = require("events");
const metrics = require("./utils/metrics");

/**
 * A unified system that integrates all LUASCRIPT components into a single, powerful interface.
 * @extends EventEmitter
 */
class UnifiedLuaScript extends EventEmitter {
  /**
     * Creates an instance of the UnifiedLuaScript system.
     * @param {object} [options={}] - Configuration options for the system.
     * @param {string} [options.mode='production'] - The operating mode ('development', 'production', 'enterprise').
     * @param {boolean} [options.enableAll=true] - Whether to enable all components.
     * @param {boolean} [options.enableTranspiler=true] - Whether to enable the transpiler.
     * @param {boolean} [options.enableRuntime=true] - Whether to enable the runtime system.
     * @param {boolean} [options.enableAdvanced=true] - Whether to enable advanced language features.
     * @param {boolean} [options.enablePerformance=true] - Whether to enable performance tools.
     * @param {boolean} [options.enableIDE=true] - Whether to enable the agentic IDE.
     */
  constructor(options = {}) {
    super();
        
    this.options = {
      mode: options.mode || "production", // development, production, enterprise
      enableAll: options.enableAll !== false,
      enableTranspiler: options.enableTranspiler !== false,
      enableRuntime: options.enableRuntime !== false,
      enableAdvanced: options.enableAdvanced !== false,
      enablePerformance: options.enablePerformance !== false,
      enableIDE: options.enableIDE !== false,
      ...options
    };
        
    this.components = new Map();
    this.stats = {
      initialized: false,
      componentsLoaded: 0,
      totalComponents: 5,
      startTime: Date.now(),
      version: "1.0.0"
    };
        
    this.initializationPromise = this.initializeComponents();
  }

  /**
     * Initializes all the components of the unified system.
     * @returns {Promise<void>}
     */
  async initializeComponents() {
    this.emit("initStart");
        
    try {
      // Core transpiler component
      if (this.options.enableTranspiler) {
        this.components.set("transpiler", new CoreTranspiler(this.options.transpiler));
        this.stats.componentsLoaded++;
        this.emit("componentLoaded", { name: "transpiler", phase: "1-2" });
      }
            
      // Runtime system component
      if (this.options.enableRuntime) {
        this.components.set("runtime", new RuntimeSystem(this.options.runtime));
        await this.components.get("runtime").initialize();
        this.stats.componentsLoaded++;
        this.emit("componentLoaded", { name: "runtime", phase: "3-4" });
      }
            
      // Advanced feature component
      if (this.options.enableAdvanced) {
        this.components.set("advanced", new AdvancedFeatures(this.options.advanced));
        this.stats.componentsLoaded++;
        this.emit("componentLoaded", { name: "advanced", phase: "5" });
      }
            
      // Performance tools component
      if (this.options.enablePerformance) {
        this.components.set("performance", new PerformanceTools(this.options.performance));
        await this.components.get("performance").initialize();
        this.stats.componentsLoaded++;
        this.emit("componentLoaded", { name: "performance", phase: "6" });
      }
            
      // IDE component
      if (this.options.enableIDE) {
        this.components.set("ide", new AgenticIDE(this.options.ide));
        await this.components.get("ide").initialize();
        this.stats.componentsLoaded++;
        this.emit("componentLoaded", { name: "ide", phase: "7" });
      }
            
      this.stats.initialized = true;
      this.emit("initComplete", this.stats);
      if (metrics.PERF_ENABLE) {
        metrics.recordEvent("system.initComplete", { components: Array.from(this.components.keys()) });
      }
            
    } catch (error) {
      this.emit("initError", { error: error.message });
      throw error;
    }
  }

  /**
     * Transpiles JavaScript code to Lua, with optional advanced features and optimizations.
     * @param {string} jsCode - The JavaScript code to transpile.
     * @param {object} [options={}] - Transpilation options.
     * @returns {Promise<object>} A promise that resolves with the transpilation result.
     */
  async transpile(jsCode, options = {}) {
    const transpiler = this.components.get("transpiler");
    if (!transpiler) throw new Error("Transpiler not enabled");
        
    this.emit("transpileStart", { size: jsCode.length });
    const t = metrics.timeBlock("transpile");
        
    try {
      const sourceLanguage = options.sourceLanguage || "javascript";
      const targetLanguage = options.targetLanguage || "lua";

      // Core transpilation
      const rawResult = await transpiler.transpileSource(jsCode, {
        ...options,
        sourceLanguage,
        targetLanguage
      });
      let result = typeof rawResult === "string"
        ? {
          code: rawResult,
          stats: {
            originalSize: jsCode.length,
            transpiled: rawResult.length,
            optimizations: 0,
            filename: options.filename || "main.js",
            sourceLanguage,
            targetLanguage
          }
        }
        : { ...rawResult };
            
      // Apply advanced features if enabled
      if (this.components.has("advanced") && options.features) {
        const advanced = this.components.get("advanced");
        result.code = advanced.transform(result.code, options.features);
      }
            
      // Apply performance optimizations if enabled
      if (this.components.has("performance") && options.optimize) {
        const performance = this.components.get("performance");
        const optimized = await performance.optimize(result.code);
        result.code = optimized.code;
        result.optimizations = optimized.appliedOptimizations;
      }
            
      const timing = t.end({ sizeIn: jsCode.length, sizeOut: (result && result.code && result.code.length) || 0 });
      this.emit("transpileComplete", result);
      if (metrics.PERF_ENABLE) {
        metrics.incrementCounter("transpiles");
        metrics.recordEvent("transpile.complete", timing);
      }
      return result;
            
    } catch (error) {
      t.end({ error: true });
      this.emit("transpileError", { error: error.message });
      throw error;
    }
  }

  /**
     * Explicit multi-language entrypoint for source-language aware transpilation.
     * @param {string} sourceCode
     * @param {object} [options={}]
     * @param {string} [options.sourceLanguage='javascript']
     * @param {string} [options.targetLanguage='lua']
     * @returns {Promise<object>}
     */
  async transpileSource(sourceCode, options = {}) {
    return this.transpile(sourceCode, options);
  }

  /**
     * Executes Lua code in the runtime environment.
     * @param {string} luaCode - The Lua code to execute.
     * @param {object} [context={}] - The execution context.
     * @returns {Promise<*>} A promise that resolves with the execution result.
     */
  async execute(luaCode, context = {}) {
    const runtime = this.components.get("runtime");
    if (!runtime) throw new Error("Runtime not enabled");
        
    this.emit("executeStart", { size: luaCode.length });
    const t = metrics.timeBlock("execute");
        
    try {
      const result = await runtime.execute(luaCode, context);
      const timing = t.end({ size: luaCode.length, executionTime: result && result.executionTime });
      this.emit("executeComplete", result);
      if (metrics.PERF_ENABLE) {
        metrics.incrementCounter("executes");
        metrics.recordEvent("execute.complete", timing);
      }
      return result;
            
    } catch (error) {
      t.end({ error: true });
      this.emit("executeError", { error: error.message });
      throw error;
    }
  }

  /**
     * Transpiles and executes JavaScript code.
     * @param {string} jsCode - The JavaScript code to process.
     * @param {object} [options={}] - Transpilation and execution options.
     * @returns {Promise<object>} A promise that resolves with the combined result.
     */
  async transpileAndExecute(jsCode, options = {}) {
    this.emit("fullProcessStart");
    const t = metrics.timeBlock("transpileAndExecute");
        
    try {
      // Transpile JavaScript to Lua
      const transpileResult = await this.transpile(jsCode, options);
            
      // Execute the Lua code
      const executeResult = await this.execute(transpileResult.code, options.context);

      const transpileMetric = (transpileResult.stats && (transpileResult.stats.elapsedTime || transpileResult.stats.duration || transpileResult.stats.originalSize)) || 0;
      const executionMetric = (executeResult && executeResult.executionTime) || 0;

      const result = {
        transpilation: transpileResult,
        execution: executeResult,
        totalTime: transpileMetric + executionMetric
      };
            
      this.emit("fullProcessComplete", result);
      const timing = t.end({ sizeIn: jsCode.length, totalTime: result.totalTime });
      if (metrics.PERF_ENABLE) {
        metrics.incrementCounter("fullPipelines");
        metrics.recordEvent("pipeline.complete", timing);
      }
      return result;
            
    } catch (error) {
      t.end({ error: true });
      this.emit("fullProcessError", { error: error.message });
      throw error;
    }
  }

  /**
     * Profiles a piece of code.
     * @param {string} code - The code to profile.
     * @param {object} [options={}] - Profiling options.
     * @returns {Promise<object>} A promise that resolves with the profiling report.
     */
  async profile(code, options = {}) {
    const performance = this.components.get("performance");
    if (!performance) throw new Error("Performance tools not enabled");
        
    return performance.profile(code, options);
  }

  /**
     * Benchmarks a piece of code.
     * @param {string} code - The code to benchmark.
     * @param {number} [iterations=1000] - The number of iterations to run.
     * @returns {Promise<object>} A promise that resolves with the benchmark results.
     */
  async benchmark(code, iterations = 1000) {
    const performance = this.components.get("performance");
    if (!performance) throw new Error("Performance tools not enabled");
        
    return performance.benchmark(code, iterations);
  }

  /**
     * Optimizes a piece of code.
     * @param {string} code - The code to optimize.
     * @param {object} [options={}] - Optimization options.
     * @returns {Promise<object>} A promise that resolves with the optimization results.
     */
  async optimize(code, options = {}) {
    const performance = this.components.get("performance");
    if (!performance) throw new Error("Performance tools not enabled");
        
    return performance.optimize(code, options);
  }

  /**
     * Creates a new project in the IDE.
     * @param {string} name - The name of the project.
     * @param {string} [template='basic'] - The project template.
     * @returns {Promise<object>} A promise that resolves with the project object.
     */
  async createProject(name, template = "basic") {
    const ide = this.components.get("ide");
    if (!ide) throw new Error("IDE not enabled");
        
    return ide.createProject(name, template);
  }

  /**
     * Opens a file in the IDE.
     * @param {string} filePath - The path to the file.
     * @returns {Promise<object>} A promise that resolves with the file object.
     */
  async openFile(filePath) {
    const ide = this.components.get("ide");
    if (!ide) throw new Error("IDE not enabled");
        
    return ide.openFile(filePath);
  }

  /**
     * Gets code completions from the IDE.
     * @param {string} filePath - The path to the file.
     * @param {object} position - The position in the file.
     * @returns {Promise<object[]>} A promise that resolves with an array of completions.
     */
  async getCodeCompletion(filePath, position) {
    const ide = this.components.get("ide");
    if (!ide) throw new Error("IDE not enabled");
        
    return ide.getCodeCompletion(filePath, position);
  }

  /**
     * Starts a debugging session in the IDE.
     * @param {string} filePath - The path to the file.
     * @param {object} [config={}] - Debugger configuration.
     * @returns {Promise<object>} A promise that resolves with the debugger session object.
     */
  async startDebugging(filePath, config = {}) {
    const ide = this.components.get("ide");
    if (!ide) throw new Error("IDE not enabled");
        
    return ide.startDebugging(filePath, config);
  }

  /**
     * Transforms code with OOP features.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformWithOOP(code) {
    const advanced = this.components.get("advanced");
    if (!advanced) throw new Error("Advanced features not enabled");
        
    return advanced.transform(code, ["oop"]);
  }

  /**
     * Transforms code with pattern matching features.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformWithPatterns(code) {
    const advanced = this.components.get("advanced");
    if (!advanced) throw new Error("Advanced features not enabled");
        
    return advanced.transform(code, ["patterns"]);
  }

  /**
     * Transforms code with type system features.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     */
  transformWithTypes(code) {
    const advanced = this.components.get("advanced");
    if (!advanced) throw new Error("Advanced features not enabled");
        
    return advanced.transform(code, ["types"]);
  }

  /**
     * Gets the current status of the system.
     * @returns {object} The system status.
     */
  getSystemStatus() {
    return {
      ...this.stats,
      components: Array.from(this.components.keys()),
      uptime: Date.now() - this.stats.startTime,
      mode: this.options.mode,
      version: this.stats.version
    };
  }

  /**
     * Gets a comprehensive performance report from all components.
     * @returns {object} The performance report.
     */
  getPerformanceReport() {
    const reports = {};
        
    for (const [name, component] of this.components) {
      if (component.getPerformanceReport) {
        reports[name] = component.getPerformanceReport();
      } else if (component.getStats) {
        reports[name] = component.getStats();
      }
    }
        
    return {
      system: this.getSystemStatus(),
      components: reports,
      timestamp: new Date().toISOString()
    };
  }

  /**
     * Reports component availability and points to strict evidence gates.
     * This snapshot is advisory; it does not certify readiness by itself.
     * @returns {Promise<object>} A promise that resolves with the evidence snapshot.
     */
  async validateEvidence() {
    await this.initializationPromise;

    const componentChecks = [
      "transpiler",
      "runtime",
      "advanced",
      "performance",
      "ide"
    ].map((name) => ({
      name,
      enabled: this.options[`enable${name[0].toUpperCase()}${name.slice(1)}`] !== false,
      loaded: this.components.has(name)
    }));

    const strictGates = [
      "npm run claims:check",
      "npm run verify",
      "npm test",
      "npm run clarity:dogfood",
      "npm run clarity:canon",
      "npm run clarity:languages",
      "npm run stubs:check"
    ];

    const snapshot = {
      advisory: true,
      statusAuthority: [
        "PROJECT_STATUS.md",
        "docs/LANGUAGE_SUPPORT_MATRIX.md",
        "docs/LUASCRIPT_MEGA_PLAN.md"
      ],
      componentChecks,
      strictGates,
      message: "Component availability is not a production-readiness claim. Run the strict gates for current support evidence."
    };

    console.log("LUASCRIPT evidence snapshot");
    console.log("=".repeat(80));
    for (const check of componentChecks) {
      console.log(`   ${check.name}: ${check.loaded ? "loaded" : "not loaded"}`);
    }
    console.log("\nStrict readiness gates:");
    for (const gate of strictGates) {
      console.log(`   ${gate}`);
    }
    console.log("\nThis snapshot is advisory; current support claims come from live gates and status docs.");
    console.log("=".repeat(80));

    return snapshot;
  }

  /**
     * Clears the caches of all components.
     */
  clearCaches() {
    for (const component of this.components.values()) {
      if (component.clearCache) {
        component.clearCache();
      }
    }
  }

  /**
     * Shuts down the unified system and all its components.
     */
  shutdown() {
    this.emit("shutdownStart");
        
    for (const component of this.components.values()) {
      if (component.shutdown) {
        component.shutdown();
      }
    }
        
    this.components.clear();
    this.stats.initialized = false;
    if (metrics.PERF_ENABLE) {
      try { 
        metrics.snapshot("unified"); 
      } catch {
        // Metrics snapshot failed - non-critical
      }
    }
        
    this.emit("shutdownComplete");
  }

  /**
     * Creates a new UnifiedLuaScript instance in development mode.
     * @param {object} [options={}] - Configuration options.
     * @returns {UnifiedLuaScript} A new instance in development mode.
     */
  static createDevelopment(options = {}) {
    return new UnifiedLuaScript({ ...options, mode: "development" });
  }

  /**
     * Creates a new UnifiedLuaScript instance in production mode.
     * @param {object} [options={}] - Configuration options.
     * @returns {UnifiedLuaScript} A new instance in production mode.
     */
  static createProduction(options = {}) {
    return new UnifiedLuaScript({ ...options, mode: "production" });
  }

  /**
     * Creates a new UnifiedLuaScript instance in enterprise mode.
     * @param {object} [options={}] - Configuration options.
     * @returns {UnifiedLuaScript} A new instance in enterprise mode.
     */
  static createEnterprise(options = {}) {
    return new UnifiedLuaScript({ ...options, mode: "enterprise" });
  }

  /**
     * Reports component availability without starting the IDE subsystem.
     * @returns {Promise<object>} A promise that resolves with the evidence snapshot.
     */
  static async validateEvidenceStatic() {
    const system = new UnifiedLuaScript({ enableIDE: false });
    try {
      await system.initializationPromise;
      return await system.validateEvidence();
    } finally {
      system.shutdown();
    }
  }
}

module.exports = {
  UnifiedLuaScript,
  // Re-export all components for direct access
  CoreTranspiler,
  RuntimeSystem,
  AdvancedFeatures,
  PerformanceTools,
  AgenticIDE
};
